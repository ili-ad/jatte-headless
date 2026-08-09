variable "project_id" {
  type = string
}
variable "region" {
  type    = string
  default = "us-east1"
}
variable "bucket_location" {
  type    = string
  default = "US-EAST1"
}
variable "scanner_image" {
  description = "Immutable image digest for the JATTE-compatible build of Google's Cloud Run ClamAV scanner."
  type        = string
  validation {
    condition     = can(regex("@sha256:[0-9a-f]{64}$", var.scanner_image))
    error_message = "scanner_image must be pinned by an immutable sha256 digest."
  }
}
variable "jatte_service_account" {
  description = "Service account email used by the JATTE attachment worker."
  type        = string
}
variable "quarantine_retention_days" {
  type    = number
  default = 30
}
variable "pending_retention_days" {
  type    = number
  default = 7
}
