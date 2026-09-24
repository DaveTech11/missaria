// src/owner/mediaExtractor.js
//
// Two real sources of "the image/video/document/audio the owner meant":
// 1. Directly attached to the current message (owner sent an image WITH
//    a caption like "send this to Zuno").
// 2. Quoted — the owner replied to an earlier message that had media,
//    with a text command like "send this to Zuno".
//
// findMediaMessage() is a pure function over the message shape (no I/O),
// so it's fully unit-testable without needing Baileys installed.
// downloadAttachedMedia() does the actual network download and is only
// as verified as the fork's downloadMediaMessage export — flagged below.

function typeFromContent(content) {
  if (content.imageMessage) return "image";
  if (content.videoMessage) return "video";
  if (content.documentMessage) return "document";
  if (content.audioMessage) return "audio";
  return null;
}

/**
 * Returns { type, content, sourceMsg } for the media the owner meant, or
 * null if there's no media attached or quoted at all.
 */
function findMediaMessage(msg) {
  const message = msg?.message;
  if (!message) return null;

  // 1. Directly attached to this message.
  const directType = typeFromContent(message);
  if (directType) {
    return { type: directType, content: message[`${directType}Message`], sourceMsg: msg };
  }

  // 2. Quoted — a reply to an earlier message that had media.
  const ctxInfo = message.extendedTextMessage?.contextInfo;
  const quoted = ctxInfo?.quotedMessage;
  if (quoted) {
    const quotedType = typeFromContent(quoted);
    if (quotedType) {
      // Baileys' downloadMediaMessage needs a message shaped like a real
      // WAMessage (key + message) to download quoted content — this
      // reconstructs that from the reply's contextInfo, which carries the
      // original message's id/participant.
      const syntheticMsg = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: ctxInfo.stanzaId,
          fromMe: false,
          participant: ctxInfo.participant,
        },
        message: quoted,
      };
      return { type: quotedType, content: quoted[`${quotedType}Message`], sourceMsg: syntheticMsg };
    }
  }

  return null;
}

/**
 * UNVERIFIED at the network level: this codebase's Baileys fork
 * (github:xcoursed/baileys) has not been confirmed to export
 * downloadMediaMessage with this exact signature — it's standard on
 * upstream @whiskeysockets/baileys, but wasn't checked line-by-line for
 * this fork (no node_modules/network in the sandbox this was built in).
 * findMediaMessage() above is fully verified independent of this.
 */
async function downloadAttachedMedia(sock, msg) {
  const found = findMediaMessage(msg);
  if (!found) {
    return { success: false, error: { code: "NO_MEDIA", message: "No image, video, document, or audio attached or replied to." } };
  }
  try {
    const { downloadMediaMessage } = require("@whiskeysockets/baileys");
    const buffer = await downloadMediaMessage(found.sourceMsg, "buffer", {}, { reuploadRequest: sock.updateMediaMessage });
    return {
      success: true,
      type: found.type,
      buffer,
      mimetype: found.content.mimetype || null,
      caption: found.content.caption || null,
      fileName: found.content.fileName || null,
    };
  } catch (err) {
    return { success: false, error: { code: "DOWNLOAD_FAILED", message: err.message } };
  }
}

module.exports = { findMediaMessage, downloadAttachedMedia };
