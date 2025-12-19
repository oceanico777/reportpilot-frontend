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

print(f"Connecting to Supabase...")

# 1. Generate Signed Token (Simulating Backend Logic)
print("Generating signed JWT...")
payload = {
    "aud": "authenticated",
    "exp": int(time.time()) + 3600,
    "sub": "e9821814-c159-42b7-8742-167812035978", # Mock ID
    "email": "guide@reportpilot.com",
    "role": "authenticated"
}
try:
    token = jwt.encode(payload, secret, algorithm="HS256")
    print("[OK] Token generated.")
except Exception as e:
    print(f"[FAIL] Could not generate token: {e}")
    exit(1)

# 2. Try Upload with Token
try:
    # Use the signed token
    client = create_client(
        url, 
        key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
    )
    
    print("Attempting to upload 'debug_rls.txt' to 'receipts'...")
    res = client.storage.from_("receipts").upload("debug_rls.txt", b"RLS Test Content", {"content-type": "text/plain", "upsert": "true"})
    print(f"[SUCCESS] Upload worked! \nResponse: {res}")
    print("\nCONCLUSION: The code logic is CORRECT.")
    print("If the web app still fails, you definitely need to RESTART the backend terminal.")

except Exception as e:
    print(f"\n[ERROR] Upload failed even with signed token: {e}")
    print("Possible causes:")
    print("1. RLS Policy on Supabase is stricter than expected.")
    print("2. 'receipts' bucket doesn't exist or is public.")
