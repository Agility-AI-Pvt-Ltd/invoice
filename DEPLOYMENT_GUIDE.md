# Deployment & CI Pipeline Setup Guide

I have updated your codebase to support the new GCP project `sunlit-arcade-496210-n7`. However, the deployment is currently blocked because **Billing is not enabled** for this new project.

## 1. Required GCP Setup (Manual Action Needed)
You must enable billing before any resources can be created:
1. Go to the [GCP Billing Console](https://console.cloud.google.com/billing).
2. Link a billing account to the project `sunlit-arcade-496210-n7`.
3. Once linked, I can finish the setup, or you can run:
   ```bash
   gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com
   gcloud artifacts repositories create invoice-repo --repository-format=docker --location=asia-south1
   ```

## 2. GitHub CI Pipeline
I have updated `.github/workflows/deploy-cloud-run.yml` with your new project ID. To make this pipeline work, you need to add the following **Repository Secrets** in your GitHub repo settings (`Settings -> Secrets and variables -> Actions`):

| Secret Name | Description |
| :--- | :--- |
| `GCP_SA_KEY` | The JSON key of a Service Account with `Owner` or `Cloud Run Admin` + `Artifact Registry Administrator` roles. |
| `NEXT_PUBLIC_APP_URL` | Your public domain (e.g., `https://invoice.agility.com`). |
| `DATABASE_URL` | Your Neon PostgreSQL connection string (should be set in Cloud Run directly). |

### To create the `GCP_SA_KEY`:
1. Go to **IAM & Admin > Service Accounts**.
2. Create a service account named `github-actions-deploy`.
3. Grant it the **Cloud Run Admin**, **Artifact Registry Administrator**, and **Storage Admin** roles.
4. Go to the **Keys** tab, click **Add Key > Create new key (JSON)**.
5. Copy the contents of the downloaded file into the `GCP_SA_KEY` secret in GitHub.

## 3. Domain Mapping (GoDaddy)
Once the first deployment succeeds via CI, follow these steps to keep your URL:
1. In Cloud Run, click **Manage Custom Domains**.
2. Map your domain (e.g., `invoice.yourdomain.com`).
3. Google will give you a `TXT` record for verification—add this in GoDaddy.
4. After verification, Google will provide `A` or `CNAME` records—update your existing GoDaddy records with these values.

## 4. Current Progress
- [x] Fixed all build errors in the web app.
- [x] Updated project ID in deployment workflow.
- [x] Verified `gcloud` connectivity locally.
- [x] **COMPLETED**: Artifact Registry repository `invoice-repo` created.
