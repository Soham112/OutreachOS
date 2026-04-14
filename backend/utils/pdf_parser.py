import pdfplumber
import re
from typing import Optional


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF given its bytes."""
    import io
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)


def parse_linkedin_profile(text: str) -> dict:
    """
    Parse extracted LinkedIn PDF text into structured profile data.
    Returns a dict with name, current_role, company, experience, skills, raw_text.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    name = ""
    current_role = ""
    company = ""
    experience_lines = []
    skills = []

    # LinkedIn PDFs typically have name on first or second non-empty line
    if lines:
        name = lines[0]

    # Try to find current role/company — usually in first 5 lines
    role_pattern = re.compile(r"^(.*?)\s+at\s+(.*?)$", re.IGNORECASE)
    for line in lines[1:6]:
        m = role_pattern.match(line)
        if m:
            current_role = m.group(1).strip()
            company = m.group(2).strip()
            break

    # Fallback: second line is often the headline/role
    if not current_role and len(lines) > 1:
        current_role = lines[1]

    # Extract skills section
    skill_section = False
    for i, line in enumerate(lines):
        if re.search(r"\bskills?\b", line, re.IGNORECASE) and len(line) < 30:
            skill_section = True
            continue
        if skill_section:
            if re.search(r"\b(experience|education|certifications?|projects?|summary)\b", line, re.IGNORECASE) and len(line) < 30:
                skill_section = False
                continue
            # Skills are usually comma-separated or one per line
            if "•" in line or "," in line:
                parts = re.split(r"[•,]", line)
                skills.extend([p.strip() for p in parts if p.strip()])
            elif len(line) < 60:
                skills.append(line)

    # Extract experience section
    exp_section = False
    for line in lines:
        if re.search(r"\bexperience\b", line, re.IGNORECASE) and len(line) < 30:
            exp_section = True
            continue
        if exp_section:
            if re.search(r"\b(education|skills?|certifications?|projects?|summary)\b", line, re.IGNORECASE) and len(line) < 30:
                break
            experience_lines.append(line)

    experience_summary = " ".join(experience_lines[:15]) if experience_lines else ""

    return {
        "name": name,
        "current_role": current_role,
        "company": company,
        "experience_summary": experience_summary[:600] if experience_summary else "See full profile",
        "skills": skills[:20],
        "raw_text": text[:3000],
    }
