import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase at: {url}")

try:
    client = create_client(url, key)
    
    # 1. List Buckets
    print("\n--- Listing Buckets ---")
    buckets = client.storage.list_buckets()
    print(f"Found {len(buckets)} buckets:")
    found_receipts = False
    for b in buckets:
        print(f" - {b.name}")
        if b.name == 'receipts':
            found_receipts = True

    if not found_receipts:
        print("\n[ERROR] 'receipts' bucket NOT found! You need to create it.")
    else:
        print("\n[SUCCESS] 'receipts' bucket found.")

        # 2. Try Upload (Anon)
        print("\n--- Testing Upload (Anon) ---")
        try:
            res = client.storage.from_("receipts").upload("test_debug.txt", b"Hello World", {"content-type": "text/plain"})
            print(f"[SUCCESS] Uploaded test file: {res}")
        except Exception as e:
            print(f"[ERROR] Upload failed: {e}")

except Exception as e:
    print(f"\n[CRITICAL ERROR] Could not connect to Supabase: {e}")
