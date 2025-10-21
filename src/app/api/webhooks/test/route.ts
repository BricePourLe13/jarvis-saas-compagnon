import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook test route is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ 
    status: 'ok',
    message: 'POST received',
    receivedData: body,
    timestamp: new Date().toISOString()
  });
}

