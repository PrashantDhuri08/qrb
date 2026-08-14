from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
import base64

app = FastAPI(title="QRB Relay Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections by sessionId
active_connections: Dict[str, List[WebSocket]] = {}
# In-memory payload queue fallback
session_queues: Dict[str, List[dict]] = {}

@app.get("/")
def read_root():
    return {"status": "ok", "service": "QRB Python Relay", "run_with": "uv"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    if session_id not in active_connections:
        active_connections[session_id] = []
    active_connections[session_id].append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Keep-alive or custom messages
    except WebSocketDisconnect:
        active_connections[session_id].remove(websocket)
        if not active_connections[session_id]:
            del active_connections[session_id]

@app.post("/api/session/{session_id}")
async def send_payload(
    session_id: str,
    payload_type: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    payload = {}
    if file:
        file_bytes = await file.read()
        b64_data = base64.b64encode(file_bytes).decode('utf-8')
        payload = {
            "type": "file",
            "fileName": file.filename,
            "mimeType": file.content_type,
            "data": b64_data
        }
    elif content:
        payload = {
            "type": "text",
            "content": content
        }
    
    # Broadcast to active WebSockets for this session
    if session_id in active_connections:
        for ws in active_connections[session_id]:
            await ws.send_text(json.dumps(payload))

    # Also store in HTTP queue fallback
    if session_id not in session_queues:
        session_queues[session_id] = []
    session_queues[session_id].append(payload)

    return {"success": True, "session_id": session_id}

@app.get("/api/session/{session_id}")
async def get_payloads(session_id: str):
    queue = session_queues.get(session_id, [])
    session_queues[session_id] = []
    return {"sessionId": session_id, "payloads": queue}
