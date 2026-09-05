// services/waUpload.js
//
// Small helper to get a public URL for a Buffer. Some of our AI backends
// (speech-to-text in particular) only accept a URL, not raw bytes, but
// Baileys only ever gives us a Buffer for a downloaded voice note or
// image. Catbox.moe's anonymous upload endpoint needs no API key and is
// good enough to bridge that gap.

const axios = require("axios");
const FormData = require("form-data");

async function uploadBuffer(buffer, filename = "file.bin") {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename });

    const { data } = await axios.post(
      "https://catbox.moe/user/api.php",
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000,
      }
    );

    const url = String(data || "").trim();
    if (!url.startsWith("http")) {
      throw new Error("Catbox did not return a URL: " + url);
    }
    return url;
  } catch (err) {
    console.error("waUpload error:", err.message);
    return null;
  }
}

module.exports = { uploadBuffer };
