#!/usr/bin/env python3
"""
download_logos.py

Downloads organization logos from their source URLs and saves them locally.
Does NOT upload to R2 - just downloads to the logos/ directory.

Usage:
  # Download all logos that don't exist locally
  python download_logos.py

  # Download for specific orgs
  python download_logos.py --orgs unikraft jitsi

  # Test with a single org
  python download_logos.py --test-org unikraft

  # Force re-download even if file exists
  python download_logos.py --force
"""

import os
import sys
import time
import argparse
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import requests
from pymongo import MongoClient
from urllib.parse import urlparse

# ----------------- CONFIG -----------------
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "gsoc_archive")
SLEEP_SECONDS = float(os.getenv("SLEEP_SECONDS", "0.6"))

REQUEST_HEADERS = {"User-Agent": "gsoc-logo-downloader/1.0"}
REQUEST_TIMEOUT = 15

# Local directory for logo storage
LOGOS_DIR = Path("./logos")
LOGOS_DIR.mkdir(exist_ok=True)
# ------------------------------------------

def validate_config():
    """Validate that all required config is present."""
    if not MONGO_URI:
        print("[error] Missing MONGO_URI environment variable.")
        print("Please add it to your .env file.")
        sys.exit(1)

def connect_mongo():
    """Connect to MongoDB."""
    client = MongoClient(MONGO_URI)
    return client[MONGO_DB]

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

def get_extension_from_url(url):
    """Extract file extension from URL."""
    ext = Path(urlparse(url).path).suffix.lower()
    if not ext or ext == "":
        ext = ".png"
    return ext

def process_organization(org_doc, force=False):
    """Download logo for a single organization."""
    slug = org_doc.get("slug")
    canonical_id = org_doc.get("canonical_id")
    image_slug = org_doc.get("image_slug")
    image_url = org_doc.get("image_url")
    
    # Fallback to logoUrl if image_url doesn't exist
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
    
    # Determine filename
    ext = get_extension_from_url(logo_url)
    filename = f"{image_slug}{ext}"
    local_path = LOGOS_DIR / filename
    
    # Check if already exists
    if local_path.exists() and not force:
        file_size = local_path.stat().st_size
        print(f"  [skip] Already exists: {local_path} ({file_size} bytes)")
        return True
    
    # Download
    print(f"  Downloading to: {local_path}")
    if not download_logo(logo_url, local_path):
        return False
    
    file_size = local_path.stat().st_size
    print(f"  Downloaded: {file_size} bytes")
    print(f"[success] Completed: {canonical_id}")
    return True

def run(test_org=None, org_slugs=None, force=False):
    """Main runner."""
    validate_config()
    
    print("[info] Connecting to MongoDB...")
    db = connect_mongo()
    
    print(f"[info] Logos directory = {LOGOS_DIR.absolute()}")
    print(f"[info] Force re-download = {force}")
    
    # Build query
    if test_org:
        query = {"slug": test_org}
        print(f"\n[info] TEST MODE: Processing org '{test_org}'")
        orgs = list(db.organizations.find(query).sort("canonical_id", -1).limit(1))
    elif org_slugs:
        query = {"slug": {"$in": org_slugs}}
        print(f"\n[info] Processing {len(org_slugs)} specified orgs")
        orgs = list(db.organizations.find(query))
    else:
        # Find all orgs with image_url and image_slug
        query = {
            "$and": [
                {
                    "$or": [
                        {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
                        {"logoUrl": {"$exists": True, "$ne": None, "$ne": ""}}
                    ]
                },
                {"image_slug": {"$exists": True, "$ne": None, "$ne": ""}}
            ]
        }
        print("\n[info] Processing all orgs with image_url/logoUrl and image_slug")
        orgs = list(db.organizations.find(query))
    
    print(f"[info] Found {len(orgs)} organizations to process\n")
    
    if not orgs:
        print("[info] No organizations to process!")
        return
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for idx, org in enumerate(orgs, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(orgs)}]")
        try:
            result = process_organization(org, force=force)
            if result:
                # Check if it was actually downloaded or skipped
                image_slug = org.get("image_slug")
                image_url = org.get("image_url") or org.get("logoUrl")
                ext = get_extension_from_url(image_url)
                local_path = LOGOS_DIR / f"{image_slug}{ext}"
                
                if "[skip]" in str(result):
                    skip_count += 1
                else:
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
    print(f"  Downloaded: {success_count}")
    print(f"  Skipped (already exists): {skip_count}")
    print(f"  Failed: {fail_count}")
    print(f"\nLogos saved to: {LOGOS_DIR.absolute()}")

def parse_args():
    """Parse command line arguments."""
    p = argparse.ArgumentParser(description="Download GSoC org logos locally")
    p.add_argument("--test-org", type=str, help="Test with a single org (by slug)")
    p.add_argument("--orgs", nargs="+", help="Process specific orgs (by slug)")
    p.add_argument("--force", action="store_true", help="Force re-download even if file exists")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run(
        test_org=args.test_org,
        org_slugs=args.orgs,
        force=args.force
    )

