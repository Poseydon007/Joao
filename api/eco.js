export const config = { runtime: 'edge' }; // ✅ valid on Vercel

import { GoogleGenerativeAI } from '@google/generative-ai';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS'
    }
  });

export default async function handler(req) {
  try {
    if (req.method === 'OPTIONS') return json({}, 204);
    if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

    const body = await req.json().catch(() => ({}));
    const { messages = [] } = body;

    const SYSTEM = `You are Eco, the multilingual assistant for Ecosystem Mining.
Reply in the user's language (ar/en/es/pt). Be concise (<=120 words unless asked).
Help with services, experience, RFQ intake, meetings. No pricing/legal commitments.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM }] },
      ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
    ];

    const result = await model.generateContent({ contents });
    const text = result?.response?.text?.() ?? 'No response';
    return json({ ok: true, text });
  } catch (e) {
    return json({ ok: false, error: 'Eco backend error' }, 500);
  }
}
