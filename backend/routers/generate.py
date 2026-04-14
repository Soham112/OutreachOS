from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from utils.claude_client import generate_message

router = APIRouter(prefix="/generate", tags=["generate"])

MessageType = Literal[
    "connection_request",
    "followup",
    "inmail",
    "cold_email_short",
    "cold_email_detailed",
    "cold_email_followup",
]


class GenerateRequest(BaseModel):
    recipient_profile: str
    recipient_type: Literal["RECRUITER", "HIRING_MANAGER"]
    message_type: MessageType
    jd_text: Optional[str] = ""


@router.post("/message")
async def generate_outreach_message(req: GenerateRequest):
    """
    Generate an outreach message using Claude API.
    """
    try:
        result = generate_message(
            recipient_profile=req.recipient_profile,
            recipient_type=req.recipient_type,
            message_type=req.message_type,
            jd_text=req.jd_text or "",
        )
        return {"success": True, "result": result, "message_type": req.message_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
