import os
import sys
import logging
from dotenv import load_dotenv

# Setup minimal logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env vars
load_dotenv(dotenv_path="backend/.env")
os.environ["DATABASE_URL"] = "postgresql://reportpilot:dev123@localhost:5432/reportpilot"

# Must append backend dir to path to import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal
from app import models
from app.services.storage import storage_service
from app.services.ocr import process_receipt_with_gemini

RECEIPT_ID = "77f3dd5d-0e20-4133-828a-51faf85fd86c" # From latest failure

def debug_ocr_flow():
    print(f"DEBUG: Starting manual OCR diagnosis for Receipt {RECEIPT_ID}")
    
    db = SessionLocal()
    try:
        # 1. Fetch Receipt
        receipt = db.query(models.Receipt).filter(models.Receipt.id == RECEIPT_ID).first()
        if not receipt:
            print("[FAIL] Receipt not found in DB!")
            return

        print(f"[OK] Receipt found. Path: {receipt.storage_path}")
        print(f"     Status: {receipt.status}")

        if not receipt.storage_path:
            print("[FAIL] Receipt has no storage_path!")
            return

        # 2. Test System Client Download
        print("DEBUG: Attempting download via System Client...")
        try:
            system_client = storage_service.get_system_client()
            if not system_client:
                 print("[FAIL] get_system_client() returned None. Check SUPABASE_URL/KEY/JWT_SECRET in .env")
                 return
            
            data_to_process = system_client.storage.from_(storage_service.bucket).download(receipt.storage_path)
            print(f"[OK] Download successful! Size: {len(data_to_process)} bytes")
        except Exception as e:
            print(f"[FAIL] Download failed: {e}")
            import traceback
            traceback.print_exc()
            return

        # 3. Test Gemini OCR
        print("DEBUG: Attempting Gemini OCR processing...")
        if not os.getenv("GEMINI_API_KEY"):
            print("[FAIL] GEMINI_API_KEY is missing from .env!")
            # Don't return, let it crash naturally to see what happens
        
        try:
            extracted_data = process_receipt_with_gemini(data_to_process)
            print(f"[OK] OCR Success!")
            print(f"     Data: {extracted_data}")
        except Exception as e:
            print(f"[FAIL] OCR Failed: {e}")
            import traceback
            traceback.print_exc()
            return
            
        print("[SUCCESS] All steps passed locally. The issue might be in Docker env (missing keys?).")

    except Exception as overall_e:
        print(f"[CRITICAL] Unexpected script error: {overall_e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_ocr_flow()
