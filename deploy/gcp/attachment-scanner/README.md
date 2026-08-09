# Private Cloud Run ClamAV scanner

This module prepares the JATTE storage and IAM boundary following Google's
[Cloud Storage malware-scanning reference architecture](https://cloud.google.com/architecture/automate-malware-scanning-for-documents-uploaded-to-cloud-storage):
private pending, clean, quarantine and CVD-mirror buckets; a private Cloud Run
service; dedicated scanner/scheduler identities; and a two-hour definition
mirror update schedule.

Terraform state is stored in the private, versioned
`notice-to-owner-01-jatte-terraform-state` bucket under the
`attachment-scanner` prefix. That backend bucket is the sole bootstrap resource
and must exist before `terraform init`; it is deliberately not managed by this
module.

The `image/` directory contains the JATTE HTTP adapter and its reproducible
container build. It uses Google's
[`docker-clamav-malware-scanner`](https://github.com/GoogleCloudPlatform/docker-clamav-malware-scanner)
at commit `4e51c17b1db6adef5daaaf7caeff6cfe546f21bf` as the pinned ClamAV,
definition-mirror, bootstrap, and metrics foundation. Build and push it with
an isolated builder, then pass the resulting Artifact Registry reference
pinned by `@sha256:` as `scanner_image`; floating tags are rejected. The
production image commissioned for this revision is
`us-east1-docker.pkg.dev/notice-to-owner-01/jatte-security/attachment-scanner@sha256:71f3e6c8378c2d718b47f3954414f46c2c986c607d33abe877e53b5620ad1a4e`.

```sh
gcloud builds submit image \
  --project=notice-to-owner-01 \
  --region=us-east1 \
  --tag=us-east1-docker.pkg.dev/notice-to-owner-01/jatte-security/attachment-scanner:pr13
```

For a new deployment, first apply the API, Artifact Registry, bucket, identity,
and IAM resources. After publishing the image, apply the `cvd_seed` job with
the immutable digest and execute it once before creating the scanner service.
This breaks the intentional bootstrap dependency: ClamAV refuses to start
without usable definitions in the private mirror.

No `allUsers` Cloud Run binding is created. Set `jatte_service_account` to the
worker's service account; JATTE obtains an audience-bound identity token through
ADC. The module creates a dedicated attachment-signing service account and
grants the runtime only `iam.serviceAccounts.signBlob` on that identity, so V4
upload/download URLs require no exported private key. Set
`CHAT_ATTACHMENTS_SIGNING_SERVICE_ACCOUNT` to the `attachment_signer` output.
Apply with an immutable image digest, then set the remaining outputs in the
corresponding `CHAT_ATTACHMENTS_*` environment variables.

After deployment, commission with a benign allowed document and the harmless
EICAR standard test file. Confirm the former reaches the clean bucket and can be
downloaded by an authorized room member, while EICAR reaches quarantine and
returns 403 through JATTE. A deliberately unreachable scanner must produce
`scan_status=error` and a 503 download response.
