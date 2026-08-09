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
