# Private Cloud Run ClamAV scanner

This module prepares the JATTE storage and IAM boundary following Google's
[Cloud Storage malware-scanning reference architecture](https://cloud.google.com/architecture/automate-malware-scanning-for-documents-uploaded-to-cloud-storage):
private pending, clean, quarantine and CVD-mirror buckets; a private Cloud Run
service; dedicated scanner/scheduler identities; and a two-hour definition
mirror update schedule.

The `image/` directory contains the JATTE HTTP adapter and its reproducible
container build. It uses Google's
[`docker-clamav-malware-scanner`](https://github.com/GoogleCloudPlatform/docker-clamav-malware-scanner)
at commit `4e51c17b1db6adef5daaaf7caeff6cfe546f21bf` as the pinned ClamAV,
definition-mirror, bootstrap, and metrics foundation. Build and push it with
Cloud Build, then pass the resulting Artifact Registry reference pinned by
`@sha256:` as `scanner_image`; floating tags are rejected.

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
ADC. Apply with an immutable image digest, then set the four output values in
the corresponding `CHAT_ATTACHMENTS_*` environment variables.

After deployment, commission with a benign allowed document and the harmless
EICAR standard test file. Confirm the former reaches the clean bucket and can be
downloaded by an authorized room member, while EICAR reaches quarantine and
returns 403 through JATTE. A deliberately unreachable scanner must produce
`scan_status=error` and a 503 download response.
