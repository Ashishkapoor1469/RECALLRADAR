from fastapi import APIRouter

from app.api.v1 import products, risk_queue, alerts, backtests, ask, data_quality, demo

api_router = APIRouter()

api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(risk_queue.router, prefix="/risk-queue", tags=["Risk Queue"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(backtests.router, prefix="/backtests", tags=["Backtest Lab"])
api_router.include_router(ask.router, prefix="/ask", tags=["Ask RecallRadar"])
api_router.include_router(data_quality.router, prefix="/data-quality", tags=["Data Quality"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo Mode"])
