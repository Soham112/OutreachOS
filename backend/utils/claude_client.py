import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

SOHAM_PROFILE = """
Name: Soham Patil
Role: Data Scientist | AI/ML Engineer
Experience: 3+ years building production ML pipelines and GenAI systems
Current: Master's at UT Dallas, graduating May 2026
Location: Dallas, TX | Open to hybrid and remote
Available: May 2026

Key achievements:
- Built 4-stage LLM pipeline (LLaMA 3.3 70B, BERT-NER, Jaro-Winkler) processing 120K+ articles on Databricks
- Reduced 400+ features to 15-20 using multi-stage feature selection — improved fill rates 60% to 100%, enabling 4x revenue growth
- Built donor propensity models across 156M consumer households for 100+ clients
- Built Contendo — full-stack GenAI platform using LangGraph, ChromaDB, Claude Sonnet
- Won hackathon (Datacolor.ai & Altcloud.ai) for agentic RAG system on AWS Bedrock
- Mentored team of 5, saved $30K+ in vendor costs
- Published in Springer — deep learning for wheat disease detection

Skills: Python, Spark, Databricks, MLflow, LangGraph, LangChain, RAG, AWS Bedrock, LLaMA, ChromaDB, Vector Search, LightGBM, XGBoost, Neural Networks, AWS (S3, Lambda), CI/CD

Portfolio: soham-portfolio-seven.vercel.app
GitHub: github.com/Soham112
Email: patilsohham@gmail.com
Phone: +1 945 544 0767
""".strip()

SYSTEM_PROMPT = f"""
You are writing outreach messages on behalf of Soham Patil, a Data Scientist with 3+ years of experience in production ML and GenAI systems.

SOHAM'S FULL PROFILE:
{SOHAM_PROFILE}

RULES:
- Never sound like a template
- Always reference something specific from the recipient's profile
- If JD is provided, map Soham's skills to the JD requirements naturally
- Warm and human tone — not corporate
- Never oversell or use buzzwords like "passionate" or "synergy"
- For recruiters: focus on availability, role fit, easy to work with
- For hiring managers: focus on technical depth, specific relevant work, what Soham can contribute
- Always be honest — only claim skills and experience Soham actually has
- Do not add placeholder text like [Your Name] or [Company] — use actual names
""".strip()

MESSAGE_TYPE_INSTRUCTIONS = {
    "connection_request": """Generate a LinkedIn connection request message.
STRICT LIMIT: Under 300 characters total (this is a hard LinkedIn limit).
- Warm, specific, no job ask
- End with one genuine observation about their work
- If JD was provided, subtly reference alignment
- Output ONLY the message text, nothing else.""",

    "followup": """Generate a LinkedIn follow-up message (sent after they accept the connection).
Length: 500-800 characters.
- Can mention open to opportunities
- Reference something specific from their profile
- Soft ask: "Would love to learn more about your team's work"
- Output ONLY the message text, nothing else.""",

    "inmail": """Generate a LinkedIn InMail message.
Length: 150-300 words.
Format your response EXACTLY as:
SUBJECT: [subject line here]
BODY: [body text here]
- More formal than connection message
- Reference JD if provided
- Clear but soft ask: 15-minute conversation""",

    "cold_email_short": """Generate a short cold email for a busy hiring manager.
STRICT LIMIT: Under 100 words for the body.
Format your response EXACTLY as:
SUBJECT: [subject line here]
BODY: [body text here]""",

    "cold_email_detailed": """Generate a detailed cold email for a warmer lead.
STRICT LIMIT: Under 200 words for the body.
Format your response EXACTLY as:
SUBJECT: [subject line here]
BODY: [body text here]
- Always include portfolio link: soham-portfolio-seven.vercel.app""",

    "cold_email_followup": """Generate a follow-up cold email to send 5 days after no reply.
STRICT LIMIT: Under 50 words for the body.
Format your response EXACTLY as:
SUBJECT: [subject line here]
BODY: [body text here]
- Very brief, light touch, no pressure""",

    "cover_letter": """Generate a professional cover letter.
Length: 300-380 words total. Four tight paragraphs.
Format your response EXACTLY as:
BODY: [full cover letter text here]

Paragraph structure:
1. HOOK (2-3 sentences): Open with why this specific company and role. Reference something concrete from the JD or recipient's company — a product, tech stack, team mission, or recent work. Do not open with "I am writing to apply."
2. EXPERIENCE (3-4 sentences): Establish Soham's background. Map his most relevant experience directly to what the JD asks for. Be specific — name tools, scale, outcomes.
3. PROOF (3-4 sentences): Pick ONE or TWO achievements from Soham's profile that most directly match the role requirements. Include real numbers where they exist. Make the connection to the role explicit.
4. CLOSE (2-3 sentences): Express genuine interest, mention availability (May 2026), include portfolio link (soham-portfolio-seven.vercel.app), and a clear but low-pressure call to action.

Rules:
- If recipient name is available, address it to them. Otherwise use "Hiring Team".
- If no JD is provided, write a strong general cover letter for a Data Scientist / ML Engineer role but note it is less targeted.
- Never use "I am passionate about", "synergy", "leverage", or "I would be a great fit".
- Do not repeat the same achievement twice across paragraphs.
- End with: Sincerely, Soham Patil""",
}


def generate_message(
    recipient_profile: str,
    recipient_type: str,
    message_type: str,
    jd_text: str = "",
) -> dict:
    """
    Call Claude API to generate an outreach message.
    Returns dict with keys depending on message_type.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    jd_provided = "yes" if jd_text.strip() else "no"
    jd_content = jd_text.strip() if jd_text.strip() else "none"

    type_instruction = MESSAGE_TYPE_INSTRUCTIONS.get(message_type, "Generate an outreach message.")

    user_prompt = f"""RECIPIENT PROFILE:
{recipient_profile}

RECIPIENT TYPE: {recipient_type}

JD PROVIDED: {jd_provided}
JD CONTENT: {jd_content}

GENERATE: {message_type}

{type_instruction}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw = response.content[0].text.strip()

    # Cover letter — body only, no subject line
    if message_type == "cover_letter":
        body_lines = []
        body_started = False
        for line in raw.split("\n"):
            if line.upper().startswith("BODY:"):
                body_lines.append(line[len("BODY:"):].strip())
                body_started = True
            elif body_started:
                body_lines.append(line)
        body = "\n".join(body_lines).strip() or raw
        return {"subject": "", "body": body, "raw": raw}

    # Parse structured responses (inmail, cold emails)
    if message_type in ("inmail", "cold_email_short", "cold_email_detailed", "cold_email_followup"):
        subject = ""
        body = ""
        lines = raw.split("\n")
        subject_done = False
        body_lines = []
        for line in lines:
            if line.upper().startswith("SUBJECT:"):
                subject = line[len("SUBJECT:"):].strip()
                subject_done = True
            elif line.upper().startswith("BODY:"):
                body_lines.append(line[len("BODY:"):].strip())
            elif subject_done:
                body_lines.append(line)
        body = "\n".join(body_lines).strip()
        return {"subject": subject, "body": body, "raw": raw}

    return {"message": raw}
