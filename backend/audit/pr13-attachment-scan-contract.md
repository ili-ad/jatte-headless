# PR13 attachment malware-scanning contract

## Production routes and bindings

| Route | Effective view (`jatte.urls`) | Upload/storage behavior | Authorization and state |
| --- | --- | --- | --- |
| `POST /attachments/sign/`, `POST /api/attachments/sign/` | `chat.api_views.SignAttachmentView` | Issues a signed PUT only for the configured private pending bucket | Fully validated Supabase JWT with `is_anonymous=false`, then existing room/message authorization; creates a user-bound upload session only after authorization |
| `POST /attachments/commit/`, `POST /api/attachments/commit/` | `chat.api_views.CommitAttachmentView` | Verifies the pending object SHA-256/size, persists pending metadata, and schedules scanning | Same permanent-user requirement; upload session user, room, message, CID, blob and size are server-bound |
| `POST /attachments/`, `POST /api/attachments/` | `chat.api_views.AttachmentUploadView` | Compatibility metadata only; no blob and no clean verdict | Permanent-user JWT required; returned placeholder remains pending and cannot be downloaded |
| `GET /api/attachments/<id>/download/` | `chat.api_views.AttachmentDownloadView` | Signs a private GET only for the configured clean bucket | Existing owning-room authorization, valid attachment integrity signature, `scan_status=clean`, and `storage_class=clean`; pending=423, flagged=403, error=503 |

The frontend compatibility attachment manager currently calls
`POST /attachments/`. Direct sign/PUT/commit consumers use the two-phase API.

## Storage and scan lifecycle

1. The application signs uploads only into `CHAT_ATTACHMENTS_PENDING_BUCKET`.
2. Commit verifies the exact blob SHA-256 and size and persists uploader, room,
   message, CID, pending bucket and blob metadata under the server integrity
   signature.
3. `scan_attachment(message_id, attachment_id)` reloads the authoritative
   attachment; task arguments cannot select a room, bucket, blob or verdict.
4. The provider-neutral scanner receives only the authoritative pending object
   and expected identity. The `gcp_clamav` provider invokes a private Cloud Run
   service with an ADC identity token.
5. JATTE accepts clean/flagged only when attachment ID, source bucket/blob,
   SHA-256, size, optional generation and expected destination all agree.
6. Clean objects reside in the private clean bucket. Flagged objects reside in
   the private quarantine bucket. Errors stay inaccessible in pending storage.
7. Clean/flagged duplicate deliveries are terminal no-ops. Error may be retried,
   but only a later successful real scan can produce clean.

No disabled, unavailable, test, or unimplemented production scanner path maps
to clean. Historical blobless placeholders remain pending compatibility
metadata and cannot obtain a download URL.

## Production configuration and file policy

Uploads are disabled unless pending, clean and quarantine buckets, scanner
backend, and signing identity are configured. Production accepts only
`gcp_clamav`, requires a private scanner URL/audience, and rejects an empty MIME
allowlist. The initial recommended allowlist is:

- `application/pdf`
- `text/plain`
- `image/png`
- `image/jpeg`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

Executables, scripts, archives, and encrypted/uninspectable documents are not
allowed as ordinary attachments. Quarantine is private, has no application
download path, and should use a bounded bucket lifecycle policy.

## GCP boundary

The infrastructure definition follows Google Cloud's Cloud Storage malware
scanning reference: private pending/clean/quarantine buckets, a private Cloud
Run ClamAV service, dedicated least-privilege service identities, and a CVD
mirror updated by Cloud Scheduler. JATTE uses IAM/ADC service-to-service
authentication; no scanner password is stored in attachment metadata or code.

The reproducible artifact in `deploy/gcp/attachment-scanner/image/` overlays
the JATTE request adapter onto Google's scanner at commit
`4e51c17b1db6adef5daaaf7caeff6cfe546f21bf`. It reads the exact requested GCS
generation, verifies size and SHA-256 while streaming the bytes through the
real ClamAV daemon, rejects stale or unparseable definitions, and copies only a
recognized clean or malware-found result to the configured destination.
Terraform accepts only an image reference pinned by an immutable `@sha256:`
digest.

## Commissioning audit (2026-08-09)

The authorized target is project `notice-to-owner-01`, region `us-east1`.
Terraform created the private pending, clean, quarantine, and CVD buckets plus
the dedicated scanner/scheduler service accounts. The VM/JATTE candidate
identity `517119819257-compute@developer.gserviceaccount.com` received only
pending object-creator/viewer and clean object-viewer bucket roles; it has no
quarantine or CVD access.

Commissioning remains incomplete. `nto-server-01` has ADC for that VM identity,
but its OAuth access scopes omit `cloud-platform`, so it cannot manage Cloud
Run, Artifact Registry, Cloud Build, Scheduler, or project IAM. The local
operator can manage the prerequisite resources but Cloud Build rejects build
creation. No JATTE-headless checkout/service or `CHAT_ATTACHMENTS_*`
configuration exists on the VM, including no legacy `CHAT_ATTACHMENTS_BUCKET`.
Consequently no immutable image digest, Cloud Run service, CVD execution, or
real sign/commit/download benign, EICAR, and unavailable-scanner receipt is yet
available. PR7-09 remains open until those live checks succeed.
