from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.schemas import AskRequestSchema, AskResponseSchema
from app.services.rag import RAGChatEngine

router = APIRouter()

@router.post("/", response_model=AskResponseSchema)
def ask_question(payload: AskRequestSchema, db: Session = Depends(get_db)):
    engine = RAGChatEngine(db)
    user_query = payload.query or payload.question or ""
    res = engine.ask(query=user_query, product_id=payload.product_id)
    return AskResponseSchema(
        answer=res["answer"],
        citations=res["citations"]
    )
