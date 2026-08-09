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
Terraform state is stored in the private, versioned
`notice-to-owner-01-jatte-terraform-state` bucket. State migration preserved
the existing resources without recreation. Terraform created the private
pending, clean, quarantine, and CVD buckets plus dedicated scanner, scheduler,
and URL-signing service accounts. The JATTE runtime identity
`517119819257-compute@developer.gserviceaccount.com` has only pending
object-creator/viewer, clean object-viewer, Cloud Run invoker, and the custom
single-permission `iam.serviceAccounts.signBlob` role on
`jatte-attachment-signer`. It has no quarantine or CVD access and no private
key was created. A temporary cloud-platform-scoped commissioning VM using the
runtime identity successfully called IAM Credentials `signBlob` for that
designated signer (HTTP 200 with a signed response) and was then deleted.

The scanner image was built on an ephemeral GCE builder with only
repository-scoped Artifact Registry writer access. The builder VM, service
account, and temporary repository binding were deleted after publication. The
deployed immutable image is:

`us-east1-docker.pkg.dev/notice-to-owner-01/jatte-security/attachment-scanner@sha256:71f3e6c8378c2d718b47f3954414f46c2c986c607d33abe877e53b5620ad1a4e`

The private `jatte-malware-scanner` Cloud Run service rejects unauthenticated
requests (HTTP 403), while the intended runtime identity receives HTTP 200.
The CVD seed execution succeeded, an authenticated forced Scheduler update
completed with HTTP 200, and live scans reported ClamAV 1.5.3 with definition
`28087/2026-08-09T06:24:56.000Z`.

A benign live scanner request returned clean for the exact 50-byte object,
copied it only to clean storage, and removed pending. A live standard EICAR
request returned flagged with `Eicar-Signature`, copied it only to quarantine,
and removed pending. These tests exercised the real private Cloud Run service,
not a mock. A controlled exact-object integrity failure returned HTTP 422 and
left the object only in pending storage; neither clean nor quarantine received
a copy. Unit/task coverage separately proves unavailable/timeout responses
persist `scan_status=error` and never become downloadable.

Full JATTE HTTP commissioning remains incomplete: no JATTE-headless deployment
exists on `nto-server-01`, and no usable permanent Supabase end-user session was
available without creating a new external user. Therefore the real
sign/PUT/commit/task/download flow and its persisted scanner-unavailable state
have not yet been claimed as commissioned. PR7-09 remains open until those
application-level checks succeed.
