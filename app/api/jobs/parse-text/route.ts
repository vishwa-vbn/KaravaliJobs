import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * POST /api/jobs/parse-text
 *
 * Structures raw job description text into a JSON job object using Gemini 3.5 Flash.
 * Body: { text: string }
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth Check ────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // ── 2. Parse request body ────────────────────────────────────────────────
    const body = await req.json();
    const { text: rawText } = body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please provide a valid job description text (minimum 50 characters)' },
        { status: 400 }
      );
    }

    // ── 3. Check Gemini API Key ──────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: 'AI features are currently unconfigured (missing GEMINI_API_KEY)' },
        { status: 501 }
      );
    }

    const cleanedText = rawText.slice(0, 30000); // Truncate to save tokens

    // ── 4. Call Gemini API using Structured Outputs ──────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;

    console.log('[AI Parser] Calling Gemini 3.5 Flash to parse job text...');
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Extract the job information from this text and return a structured JSON response. Make sure to accurately identify the title, company name, location (must be Mangalore, Udupi, or Remote), job type, description, salary, apply method/URL/phone, and category. Here is the text:\n\n${cleanedText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'The job title (e.g. Accountant, Delivery Executive).' },
              companyName: { type: 'STRING', description: 'The name of the hiring company.' },
              location: { type: 'STRING', enum: ['Mangalore', 'Udupi', 'Remote'], description: 'The location. Must be Mangalore, Udupi, or Remote.' },
              specificArea: { type: 'STRING', description: 'Specific neighborhood or street if mentioned (e.g. Hampankatta, Kinnimulki).' },
              jobType: { type: 'STRING', enum: ['Permanent', 'Part-time', 'Remote', 'Contract'], description: 'Must be Permanent, Part-time, Remote, or Contract.' },
              description: { type: 'STRING', description: 'A professionally rewritten and beautifully formatted job description. Organize it into clean, distinct sections such as "Role Overview", "Key Responsibilities", and "Requirements" using bullet points. Fix any layout, grammar, or formatting errors present in the raw source text.' },
              salaryRange: { type: 'STRING', description: 'Salary details if listed (e.g. ₹15,000 - ₹20,000 / month), otherwise "Competitive / As per industry standards".' },
              applyMethod: { type: 'STRING', description: 'Instructions on how to apply (e.g. Email resume, call phone number, or apply via url).' },
              applyUrl: { type: 'STRING', description: 'The direct link to apply if available.' },
              phone: { type: 'STRING', description: 'Contact phone number if listed.' },
              category: { type: 'STRING', enum: ['IT & Software', 'Sales & Marketing', 'Finance & Accounts', 'Healthcare', 'Office Admin', 'Hospitality', 'Retail', 'Education', 'Other'], description: 'Select the most relevant category.' },
              tags: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: '3 to 4 short, relevant search keywords/tags (e.g. IT, Sales, Mangalore, Remote) to categorize the post. Return plain words without the "#" prefix.'
              },
            },
            required: ['title', 'companyName', 'location', 'jobType', 'description', 'applyMethod', 'category', 'tags'],
          },
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('[AI Parser] Gemini API call failed:', errText);
      return NextResponse.json(
        { error: `AI Parser failed: ${geminiResponse.statusText}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.error('[AI Parser] Gemini returned empty content:', geminiData);
      return NextResponse.json({ error: 'AI failed to parse details from text' }, { status: 502 });
    }

    let structuredJob;
    try {
      structuredJob = JSON.parse(candidateText);
    } catch (parseErr) {
      console.error('[AI Parser] Failed to parse JSON from Gemini:', candidateText);
      return NextResponse.json({ error: 'AI output parse error' }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: structuredJob });
  } catch (err: any) {
    console.error('[AI Parser Error] Fatal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
