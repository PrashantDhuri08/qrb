import { NextRequest, NextResponse } from 'next/server';

// In-memory session payload store (for HTTP polling or WebSocket broadcasting fallback)
const sessionStore = new Map<string, Array<any>>();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  try {
    const contentType = req.headers.get('content-type') || '';

    let payload: any = null;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      payload = {
        id: Date.now().toString(),
        type: 'text',
        content: body.content,
        timestamp: new Date().toISOString(),
      };
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');

      payload = {
        id: Date.now().toString(),
        type: 'file',
        fileName: file.name,
        mimeType: file.type,
        data: base64Data,
        timestamp: new Date().toISOString(),
      };
    }

    if (!payload) {
      return NextResponse.json({ error: 'Invalid content type or payload' }, { status: 400 });
    }

    // Save to session store queue
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, []);
    }
    const queue = sessionStore.get(sessionId)!;
    queue.push(payload);

    // Keep queue small
    if (queue.length > 20) queue.shift();

    return NextResponse.json({
      success: true,
      message: 'Payload dispatched successfully',
      sessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const queue = sessionStore.get(sessionId) || [];

  // Return available payloads and clear queue
  sessionStore.set(sessionId, []);

  return NextResponse.json({
    sessionId,
    payloads: queue,
  });
}
