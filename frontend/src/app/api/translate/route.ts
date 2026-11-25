import { NextRequest, NextResponse } from 'next/server';

const MAX_TRANSLATE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

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
    // 1. Require admin session cookie (access_token or refresh_token)
    const accessToken = req.cookies.get('access_token')?.value;
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Per-IP rate limiting
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many translation requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // 3. Enforce max input length
    const body = await req.json();
    const rawText = typeof body?.text === 'string' ? body.text.trim() : '';
    const text = rawText.slice(0, MAX_TRANSLATE_LENGTH);
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
