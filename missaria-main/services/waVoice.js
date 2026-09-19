// services/waVoice.js
//
// DM voice notes: download -> transcribe -> detect language -> reply in
// that language. Reuses the same STT_API_URL the Telegram side already
// uses (it takes a URL, so we upload the downloaded buffer to catbox
// first to get one — see waUpload.js).

const axios = require("axios");
const { uploadBuffer } = require("./waUpload");
const { generateText } = require("./aiService");

const STT_API_URL = process.env.STT_API_URL;

async function speechToTextFromUrl(audioUrl) {
  if (!STT_API_URL) {
    console.log("waVoice: STT_API_URL not set — voice transcription disabled until configured.");
    return null;
  }
  try {
    const { data } = await axios.get(STT_API_URL, {
      params: { url: audioUrl },
      timeout: 120000,
    });
    const text = data.text ?? data.response ?? data.result ?? data.data;
    if (!text) throw new Error("No transcription returned");
    return String(text).trim();
  } catch (err) {
    console.log("waVoice STT error:", err.response?.data || err.message);
    return null;
  }
}

// Downloads a Baileys audioMessage into a Buffer. Baileys exposes
// downloadContentFromMessage on the library export, not the socket.
async function downloadVoiceBuffer(msg, getBaileys) {
  const { downloadContentFromMessage } = getBaileys();
  const audioMsg = msg.message?.audioMessage;
  if (!audioMsg) return null;

  const stream = await downloadContentFromMessage(audioMsg, "audio");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function transcribeVoiceNote(msg, getBaileys) {
  const buffer = await downloadVoiceBuffer(msg, getBaileys);
  if (!buffer) return { transcript: null };

  const url = await uploadBuffer(buffer, "voice.ogg");
  if (!url) return { transcript: null };

  const transcript = await speechToTextFromUrl(url);
  return { transcript };
}

// Generates a reply and makes sure it comes back in whatever language
// the voice note was spoken in, not necessarily the bot's default.
async function replyMatchingLanguage(transcript, persona) {
  const system =
    (persona && persona.trim()) ||
    "You are replying to a WhatsApp voice message as the account owner's personal AI assistant.";

  const instruction =
    system +
    " The user sent this as a VOICE NOTE. Detect what language they spoke in and reply " +
    "entirely in that same language, matching their tone. Keep it short, natural, and " +
    "conversational — like a real voice-note reply, not an email.";

  return generateText({
    prompt: transcript,
    system: instruction,
    maxTokens: 300,
  });
}

module.exports = { transcribeVoiceNote, replyMatchingLanguage };
