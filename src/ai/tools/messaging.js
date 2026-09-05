// src/ai/tools/messaging.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");

define("sendMessage", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, text }) {
    try {
      const result = await sock.sendMessage(jid, { text });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the message was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * sendImage/sendDocument/sendAudio/sendVideo: sock.sendMessage(jid, {
 * image/document/audio/video: <url|Buffer>, ... }) is real, standard
 * Baileys media-send behavior — not invented for this pass.
 *
 * What IS still missing, honestly: these require an actual media source
 * (a `url` string, or a `buffer` + `mimetype`) passed in by the caller.
 * None of these tools download or fabricate media themselves. Wiring
 * "use the image the owner just sent" (spec §40/42) means extracting that
 * media from the owner's WhatsApp message via Baileys' downloadMediaMessage
 * at the point ownerRouter handles the message — that's a real capability
 * this Baileys fork should expose too, but I have not verified the fork's
 * exact export for it, so I'm not wiring that extraction blind. The tools
 * below are fully real for any caller that already has bytes or a URL.
 */
function resolveMediaSource({ url, buffer }) {
  if (url) return { url };
  if (buffer) return { url: undefined, buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, "base64") };
  return null;
}

define("sendImage", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, url, buffer, caption }) {
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No image url or buffer was provided.");
    try {
      const result = await sock.sendMessage(jid, { image: source.buffer || { url: source.url }, caption });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the image was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("sendDocument", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, url, buffer, filename, mimetype, caption }) {
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No document url or buffer was provided.");
    try {
      const result = await sock.sendMessage(jid, {
        document: source.buffer || { url: source.url },
        fileName: filename || "document",
        mimetype: mimetype || "application/octet-stream",
        caption,
      });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the document was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("sendAudio", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, url, buffer, mimetype, ptt }) {
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No audio url or buffer was provided.");
    try {
      const result = await sock.sendMessage(jid, {
        audio: source.buffer || { url: source.url },
        mimetype: mimetype || "audio/mp4",
        ptt: !!ptt,
      });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the audio was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("sendVideo", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, url, buffer, caption }) {
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No video url or buffer was provided.");
    try {
      const result = await sock.sendMessage(jid, { video: source.buffer || { url: source.url }, caption });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the video was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real Baileys poll message type — sock.sendMessage(jid, { poll: {...} }).
 * `selectableCount` defaults to 1 (single-choice); WhatsApp allows more
 * for multi-select polls, passed through as given. Needs at least 2
 * options — a 1-option "poll" isn't a real WhatsApp poll.
 */
define("sendPoll", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, question, options, selectableCount }) {
    if (!question || !question.trim()) return fail("MISSING_FIELDS", "Need a poll question.");
    const values = (options || []).map((o) => String(o).trim()).filter(Boolean);
    if (values.length < 2) return fail("MISSING_FIELDS", "A poll needs at least 2 options.");
    try {
      const result = await sock.sendMessage(jid, {
        poll: { name: question.trim(), values, selectableCount: selectableCount || 1 },
      });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the poll was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real Baileys location message — sock.sendMessage(jid, { location: {...}
 * }). Requires actual numeric coordinates; this tool doesn't geocode a
 * place name into coordinates itself (that's a separate lookup this
 * codebase doesn't have wired to a maps provider), so a caller must
 * already have lat/lng.
 */
define("sendLocation", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, latitude, longitude, name, address }) {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return fail("MISSING_FIELDS", "Need numeric latitude and longitude.");
    }
    try {
      const result = await sock.sendMessage(jid, {
        location: { degreesLatitude: latitude, degreesLongitude: longitude, name, address },
      });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the location was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real Baileys voice-note message — sock.sendMessage(jid, { audio: {...},
 * ptt: true, mimetype: 'audio/ogg; codecs=opus' }). `ptt: true` is what
 * makes WhatsApp render it as a voice note (the mic-icon bubble) instead
 * of a generic audio-file attachment — omitting it sends a regular audio
 * file, a real and different WhatsApp message type.
 *
 * Takes a url or buffer of already-encoded audio, same as sendImage —
 * this does NOT do text-to-speech. There's no TTS engine wired into this
 * codebase, so "say this as a voice note" from typed text isn't
 * buildable here without adding a TTS provider first; that's a real,
 * separate integration, not something to fake with a stub.
 */
define("sendVoiceNote", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, url, buffer }) {
    if (!jid) return fail("MISSING_FIELDS", "Need a chat to send the voice note to.");
    if (!url && !buffer) return fail("NO_MEDIA_SOURCE", "No audio url or buffer was provided.");
    const audio = buffer ? (Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, "base64")) : { url };
    try {
      const result = await sock.sendMessage(jid, { audio, ptt: true, mimetype: "audio/ogg; codecs=opus" });
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the voice note was sent.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Sends a report by email using SMTP credentials that are ALREADY
 * configured server-side (EMAIL_USER / EMAIL_PASS in .env) — never
 * accepted as a chat argument. Deliberately does not take a password
 * parameter at all: there's no code path here that could receive or log
 * one, so there's nothing to "auto-delete" — the credential never enters
 * a WhatsApp message in the first place.
 *
 * Real nodemailer call — this project already lists nodemailer as a
 * dependency. I can't execute an actual SMTP send in the sandbox I'm
 * building this in (no installed node_modules, no network), so this is
 * unverified at the network-call level; the report-formatting logic
 * around it (in ownerRouter.js) is independently tested without needing
 * SMTP at all.
 */
define("sendEmailReport", {
  permission: PERMISSION.OWNER,
  async run(_ctx, { to, subject, body }) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) {
      return fail("EMAIL_NOT_CONFIGURED", "EMAIL_USER/EMAIL_PASS aren't set in this bot's environment.");
    }
    if (!to || !subject || !body) {
      return fail("MISSING_FIELDS", "Need a recipient, subject, and body to send a report.");
    }
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
      const info = await transporter.sendMail({ from: user, to, subject, text: body });
      // Never return the credential — only confirmation the send happened.
      return ok({ to, subject, messageId: info?.messageId || null });
    } catch (err) {
      return fail("EMAIL_SEND_FAILED", err.message);
    }
  },
});
