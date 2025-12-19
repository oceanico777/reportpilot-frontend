import requests

API_URL = "http://localhost:8000"
TOKEN = "fake-jwt-token-for-auth"
RECEIPT_ID = "258a455a-04ba-409b-90f9-f10dd4432dac"

print(f"Testing Polling Endpoint: {API_URL}/receipts/{RECEIPT_ID}")

try:
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    print("Sending GET request...")
    response = requests.get(f"{API_URL}/receipts/{RECEIPT_ID}", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("[SUCCESS] Polling Endpoint works!")
    else:
        print("[FAIL] Polling Endpoint returned error.")

except Exception as e:
    print(f"[ERROR] Connection failed: {e}")
