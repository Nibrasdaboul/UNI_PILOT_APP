/**
 * OpenAI Text-to-Speech: high-quality AI voices.
 * Key from: process.env.OPENAI_API_KEY or server/openai-key.txt
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_FILE = join(__dirname, '..', 'openai-key.txt');
const MODEL = 'tts-1-hd';
const MAX_CHARS = 4096;
const CHUNK_SIZE = 3800;

export const AI_VOICES = [
  { id: 'nova', name: 'Nova', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female' },
  { id: 'alloy', name: 'Alloy', gender: 'neutral' },
  { id: 'echo', name: 'Echo', gender: 'male' },
  { id: 'fable', name: 'Fable', gender: 'male' },
  { id: 'onyx', name: 'Onyx', gender: 'male' },
];

function getKey() {
  const env = process.env.OPENAI_API_KEY?.trim();
  if (env) return env;
  try {
    if (existsSync(KEY_FILE)) {
      const key = readFileSync(KEY_FILE, 'utf8').trim();
      if (key && !key.startsWith('PASTE_')) return key;
    }
  } catch (_) {}
  return '';
}

export function isConfigured() {
  return !!getKey();
}

function chunkText(text) {
  const t = (text || '').trim();
  if (!t) return [];
  if (t.length <= MAX_CHARS) return [t];
  const chunks = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= CHUNK_SIZE) {
      chunks.push(rest);
      break;
    }
    const slice = rest.slice(0, CHUNK_SIZE);
    const last = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('؟ '),
      slice.lastIndexOf('? '),
      slice.lastIndexOf('\n'),
      slice.lastIndexOf(' ')
    );
    const splitAt = last > CHUNK_SIZE / 2 ? last + 1 : CHUNK_SIZE;
    chunks.push(rest.slice(0, splitAt).trim());
    rest = rest.slice(splitAt).trim();
  }
  return chunks.filter(Boolean);
}

/**
 * Get speech audio for text. Returns array of MP3 buffers (one per chunk).
 * @param {string} text
 * @param {string} voice - one of AI_VOICES[].id
 * @returns {Promise<Buffer[]>}
 */
export async function getSpeechChunks(text, voice = 'nova') {
  const key = getKey();
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const validVoice = AI_VOICES.some((v) => v.id === voice) ? voice : 'nova';
  const chunks = chunkText(text);
  const buffers = [];
  for (const chunk of chunks) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: chunk,
        voice: validVoice,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      const e = new Error(err || `OpenAI TTS ${res.status}`);
      e.status = res.status;
      throw e;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    buffers.push(buf);
  }
  return buffers;
}
