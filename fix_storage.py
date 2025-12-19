import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase...")

try:
    client = create_client(url, key)
    
    # 1. List Buckets
    buckets = client.storage.list_buckets()
    found = False
    for b in buckets:
        if b.name == 'receipts':
            found = True
            break
            
    if found:
        print("[OK] Bucket 'receipts' already exists.")
    else:
        print("[INFO] Bucket 'receipts' NOT found. Attempting to create...")
        try:
            # Attempt with Service Role if possible, but we only have Anon/Service key from env.
            # Usually creates need Service Role or RLS allowing create.
            # We will try with the generic key provided in .env
            client.storage.create_bucket("receipts", options={"public": False})
            print("[SUCCESS] Bucket 'receipts' created!")
        except Exception as e:
            print(f"[ERROR] Failed to create bucket: {e}")
            print("TIP: You might need to go to Supabase Dashboard -> Storage -> Create Bucket 'receipts'")

except Exception as e:
    print(f"[CRITICAL] Error: {e}")
