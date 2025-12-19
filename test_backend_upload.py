import requests
import os

API_URL = "http://localhost:8000"
TOKEN = "fake-jwt-token-for-auth"

print(f"Testing Backend Upload Endpoint with VALID file: {API_URL}/reports/upload")

# Create a dummy PNG file (fake header)
with open("test.png", "wb") as f:
    f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89")

try:
    files = {'file': ('test.png', open('test.png', 'rb'), 'image/png')}
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    print("Sending POST request...")
    response = requests.post(f"{API_URL}/reports/upload", files=files, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("[SUCCESS] API Upload worked!")
    else:
        print("[FAIL] API Upload failed.")

except Exception as e:
    print(f"[ERROR] Connection failed: {e}")
