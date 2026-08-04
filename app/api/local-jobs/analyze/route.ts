import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({
    error: 'Server-side OCR is deprecated. Please perform image analysis client-side using the in-browser OCR scanner.',
  }, { status: 400 });
}


