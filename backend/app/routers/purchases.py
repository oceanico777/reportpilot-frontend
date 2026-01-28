from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from ..database import get_db
from .. import models, schemas, auth
from ..services import purchase_processor
from ..services.google_sheets_service import google_sheets_service

router = APIRouter(
    prefix="/purchases",
    tags=["purchases"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Purchase)
def create_purchase(
    purchase: schemas.PurchaseCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    import traceback
    try:
        print(f"DEBUG: create_purchase called. User: {current_user.id}, Company: {current_user.company_id}")
        # Check for duplicates (same provider + date + amount)
        existing_duplicate = None
        if purchase.extracted_data:
            data = purchase.extracted_data
            vendor = data.get('vendor')
            amount = data.get('amount')
            date_obj = data.get('date') # Needs parsing if string
            
            existing_duplicate = db.query(models.Purchase).filter(
                models.Purchase.company_id == current_user.company_id,
                # models.Purchase.vendor == vendor, # REMOVED: Not a column
                models.Purchase.amount == amount,
                models.Purchase.date == date_obj
            ).first()

        # Logic to Auto-Link or Auto-Create Provider
        final_provider_id = purchase.provider_id
        
        try:
            if not final_provider_id and purchase.extracted_data:
                vendor_name = purchase.extracted_data.get('vendor')
                if vendor_name:
                    # 1. Search for existing provider (Case Insensitive)
                    existing_provider = db.query(models.Provider).filter(
                        models.Provider.company_id == current_user.company_id,
                        models.Provider.name.ilike(vendor_name)
                    ).first()
                    
                    if existing_provider:
                        final_provider_id = existing_provider.id
                    else:
                        # 2. Create New Provider
                        new_provider = models.Provider(
                            company_id=current_user.company_id,
                            name=vendor_name,
                            category=purchase.category or "General"
                        )
                        db.add(new_provider)
                        db.flush() # Generate ID
                        final_provider_id = new_provider.id
                        print(f"DEBUG: Auto-created provider '{vendor_name}' with ID {final_provider_id}")
        except Exception as e:
            print(f"ERROR in auto-provider logic: {e}")
            message = traceback.format_exc()
            print(message)
            pass

        
        print(f"DEBUG: attempting to add purchase to DB. ProviderID: {final_provider_id}")
        db_purchase = models.Purchase(
            company_id=current_user.company_id,
            user_id=current_user.id,
            date=purchase.date,
            # extracted_data removed (not a column)
            # DB Fields
            amount=purchase.amount,
            currency=purchase.currency,
            category=purchase.category,
            invoice_number=purchase.invoice_number,
            # vendor=... removed (not a column)
            provider_id=final_provider_id, # FIX: Save selected or auto-created provider_id
            
            source_file_path=purchase.source_file_path,
            status=models.PurchaseStatus.PROCESSING.value,
            
            is_duplicate=True if existing_duplicate else False,
            potential_duplicate_of=existing_duplicate.id if existing_duplicate else None
        )
        
        db.add(db_purchase)
        db.commit()
        db.refresh(db_purchase)
        
        # Save Items if present
        if purchase.extracted_data and 'items' in purchase.extracted_data:
            items = purchase.extracted_data.get('items')
            # Handle stringified JSON if it comes as string (robustness)
            if isinstance(items, str):
                import json
                try:
                    items = json.loads(items)
                except:
                    items = []
                    
            if isinstance(items, list):
                for item in items:
                    # Basic validation
                    name = item.get('name')
                    if not name: continue
                    
                    new_item = models.PurchaseItem(
                        purchase_id=db_purchase.id,
                        name=name,
                        quantity=float(item.get('qty', 1.0)),
                        unit=item.get('unit'),
                        unit_price=float(item.get('price', 0.0)),
                        total_price=float(item.get('total', 0.0))
                    )
                    db.add(new_item)
                db.commit()
        
        # Trigger background processing (OCR linking, classification refinement)
        background_tasks.add_task(purchase_processor.process_purchase, db_purchase.id)
        
        # Trigger Google Sheets Sync
        try:
            items_list = purchase.extracted_data.get('items', []) if purchase.extracted_data else []
            sync_data = {
                "date": db_purchase.date,
                "provider": db_purchase.provider.name if db_purchase.provider else (purchase.extracted_data.get('vendor') if purchase.extracted_data else "Sin Proveedor"),
                "category": db_purchase.category,
                "amount": db_purchase.amount,
                "currency": db_purchase.currency,
                "items_count": len(items_list) if isinstance(items_list, list) else 0
            }
            background_tasks.add_task(google_sheets_service.sync_purchase, sync_data)
        except Exception as e:
            print(f"DEBUG: Error preparing GSheets sync: {e}")
        
        return db_purchase
    except Exception as e:
        print(f"CRITICAL ERROR in create_purchase: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/", response_model=List[schemas.Purchase])
def list_purchases(
    skip: int = 0, 
    limit: int = 100, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    provider_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.Purchase).filter(models.Purchase.company_id == current_user.company_id)
    
    if start_date:
        query = query.filter(models.Purchase.date >= start_date)
    if end_date:
        query = query.filter(models.Purchase.date <= end_date)
    if provider_id:
        query = query.filter(models.Purchase.provider_id == provider_id)
        
    return query.order_by(models.Purchase.date.desc()).offset(skip).limit(limit).all()

@router.get("/{purchase_id}", response_model=schemas.Purchase)
def read_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    purchase = db.query(models.Purchase).filter(
        models.Purchase.id == purchase_id,
        models.Purchase.company_id == current_user.company_id
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

@router.get("/dashboard-stats", response_model=dict)
def get_dashboard_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    company_id = current_user.company_id
    query = db.query(models.Purchase).filter(models.Purchase.company_id == company_id)
    
    if start_date:
        query = query.filter(models.Purchase.date >= start_date)
    if end_date:
        query = query.filter(models.Purchase.date <= end_date)
        
    purchases = query.all()
    
    total_spent = 0
    total_reports = len(purchases)
    
    monthly_data = {}
    category_data = {}
    provider_data = {}
    
    for p in purchases:
        amount = p.amount or 0
        total_spent += amount
        
        # Monthly Stats
        month_key = p.date.strftime("%b")
        monthly_data[month_key] = monthly_data.get(month_key, 0) + amount
        
        # Category Stats
        cat = p.category or "Otros"
        category_data[cat] = category_data.get(cat, 0) + amount
        
        # Provider Stats
        prov = p.provider.name if p.provider else (p.vendor or "Otros")
        provider_data[prov] = provider_data.get(prov, 0) + amount

    monthly_stats = [{"month": k, "total": int(v)} for k, v in monthly_data.items()]
    category_stats = [{"name": k, "value": int(v)} for k, v in category_data.items()]
    provider_stats = [{"name": k, "value": int(v)} for k, v in provider_data.items()]
    
    provider_stats.sort(key=lambda x: x['value'], reverse=True)
    
    recent_activity = []
    for p in sorted(purchases, key=lambda x: x.date, reverse=True)[:5]:
         recent_activity.append({
             "id": p.id,
             "created_at": p.date.isoformat(),
             "amount": int(p.amount) if p.amount else 0,
             "category": p.category,
             "provider": p.provider.name if p.provider else p.vendor
         })

    return {
        "total_reports": total_reports,
        "total_spent": int(total_spent),
        "monthly_stats": monthly_stats,
        "category_stats": category_stats,
        "client_stats": provider_stats[:5], # Named client_stats for frontend compat
        "recent_activity": recent_activity
    }

@router.get("/price-trends", response_model=List[dict])
def get_price_trends(
    query: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    search_term = f"%{query.lower()}%"
    results = db.query(
        models.Purchase.date,
        func.avg(models.PurchaseItem.unit_price).label('avg_price')
    ).join(
        models.PurchaseItem, models.Purchase.id == models.PurchaseItem.purchase_id
    ).filter(
        models.Purchase.company_id == current_user.company_id,
        func.lower(models.PurchaseItem.name).like(search_term),
        models.PurchaseItem.unit_price > 0
    ).group_by(
        models.Purchase.date
    ).order_by(
        models.Purchase.date.asc()
    ).all()
    
    return [{"date": r.date.strftime("%Y-%m-%d"), "price": int(r.avg_price)} for r in results]

@router.get("/provider-trends", response_model=List[dict])
def get_provider_trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    results = db.query(models.Purchase).options(
        db.joinedload(models.Purchase.provider)
    ).filter(
        models.Purchase.company_id == current_user.company_id,
        models.Purchase.provider_id != None
    ).order_by(models.Purchase.date.asc()).all()
    
    data_map = {}
    for p in results:
        month_key = p.date.strftime("%b %Y")
        prov_name = p.provider.name if p.provider else "Otros"
        amount = p.amount or 0
        if month_key not in data_map: data_map[month_key] = {}
        data_map[month_key][prov_name] = data_map[month_key].get(prov_name, 0) + amount
        
    sorted_keys = sorted(data_map.keys(), key=lambda x: datetime.strptime(x, "%b %Y"))
    final_list = []
    for m in sorted_keys:
        item = {"month": m}
        item.update(data_map[m])
        final_list.append(item)
        
    return final_list[-months:]
