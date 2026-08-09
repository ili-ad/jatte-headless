terraform {
  required_version = ">= 1.6.0"
  backend "gcs" {
    bucket = "notice-to-owner-01-jatte-terraform-state"
    prefix = "attachment-scanner"
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
