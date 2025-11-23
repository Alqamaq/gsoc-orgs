#!/usr/bin/env python3
"""
r2_test_upload.py

Simple test uploader for Cloudflare R2 (S3-compatible API).
Tests uploading a single sample file to verify credentials work.

Usage:
  1. Set DRY_RUN=true in .env to test without uploading
  2. Run: python r2_test_upload.py
  3. If successful, set DRY_RUN=false and run again to actually upload
"""

import os
from dotenv import load_dotenv
load_dotenv()

import boto3
from pathlib import Path

# Config from env
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
DRY_RUN = os.getenv("DRY_RUN", "true").lower() in ("1", "true", "yes")

if not (R2_ACCESS_KEY and R2_SECRET_KEY and R2_ACCOUNT_ID and R2_BUCKET):
    print("[error] Missing one or more R2 env vars. Check your .env file:")
    print("  - R2_ACCESS_KEY_ID")
    print("  - R2_SECRET_ACCESS_KEY")
    print("  - R2_ACCOUNT_ID")
    print("  - R2_BUCKET_NAME")
    print("  - R2_PUBLIC_URL (optional)")
    raise SystemExit(1)

# Look for a test image in parent directory
test_images = [
    "../test-image.jpg",
    "test-image.jpg",
    "../api-data-scrapper/test-image.jpg"
]

LOCAL_PATH = None
for img_path in test_images:
    if os.path.exists(img_path):
        LOCAL_PATH = img_path
        break

if not LOCAL_PATH:
    print("[error] No test image found. Tried:")
    for p in test_images:
        print(f"  - {p}")
    print("\nPlease place a test image (test-image.jpg) in the project root.")
    raise SystemExit(1)

# Choose key (file name) to put into R2
key = "test-sample-gsoc-logo.png"

# Prepare S3 client for R2
ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
s3 = boto3.client(
    "s3",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    endpoint_url=ENDPOINT
)

# Read test file
with open(LOCAL_PATH, "rb") as f:
    data = f.read()

print(f"[info] Test file: {LOCAL_PATH} ({len(data)} bytes)")
print(f"[info] R2 Bucket: {R2_BUCKET}")
print(f"[info] R2 Endpoint: {ENDPOINT}")
print(f"[info] Target key: {key}")
print(f"[info] DRY_RUN = {DRY_RUN}")
print()

if DRY_RUN:
    print("[dry-run] Would upload to:")
    if R2_PUBLIC_URL:
        print(f"  {R2_PUBLIC_URL}/{key}")
    else:
        print(f"  {ENDPOINT}/{R2_BUCKET}/{key}")
    print("\n[dry-run] Set DRY_RUN=false in .env to actually upload.")
else:
    try:
        print("[info] Uploading to R2...")
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=data,
            ContentType="image/png"
        )
        print("[success] Upload completed!")
        print("\nPublic URL:")
        if R2_PUBLIC_URL:
            print(f"  {R2_PUBLIC_URL}/{key}")
        else:
            print(f"  {ENDPOINT}/{R2_BUCKET}/{key}")
        print("\nOpen this URL in your browser to verify the upload.")
    except Exception as e:
        print(f"[error] Upload failed: {e}")
        print("\nCommon issues:")
        print("  - Wrong Access Key or Secret Key")
        print("  - Wrong Account ID")
        print("  - Bucket doesn't exist or wrong name")
        print("  - Network connectivity issue")
        raise SystemExit(1)

