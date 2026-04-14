from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import sqlite3
import os
from datetime import datetime

router = APIRouter(prefix="/history", tags=["history"])

DB_PATH = os.path.join(os.path.dirname(__file__), "../data/history.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS outreach_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            recipient_name TEXT NOT NULL,
            company TEXT,
            recipient_type TEXT,
            message_type TEXT NOT NULL,
            subject TEXT,
            message_body TEXT NOT NULL,
            status TEXT DEFAULT 'Draft'
        )
    """)
    conn.commit()
    conn.close()


init_db()

StatusType = Literal["Draft", "Sent", "Replied", "No Response"]


class SaveHistoryRequest(BaseModel):
    recipient_name: str
    company: Optional[str] = ""
    recipient_type: Optional[str] = ""
    message_type: str
    subject: Optional[str] = ""
    message_body: str
    status: StatusType = "Draft"


class UpdateStatusRequest(BaseModel):
    status: StatusType


@router.post("/save")
async def save_message(req: SaveHistoryRequest):
    """Save a generated message to history."""
    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO outreach_history
               (created_at, recipient_name, company, recipient_type, message_type, subject, message_body, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                datetime.utcnow().isoformat(),
                req.recipient_name,
                req.company or "",
                req.recipient_type or "",
                req.message_type,
                req.subject or "",
                req.message_body,
                req.status,
            ),
        )
        conn.commit()
        return {"success": True, "id": cursor.lastrowid}
    finally:
        conn.close()


@router.get("/list")
async def list_history():
    """Get all history entries, newest first."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM outreach_history ORDER BY created_at DESC"
        ).fetchall()
        return {"success": True, "history": [dict(r) for r in rows]}
    finally:
        conn.close()


@router.get("/{entry_id}")
async def get_history_entry(entry_id: int):
    """Get a single history entry."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM outreach_history WHERE id = ?", (entry_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True, "entry": dict(row)}
    finally:
        conn.close()


@router.patch("/{entry_id}/status")
async def update_status(entry_id: int, req: UpdateStatusRequest):
    """Update the status of a history entry."""
    conn = get_db()
    try:
        result = conn.execute(
            "UPDATE outreach_history SET status = ? WHERE id = ?",
            (req.status, entry_id),
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True}
    finally:
        conn.close()


@router.delete("/{entry_id}")
async def delete_history_entry(entry_id: int):
    """Delete a history entry."""
    conn = get_db()
    try:
        result = conn.execute(
            "DELETE FROM outreach_history WHERE id = ?", (entry_id,)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True}
    finally:
        conn.close()
