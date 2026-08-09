locals {
  prefix = "jatte-attachments"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "pending" {
  name                        = "${local.prefix}-pending-${var.project_id}"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  lifecycle_rule {
    condition {
      age = var.pending_retention_days
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "clean" {
  name                        = "${local.prefix}-clean-${var.project_id}"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

resource "google_storage_bucket" "quarantine" {
  name                        = "${local.prefix}-quarantine-${var.project_id}"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  lifecycle_rule {
    condition {
      age = var.quarantine_retention_days
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket" "cvd_mirror" {
  name                        = "${local.prefix}-cvd-${var.project_id}"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

resource "google_service_account" "scanner" {
  account_id   = "jatte-malware-scanner"
  display_name = "JATTE private ClamAV scanner"
}

resource "google_service_account" "scheduler" {
  account_id   = "jatte-clamav-cvd-scheduler"
  display_name = "JATTE ClamAV definition mirror scheduler"
}

resource "google_storage_bucket_iam_member" "scanner_pending" {
  bucket = google_storage_bucket.pending.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.scanner.email}"
}

resource "google_storage_bucket_iam_member" "scanner_clean" {
  bucket = google_storage_bucket.clean.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.scanner.email}"
}

resource "google_storage_bucket_iam_member" "scanner_quarantine" {
  bucket = google_storage_bucket.quarantine.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.scanner.email}"
}

resource "google_storage_bucket_iam_member" "scanner_cvd" {
  bucket = google_storage_bucket.cvd_mirror.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.scanner.email}"
}

resource "google_cloud_run_v2_service" "scanner" {
  name     = "jatte-malware-scanner"
  location = var.region

  template {
    service_account = google_service_account.scanner.email
    timeout         = "300s"
    scaling {
      min_instance_count = 1
      max_instance_count = 5
    }
    containers {
      image = var.scanner_image
      resources {
        limits = { cpu = "1", memory = "4Gi" }
        cpu_idle = false
        startup_cpu_boost = true
      }
      env {
        name  = "PENDING_BUCKET"
        value = google_storage_bucket.pending.name
      }
      env {
        name  = "CLEAN_BUCKET"
        value = google_storage_bucket.clean.name
      }
      env {
        name  = "QUARANTINE_BUCKET"
        value = google_storage_bucket.quarantine.name
      }
      env {
        name  = "CVD_MIRROR_BUCKET"
        value = google_storage_bucket.cvd_mirror.name
      }
    }
    max_instance_request_concurrency = 20
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service_iam_member" "jatte_invoker" {
  location = google_cloud_run_v2_service.scanner.location
  name     = google_cloud_run_v2_service.scanner.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.jatte_service_account}"
}

resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  location = google_cloud_run_v2_service.scanner.location
  name     = google_cloud_run_v2_service.scanner.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_cloud_scheduler_job" "cvd_update" {
  name      = "jatte-clamav-cvd-update"
  region    = var.region
  schedule  = "17 */2 * * *"
  time_zone = "Etc/UTC"

  http_target {
    uri         = google_cloud_run_v2_service.scanner.uri
    http_method = "POST"
    headers     = { "Content-Type" = "application/json" }
    body        = base64encode(jsonencode({ kind = "schedule#cvd_update" }))
    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.scanner.uri
    }
  }
}
