/*
 * JATTE authenticated request adapter for Google's Cloud Run ClamAV scanner.
 * The container and ClamAV lifecycle are pinned to upstream commit
 * 4e51c17b1db6adef5daaaf7caeff6cfe546f21bf.
 */
import * as ClamdClient from 'clamdjs';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import express from 'express';
import {Storage} from '@google-cloud/storage';
import {GoogleAuth} from 'google-auth-library';
import {readAndVerifyConfig, Config} from './config';
import {logger} from './logger';
import * as metrics from './metrics';
import {Scanner} from './scanner';

const execFilePromise = promisify(execFile);
const MAX_DEFINITION_AGE_MS =
  Number(process.env.MAX_DEFINITION_AGE_HOURS ?? '48') * 3600_000;
const CLAMD_TIMEOUT_MS = 600_000;

interface ScanBody {
  attachment_id?: unknown;
  source?: {bucket?: unknown; blob?: unknown; generation?: unknown};
  expected?: {sha256?: unknown; size?: unknown};
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`missing ${name}`);
  return value.trim();
}

function clamMetadata(version: string): {
  engineVersion: string;
  definitionVersion: string;
} {
  const parts = version.replaceAll('\x00', '').trim().split('/');
  if (parts.length < 3 || !parts[0].startsWith('ClamAV '))
    throw new Error('unusable ClamAV version response');
  const definitionDate = new Date(parts.slice(2).join('/'));
  if (!Number.isFinite(definitionDate.getTime()))
    throw new Error('unusable ClamAV definition timestamp');
  if (Date.now() - definitionDate.getTime() > MAX_DEFINITION_AGE_MS)
    throw new Error('ClamAV definitions are stale');
  return {
    engineVersion: parts[0].slice('ClamAV '.length),
    definitionVersion: `${parts[1]}/${definitionDate.toISOString()}`,
  };
}

function malwareSignature(reply: string): string | undefined {
  const normalized = reply.replaceAll('\x00', '').trim();
  const match = /^stream: (.+) FOUND$/.exec(normalized);
  return match?.[1];
}

export class Server {
  readonly app = express();
  private readonly storage: Storage;
  constructor(
    private scanner: Scanner,
    private config: Config,
    private port: number,
    private proxyPort: number,
  ) {
    this.storage = scanner.storageClient;
    this.app.use(express.json({limit: '32kb'}));
    this.app.get('/ready', (_req, res) => void this.healthCheck(res));
    this.app.post('/', (req, res) => void this.post(req, res));
  }

  start(): void {
    this.app.listen(this.port);
  }

  async healthCheck(res: express.Response): Promise<void> {
    try {
      await this.scanner.pingClamD();
      if (this.proxyPort !== 0) {
        const response = await fetch(
          `http://localhost:${this.proxyPort}/ready`,
        );
        if (!response.ok) throw new Error('GCS proxy is unavailable');
      }
      res.status(200).json({message: 'Health Check Succeeded'});
    } catch (error) {
      logger.error({err: error}, 'scanner health check failed');
      res.status(500).json({message: 'Health Check Failed', status: 'error'});
    }
  }

  async post(req: express.Request, res: express.Response): Promise<void> {
    try {
      const body = req.body as unknown;
      if (
        typeof body === 'object' &&
        body !== null &&
        'kind' in body &&
        body.kind === 'schedule#cvd_update'
      ) {
        const result = await execFilePromise('./updateCvdMirror.sh', [
          this.config.ClamCvdMirrorBucket,
        ]);
        res.json({
          status: 'CvdUpdateComplete',
          updated: result.stdout.includes('Downloaded'),
        });
        return;
      }
      res.json(await this.scan(body as ScanBody));
    } catch (error) {
      logger.error({err: error}, 'JATTE malware scan failed closed');
      res.status(422).json({status: 'error', message: 'scan failed'});
    }
  }

  async scan(body: ScanBody): Promise<Record<string, unknown>> {
    const attachmentId = requiredString(body.attachment_id, 'attachment_id');
    const sourceBucket = requiredString(body.source?.bucket, 'source.bucket');
    const sourceBlob = requiredString(body.source?.blob, 'source.blob');
    const expectedSha256 = requiredString(
      body.expected?.sha256,
      'expected.sha256',
    ).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(expectedSha256))
      throw new Error('invalid expected SHA-256');
    const expectedSize = Number(body.expected?.size);
    if (!Number.isSafeInteger(expectedSize) || expectedSize < 0)
      throw new Error('invalid expected size');
    const rawGeneration = body.source?.generation;
    if (
      rawGeneration != null &&
      typeof rawGeneration !== 'string' &&
      typeof rawGeneration !== 'number'
    ) {
      throw new Error('invalid source.generation');
    }
    const generation =
      rawGeneration == null
        ? undefined
        : requiredString(String(rawGeneration), 'source.generation');
    const bucketDefs = this.config.buckets.find(
      (item) => item.unscanned === sourceBucket,
    );
    if (!bucketDefs)
      throw new Error('source bucket is not configured pending storage');

    const file = this.storage
      .bucket(sourceBucket)
      .file(sourceBlob, generation ? {generation} : undefined);
    const [metadata] = await file.getMetadata();
    const actualGeneration = requiredString(
      metadata.generation,
      'object generation',
    );
    if (generation && actualGeneration !== generation)
      throw new Error('object generation mismatch');
    if (Number(metadata.size) !== expectedSize)
      throw new Error('object size mismatch');

    const version = await this.scanner.getClamVersion();
    const clam = clamMetadata(version);
    const hash = createHash('sha256');
    const stream = file.createReadStream({validation: 'crc32c'});
    stream.on('data', (chunk: Buffer) => hash.update(chunk));
    let reply: string;
    try {
      reply = await this.scanner.clamdScanStream(stream, CLAMD_TIMEOUT_MS);
    } finally {
      stream.destroy();
    }
    const verifiedSha256 = hash.digest('hex');
    if (verifiedSha256 !== expectedSha256)
      throw new Error('object SHA-256 mismatch');

    let clean = ClamdClient.isCleanReply(reply);
    if (
      clean &&
      this.config.quarantine.fileExtensionAllowList.length > 0 &&
      !this.scanner.isExtensionInList(
        sourceBlob,
        this.config.quarantine.fileExtensionAllowList,
      )
    ) {
      reply = 'stream: Config.AllowList.Blocked FOUND';
      clean = false;
    }
    if (
      clean &&
      this.config.quarantine.fileExtensionDenyList.length > 0 &&
      this.scanner.isExtensionInList(
        sourceBlob,
        this.config.quarantine.fileExtensionDenyList,
      )
    ) {
      reply = 'stream: Config.DenyList.Blocked FOUND';
      clean = false;
    }
    const signature = clean ? undefined : malwareSignature(reply);
    if (!clean && !signature) throw new Error('unrecognized ClamAV verdict');
    const verdict = clean ? 'clean' : 'flagged';
    const destinationBucket = clean ? bucketDefs.clean : bucketDefs.quarantined;
    const destination = this.storage.bucket(destinationBucket).file(sourceBlob);
    await file.copy(destination, {
      preconditionOpts: {ifGenerationMatch: 0},
    });
    await file.delete({ifGenerationMatch: Number(actualGeneration)});

    logger.info(
      {
        attachmentId,
        sourceBucket,
        sourceBlob,
        actualGeneration,
        verifiedSha256,
        expectedSize,
        verdict,
        engineVersion: clam.engineVersion,
        definitionVersion: clam.definitionVersion,
      },
      'JATTE malware scan completed',
    );
    return {
      attachment_id: attachmentId,
      source_bucket: sourceBucket,
      source_blob: sourceBlob,
      object_generation: actualGeneration,
      verified_sha256: verifiedSha256,
      verified_size: expectedSize,
      verdict,
      destination_bucket: destinationBucket,
      destination_blob: sourceBlob,
      engine: 'ClamAV',
      engine_version: clam.engineVersion,
      definition_version: clam.definitionVersion,
      scanned_at: new Date().toISOString(),
      ...(signature ? {signature} : {}),
    };
  }
}

async function run(): Promise<void> {
  const projectId =
    process.env.PROJECT_ID ?? (await new GoogleAuth().getProjectId());
  metrics.init(projectId);
  const storage = new Storage();
  const config = await readAndVerifyConfig('./config.json', storage);
  const scanner = new Scanner(config, ClamdClient, storage, metrics);
  const deadline = Date.now() + 600_000;
  while (true) {
    try {
      await scanner.pingClamD();
      clamMetadata(await scanner.getClamVersion());
      break;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  new Server(
    scanner,
    config,
    Number(process.env.PORT ?? '8080'),
    Number(process.env.PROXY_PORT ?? '0'),
  ).start();
}

if (require.main === module)
  run().catch((error) => {
    logger.fatal({err: error}, 'scanner startup failed');
    process.exit(1);
  });
