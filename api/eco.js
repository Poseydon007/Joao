import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const { messages = [] } = req.body || {};

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
    return res.json({ ok: true, text });
  } catch (e) {
    console.error('Eco error:', e);
    return res.status(500).json({ ok: false, error: 'Eco backend error' });
  }
}
