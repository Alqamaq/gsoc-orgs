#!/usr/bin/env python3
"""
download_and_upload_logos.py

Downloads organization logos from GSoC and uploads them to Cloudflare R2.
Updates MongoDB with the R2 URL and local filename.

Usage:
  # Test with a single org
  python download_and_upload_logos.py --test-org unikraft

  # Process all orgs without logos
  python download_and_upload_logos.py

  # Process specific orgs
  python download_and_upload_logos.py --orgs unikraft jitsi oppia-foundation

  # Dry run (don't actually upload)
  python download_and_upload_logos.py --dry-run
"""

import os
import sys
import time
import argparse
from datetime import datetime
from urllib.parse import urlparse
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import requests
import boto3
from pymongo import MongoClient

# ----------------- CONFIG -----------------
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "gsoc_archive")

DRY_RUN = os.getenv("DRY_RUN", "false").lower() in ("1", "true", "yes")
SLEEP_SECONDS = float(os.getenv("SLEEP_SECONDS", "0.6"))

REQUEST_HEADERS = {"User-Agent": "gsoc-logo-downloader/1.0"}
REQUEST_TIMEOUT = 15

# Local directory for logo storage
LOGOS_DIR = Path("./logos")
LOGOS_DIR.mkdir(exist_ok=True)
# ------------------------------------------

def validate_config():
    """Validate that all required config is present."""
    missing = []
    if not R2_ACCESS_KEY:
        missing.append("R2_ACCESS_KEY_ID")
    if not R2_SECRET_KEY:
        missing.append("R2_SECRET_ACCESS_KEY")
    if not R2_ACCOUNT_ID:
        missing.append("R2_ACCOUNT_ID")
    if not R2_BUCKET:
        missing.append("R2_BUCKET_NAME")
    if not MONGO_URI:
        missing.append("MONGO_URI")
    
    if missing:
        print("[error] Missing required environment variables:")
        for var in missing:
            print(f"  - {var}")
        print("\nPlease add them to your .env file.")
        sys.exit(1)

def connect_mongo():
    """Connect to MongoDB."""
    client = MongoClient(MONGO_URI)
    return client[MONGO_DB]

def get_r2_client():
    """Create and return S3 client for R2."""
    endpoint = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        endpoint_url=endpoint
    )

def download_logo(url, output_path):
    """Download logo from URL to local file."""
    try:
        resp = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT, stream=True)
        resp.raise_for_status()
        
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"[error] Failed to download {url}: {e}")
        return False

def upload_to_r2(s3_client, local_path, r2_key, content_type="image/png"):
    """Upload file to R2."""
    try:
        with open(local_path, "rb") as f:
            s3_client.put_object(
                Bucket=R2_BUCKET,
                Key=r2_key,
                Body=f,
                ContentType=content_type
            )
        return True
    except Exception as e:
        print(f"[error] Failed to upload to R2: {e}")
        return False

def get_content_type(url):
    """Guess content type from URL extension."""
    ext = Path(urlparse(url).path).suffix.lower()
    mapping = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp"
    }
    return mapping.get(ext, "image/png")

def generate_r2_key(image_slug, logo_url):
    """Generate R2 key (path) for the logo - flat structure using image_slug."""
    # Extract extension from URL
    ext = Path(urlparse(logo_url).path).suffix.lower()
    if not ext or ext == "":
        ext = ".png"
    
    # Format: {image_slug}{ext} (flat structure)
    return f"{image_slug}{ext}"

def process_organization(db, s3_client, org_doc, dry_run=False):
    """Process a single organization: download logo, upload to R2, update DB."""
    slug = org_doc.get("slug")
    canonical_id = org_doc.get("canonical_id")
    image_slug = org_doc.get("image_slug")
    image_url = org_doc.get("image_url")
    
    # Fallback to logoUrl if image_url doesn't exist (backwards compatibility)
    logo_url = image_url or org_doc.get("logoUrl")
    
    if not logo_url:
        print(f"[skip] {canonical_id}: No image_url or logoUrl")
        return False
    
    if not image_slug:
        print(f"[skip] {canonical_id}: No image_slug")
        return False
    
    print(f"\n[info] Processing: {canonical_id}")
    print(f"  Slug: {slug}")
    print(f"  Image Slug: {image_slug}")
    print(f"  Image URL: {logo_url}")
    
    # Generate R2 key using image_slug (flat structure)
    r2_key = generate_r2_key(image_slug, logo_url)
    local_path = LOGOS_DIR / r2_key
    
    # Download logo
    print(f"  Downloading to: {local_path}")
    if not download_logo(logo_url, local_path):
        return False
    
    file_size = local_path.stat().st_size
    print(f"  Downloaded: {file_size} bytes")
    
    if dry_run:
        print(f"  [dry-run] Would upload to R2: {r2_key}")
        if R2_PUBLIC_URL:
            print(f"  [dry-run] Public URL: {R2_PUBLIC_URL}/{r2_key}")
        print(f"  [dry-run] Would update MongoDB for {canonical_id}")
        print(f"  [dry-run] Downloaded file kept at: {local_path}")
        # Keep file in logos directory
        return True
    
    # Upload to R2
    content_type = get_content_type(logo_url)
    print(f"  Uploading to R2: {r2_key}")
    if not upload_to_r2(s3_client, local_path, r2_key, content_type):
        print(f"  [warning] Upload failed, but keeping local file at: {local_path}")
        return False
    
    # Build public URL
    if R2_PUBLIC_URL:
        public_url = f"{R2_PUBLIC_URL}/{r2_key}"
    else:
        public_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{R2_BUCKET}/{r2_key}"
    
    print(f"  Uploaded! Public URL: {public_url}")
    
    # Update MongoDB
    try:
        db.organizations.update_one(
            {"canonical_id": canonical_id},
            {
                "$set": {
                    "logo_local_filename": r2_key,
                    "logo_r2_url": public_url,
                    "logo_uploaded_at": datetime.utcnow()
                }
            }
        )
        print(f"  Updated MongoDB for {canonical_id}")
    except Exception as e:
        print(f"[error] Failed to update MongoDB: {e}")
        print(f"  [warning] Upload succeeded but DB update failed. Local file kept at: {local_path}")
        return False
    
    # Keep the downloaded file in logos directory for local use
    print(f"  Local file: {local_path}")
    print(f"[success] Completed: {canonical_id}")
    return True

def run(test_org=None, org_slugs=None, dry_run=None):
    """Main runner."""
    if dry_run is None:
        dry_run = DRY_RUN
    
    validate_config()
    
    print("[info] Connecting to MongoDB...")
    db = connect_mongo()
    
    print("[info] Connecting to R2...")
    s3_client = get_r2_client()
    
    print(f"[info] DRY_RUN = {dry_run}")
    print(f"[info] R2 Bucket = {R2_BUCKET}")
    print(f"[info] Logos directory = {LOGOS_DIR.absolute()}")
    
    # Build query
    if test_org:
        # Find the most recent entry for this org (sorted by canonical_id desc, take first)
        query = {"slug": test_org}
        print(f"\n[info] TEST MODE: Processing org '{test_org}'")
        orgs = list(db.organizations.find(query).sort("canonical_id", -1).limit(1))
    elif org_slugs:
        query = {"slug": {"$in": org_slugs}}
        print(f"\n[info] Processing {len(org_slugs)} specified orgs")
        orgs = list(db.organizations.find(query))
    else:
        # Find all orgs without R2 logos that have image_url and image_slug
        query = {
            "$and": [
                {
                    "$or": [
                        {"logo_r2_url": {"$exists": False}},
                        {"logo_r2_url": None},
                        {"logo_r2_url": ""}
                    ]
                },
                {
                    "$or": [
                        {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
                        {"logoUrl": {"$exists": True, "$ne": None, "$ne": ""}}
                    ]
                },
                {"image_slug": {"$exists": True, "$ne": None, "$ne": ""}}
            ]
        }
        print("\n[info] Processing all orgs without R2 logos")
        orgs = list(db.organizations.find(query))
    
    print(f"[info] Found {len(orgs)} organizations to process\n")
    
    if not orgs:
        print("[info] No organizations to process!")
        return
    
    success_count = 0
    fail_count = 0
    
    for idx, org in enumerate(orgs, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(orgs)}]")
        try:
            if process_organization(db, s3_client, org, dry_run=dry_run):
                success_count += 1
            else:
                fail_count += 1
        except Exception as e:
            print(f"[error] Unexpected error processing {org.get('canonical_id', org.get('slug'))}: {e}")
            fail_count += 1
        
        # Sleep between orgs
        if idx < len(orgs):
            time.sleep(SLEEP_SECONDS)
    
    print(f"\n{'='*60}")
    print(f"[done] Processed {len(orgs)} organizations")
    print(f"  Success: {success_count}")
    print(f"  Failed: {fail_count}")

def parse_args():
    """Parse command line arguments."""
    p = argparse.ArgumentParser(description="Download and upload GSoC org logos to R2")
    p.add_argument("--test-org", type=str, help="Test with a single org (by slug)")
    p.add_argument("--orgs", nargs="+", help="Process specific orgs (by slug)")
    p.add_argument("--dry-run", action="store_true", help="Dry run (don't upload)")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run(
        test_org=args.test_org,
        org_slugs=args.orgs,
        dry_run=args.dry_run
    )

