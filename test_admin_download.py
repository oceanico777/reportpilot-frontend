import os
import time
from supabase import create_client, ClientOptions
from dotenv import load_dotenv
from jose import jwt

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
secret = os.getenv("SUPABASE_JWT_SECRET")
# The path we found in the Polling Response or Debug Output
# Sample path from earlier step: "2f5111a4-b952-488e-9f3f-1a8c74a6c496/2025/12/1765935064_5f40fe13-770c-4cc7-9f3a-acb515fbe521.jfif"
FILE_PATH = "2f5111a4-b952-488e-9f3f-1a8c74a6c496/2025/12/1765935064_5f40fe13-770c-4cc7-9f3a-acb515fbe521.jfif"
BUCKET = "receipts"

print(f"Connecting to Supabase to test Admin Download...")

# 1. Generate Service Role Token
print("Generating 'service_role' JWT...")
payload = {
    "aud": "authenticated", # or 'authenticated' ? usually 'authenticated' works if role is service_role
    "exp": int(time.time()) + 3600,
    "sub": "system-worker",
    "role": "service_role" # This is the magic key
}
try:
    token = jwt.encode(payload, secret, algorithm="HS256")
    print("[OK] Service Token generated.")
except Exception as e:
    print(f"[FAIL] Could not generate token: {e}")
    exit(1)

# 2. Try Download with Service Token
try:
    # Client with Service Token
    client = create_client(
        url, 
        key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
    )
    
    print(f"Attempting to download '{FILE_PATH}' from '{BUCKET}'...")
    data = client.storage.from_(BUCKET).download(FILE_PATH)
    
    print(f"[SUCCESS] Download worked! Size: {len(data)} bytes")

except Exception as e:
    print(f"\n[ERROR] Download failed: {e}")
