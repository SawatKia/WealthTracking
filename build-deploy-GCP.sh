#! /bin/bash

echo "Building and deploying to Cloud Run..."
export PROJECT_ID=
export REGION=
export CONNECTION_NAME=

cd /backend/v0.2

gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/poll \
  --project $PROJECT_ID

gcloud run deploy poll \
  --image gcr.io/$PROJECT_ID/poll \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $CONNECTION_NAME \
  --project $PROJECT_ID