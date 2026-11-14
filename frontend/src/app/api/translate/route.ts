import { NextRequest, NextResponse } from 'next/server';

async function googleTranslateFree(text: string, targetLang: 'si' | 'ta'): Promise<string | null> {
  if (!text.trim()) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((segment: any) => segment?.[0] || '').join('');
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ si: '', ta: '' });
    }

    const [si, ta] = await Promise.all([
      googleTranslateFree(text, 'si'),
      googleTranslateFree(text, 'ta'),
    ]);

    return NextResponse.json({
      si: si || null,
      ta: ta || null,
    });
  } catch {
    return NextResponse.json({ si: null, ta: null }, { status: 200 });
  }
}

