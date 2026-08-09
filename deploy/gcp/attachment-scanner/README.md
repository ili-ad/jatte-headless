# Private Cloud Run ClamAV scanner

This module prepares the JATTE storage and IAM boundary following Google's
[Cloud Storage malware-scanning reference architecture](https://cloud.google.com/architecture/automate-malware-scanning-for-documents-uploaded-to-cloud-storage):
private pending, clean, quarantine and CVD-mirror buckets; a private Cloud Run
service; dedicated scanner/scheduler identities; and a two-hour definition
mirror update schedule.

Build `scanner_image` from Google's
[`docker-clamav-malware-scanner`](https://github.com/GoogleCloudPlatform/docker-clamav-malware-scanner)
at a reviewed immutable commit. The JATTE-compatible HTTP adapter must accept
the request documented in `backend/audit/pr13-attachment-scan-contract.md`,
perform the upstream ClamAV scan/move operation, and return the exact object,
checksum, size, engine and definition fields consumed by
`GCPClamAVScanner`. It must reject encrypted/uninspectable content and stale or
unavailable definitions instead of returning clean.

No `allUsers` Cloud Run binding is created. Set `jatte_service_account` to the
worker's service account; JATTE obtains an audience-bound identity token through
ADC. Apply with an immutable image digest, then set the four output values in
the corresponding `CHAT_ATTACHMENTS_*` environment variables.

After deployment, commission with a benign allowed document and the harmless
EICAR standard test file. Confirm the former reaches the clean bucket and can be
downloaded by an authorized room member, while EICAR reaches quarantine and
returns 403 through JATTE. A deliberately unreachable scanner must produce
`scan_status=error` and a 503 download response.
