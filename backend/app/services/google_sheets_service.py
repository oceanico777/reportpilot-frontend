import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime

class GoogleSheetsService:
    def __init__(self):
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID")
        self.service_account_info = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        self.creds = None
        self.service = None
        
        if self.service_account_info:
            try:
                info = json.loads(self.service_account_info)
                self.creds = service_account.Credentials.from_service_account_info(
                    info, scopes=['https://www.googleapis.com/auth/spreadsheets']
                )
                self.service = build('sheets', 'v4', credentials=self.creds)
            except Exception as e:
                print(f"ERROR initializing Google Sheets Service: {e}")

    def sync_purchase(self, purchase_data):
        """
        Appends a row to the Google Sheet.
        purchase_data format: { date, provider, category, amount, currency, items_count }
        """
        if not self.service or not self.sheet_id:
            print("DEBUG: Google Sheets Sync is DISABLED (No Credentials)")
            return False
            
        try:
            range_name = 'Sheet1!A:F'  # Assume Sheet1
            values = [
                [
                    str(purchase_data.get('date')),
                    purchase_data.get('provider', 'N/A'),
                    purchase_data.get('category', 'General'),
                    float(purchase_data.get('amount', 0)),
                    purchase_data.get('currency', 'COP'),
                    purchase_data.get('items_count', 0)
                ]
            ]
            body = {'values': values}
            
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id, 
                range=range_name,
                valueInputOption='USER_ENTERED', 
                body=body
            ).execute()
            
            print(f"DEBUG: Sync to GSheets successful: {result.get('updates').get('updatedCells')} cells updated.")
            return True
        except Exception as e:
            print(f"ERROR syncing to Google Sheets: {e}")
            return False

# Singleton instance
google_sheets_service = GoogleSheetsService()
