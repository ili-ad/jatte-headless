output "scanner_url" {
  value = google_cloud_run_v2_service.scanner.uri
}
output "pending_bucket" {
  value = google_storage_bucket.pending.name
}
output "clean_bucket" {
  value = google_storage_bucket.clean.name
}
output "quarantine_bucket" {
  value = google_storage_bucket.quarantine.name
}
output "cvd_mirror_bucket" {
  value = google_storage_bucket.cvd_mirror.name
}
output "scanner_service_account" {
  value = google_service_account.scanner.email
}
output "scheduler_service_account" {
  value = google_service_account.scheduler.email
}
output "attachment_signing_service_account" {
  value = google_service_account.attachment_signer.email
}
output "scheduler_job" {
  value = google_cloud_scheduler_job.cvd_update.name
}
output "artifact_repository" {
  value = google_artifact_registry_repository.scanner.name
}
