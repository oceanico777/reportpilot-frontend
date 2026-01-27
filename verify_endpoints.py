
import requests
import os

# Configuration
API_URL = "http://127.0.0.1:8005"
# Assuming we have a way to get a token, or we might need to mock auth or use an existing token if available. 
# For this script, I'll assume we can get a token or use a known test user if possible.
# Since I don't have a ready token in the environment, I might need to skip auth or simulate it if the backend allows (usually not).
# Let's try to login first if possible, or just check if the endpoint is reachable (401 is better than 404).

def test_export_endpoint():
    print("Testing Export Endpoint...")
    try:
        response = requests.get(f"{API_URL}/exports/providers-excel")
        if response.status_code == 401:
            print("✅ Export Endpoint exists (401 Unauthorized expected without token)")
        elif response.status_code == 200:
            print("✅ Export Endpoint works (200 OK)")
        elif response.status_code == 404:
            print("❌ Export Endpoint NOT FOUND")
        else:
            print(f"⚠️ Export Endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

def test_closures_endpoint():
    print("\nTesting Closures Endpoint...")
    try:
        # We need a token to really test the logic, but let's check existence first
        response = requests.post(f"{API_URL}/closures/close")
        if response.status_code == 401:
            print("✅ Closures Endpoint exists (401 Unauthorized expected without token)")
        elif response.status_code == 404:
            print("❌ Closures Endpoint NOT FOUND")
        else:
             # 422 Unprocessable Entity is also good (means it saw the schema validation)
            if response.status_code == 422:
                print("✅ Closures Endpoint exists (422 validation error expected)")
            else:
                print(f"⚠️ Closures Endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_export_endpoint()
    test_closures_endpoint()
