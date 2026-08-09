locals {
  prefix = "jatte-attachments"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "scanner" {
  location      = var.region
  repository_id = "jatte-security"
  description   = "Immutable JATTE security service images"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
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

resource "google_service_account" "attachment_signer" {
  account_id   = "jatte-attachment-signer"
  display_name = "JATTE keyless attachment URL signer"
}

resource "google_project_iam_custom_role" "attachment_sign_blob" {
  role_id     = "jatteAttachmentSignBlob"
  title       = "JATTE attachment signBlob"
  description = "Permits only IAM signBlob for keyless attachment V4 URLs."
  permissions = ["iam.serviceAccounts.signBlob"]
}

resource "google_service_account_iam_member" "runtime_sign_blob" {
  service_account_id = google_service_account.attachment_signer.name
  role               = google_project_iam_custom_role.attachment_sign_blob.name
  member             = "serviceAccount:${var.jatte_service_account}"
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

resource "google_storage_bucket_iam_member" "jatte_pending_creator" {
  bucket = google_storage_bucket.pending.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${var.jatte_service_account}"
}

resource "google_storage_bucket_iam_member" "jatte_pending_viewer" {
  bucket = google_storage_bucket.pending.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.jatte_service_account}"
}

resource "google_storage_bucket_iam_member" "jatte_clean_viewer" {
  bucket = google_storage_bucket.clean.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.jatte_service_account}"
}

resource "google_storage_bucket_iam_member" "signer_pending_creator" {
  bucket = google_storage_bucket.pending.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.attachment_signer.email}"
}

resource "google_storage_bucket_iam_member" "signer_pending_viewer" {
  bucket = google_storage_bucket.pending.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.attachment_signer.email}"
}

resource "google_storage_bucket_iam_member" "signer_clean_viewer" {
  bucket = google_storage_bucket.clean.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.attachment_signer.email}"
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
        limits            = { cpu = "1", memory = "4Gi" }
        cpu_idle          = false
        startup_cpu_boost = true
      }
      env {
        name = "CONFIG_JSON"
        value = jsonencode({
          buckets = [{
            unscanned   = google_storage_bucket.pending.name
            clean       = google_storage_bucket.clean.name
            quarantined = google_storage_bucket.quarantine.name
          }]
          ClamCvdMirrorBucket   = google_storage_bucket.cvd_mirror.name
          fileExclusionPatterns = []
          ignoreZeroLengthFiles = false
          quarantine = {
            encryptedFiles         = true
            fileExtensionAllowList = ["pdf", "txt", "png", "jpg", "jpeg", "docx", "xlsx"]
            fileExtensionDenyList  = []
          }
        })
      }
    }
    max_instance_request_concurrency = 20
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_job" "cvd_seed" {
  name     = "jatte-clamav-cvd-seed"
  location = var.region

  template {
    template {
      service_account = google_service_account.scanner.email
      timeout         = "900s"
      containers {
        image   = var.scanner_image
        command = ["bash"]
        args    = ["updateCvdMirror.sh", google_storage_bucket.cvd_mirror.name]
        resources {
          limits = { cpu = "1", memory = "2Gi" }
        }
      }
      max_retries = 1
    }
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
