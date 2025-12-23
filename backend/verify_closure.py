import requests
import os
from PIL import Image
import json

# Configuration
BASE_URL = "http://127.0.0.1:8005"
TOKEN = "fake-jwt-token-for-auth"
import uuid
TOUR_ID = f"TOUR-LOCAL-{str(uuid.uuid4())[:8]}" # Unique ID for each run

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def create_dummy_report(category, amount, vendor="Test Vendor"):
    url = f"{BASE_URL}/reports/generate"
    payload = {
        "company_id": "auto", # Backend handles this via token
        "tour_id": TOUR_ID,
        "client_name": "Cliente de Prueba",
        "month": 12,
        "year": 2025,
        "source_file_path": "dummy/path/receipt.jpg",
        "category": category,
        "extracted_data": {
            "vendor": vendor,
            "amount": amount,
            "currency": "COP",
            "date": "2025-12-22",
            "category": category
        }
    }
    
    print(f"Creating Report: {category} - ${amount}")
    resp = requests.post(url, headers=HEADERS, json=payload)
    if resp.status_code == 200:
        print(f"OK: {resp.json().get('id')}")
        return True
    else:
        print(f"FAIL: {resp.status_code} - {resp.text}")
        return False

def test_close_tour():
    print(f"\n--- Starting Tour Closure Test for {TOUR_ID} ---")
    
    # 1. Seed Real Data (From OCR)
    # UN DOS TRES POR MI SAS - $156,944.45 - Alimentación
    if not create_dummy_report("Alimentacion", 156944.45, vendor="UN DOS TRES POR MI SAS"): return
    
    # ORIGEN BISTRO SAS - $143,130.00 - Alimentación
    if not create_dummy_report("Alimentacion", 143130.00, vendor="ORIGEN BISTRO SAS"): return
    
    # MINI MAL LTDA - $195,356.00 - Alimentación
    if not create_dummy_report("Alimentacion", 195356.00, vendor="MINI MAL LTDA"): return

    # Extra: Add an advance to simulate balance calculation
    if not create_dummy_report("ANTICIPO_RECIBIDO", 600000, vendor="Tesoreria"): return

    # 2. Prepare Signature
    sig_path = "temp_signature.png"
    img = Image.new('RGB', (200, 100), color = (73, 109, 137))
    img.save(sig_path)

    # 3. Close Tour
    url = f"{BASE_URL}/tours/{TOUR_ID}/close"
    # Note: For file upload, we valid headers but let requests handle boundary for multipart
    auth_header = {"Authorization": f"Bearer {TOKEN}"} 
    
    print(f"\nClosing Tour ({url})...")
    try:
        with open(sig_path, "rb") as f:
            files = {"signature": ("signature.png", f, "image/png")}
            resp = requests.post(url, headers=auth_header, files=files)
            
        if resp.status_code == 200:
            print("\nSUCCESS: Tour Closed!")
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"\nFAILED: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(sig_path):
            os.remove(sig_path)

    # 4. Download Excel Report (Debug)
    print(f"\nDownloading Excel Report for {TOUR_ID}...")
    try:
        excel_url = f"{BASE_URL}/exports/tours/{TOUR_ID}/xlsx"
        resp = requests.get(excel_url, headers=auth_header)
        if resp.status_code == 200:
            excel_path = os.path.join("uploads", "debug_legalizacion.xlsx")
            os.makedirs("uploads", exist_ok=True)
            with open(excel_path, "wb") as f:
                f.write(resp.content)
            print(f"SUCCESS: Excel saved to {excel_path}")
        else:
            print(f"FAILED to download Excel: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Error downloading Excel: {e}")

if __name__ == "__main__":
    test_close_tour()
