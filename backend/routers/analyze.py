from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from utils.pdf_parser import extract_text_from_pdf, parse_linkedin_profile
from utils.profile_detector import detect_recipient_type

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("/profile")
async def analyze_profile(
    linkedin_pdf: UploadFile = File(...),
    jd_pdf: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
):
    """
    Accept LinkedIn PDF (required) and optional JD PDF or JD text.
    Returns parsed profile + recipient type + JD text.
    """
    try:
        linkedin_bytes = await linkedin_pdf.read()
        linkedin_text = extract_text_from_pdf(linkedin_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse LinkedIn PDF: {e}")

    profile = parse_linkedin_profile(linkedin_text)
    profile["recipient_type"] = detect_recipient_type(profile["current_role"])

    # Handle JD
    jd_content = ""
    if jd_pdf and jd_pdf.filename:
        try:
            jd_bytes = await jd_pdf.read()
            jd_content = extract_text_from_pdf(jd_bytes)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to parse JD PDF: {e}")
    elif jd_text:
        jd_content = jd_text.strip()

    profile["jd_text"] = jd_content

    return {"success": True, "profile": profile}
