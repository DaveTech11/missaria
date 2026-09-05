// src/ai/tools/business.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");

/**
 * Real sock.getCatalog({ jid, limit }) — jid omitted defaults to the
 * bot's own account (Baileys' own convention). Only returns real data if
 * the account is actually a WhatsApp Business account with a catalog set
 * up; otherwise WhatsApp's server itself returns nothing to fetch,
 * reported here as NOT_A_BUSINESS_ACCOUNT rather than an empty catalog,
 * so a caller doesn't mistake "no products" for "not a business account."
 *
 * UNVERIFIED: this codebase's Baileys fork (github:xcoursed/baileys) has
 * not been confirmed to export getCatalog/productCreate/productUpdate/
 * productDelete with these exact names — they're standard on upstream
 * @whiskeysockets/baileys, but this fork wasn't checked line-by-line for
 * this pass (no node_modules/network in this sandbox, same limitation
 * documented for other unverified calls in this project). Confirm the
 * export exists before relying on these in production.
 */
define("getCatalog", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, limit }) {
    try {
      const catalog = await sock.getCatalog({ jid: jid || sock.user?.id, limit: limit || 20 });
      if (!catalog || !catalog.products) return fail("NOT_A_BUSINESS_ACCOUNT", "No catalog found — this account may not be a WhatsApp Business account.");
      return ok(catalog);
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("addProduct", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { name, description, price, currency, images }) {
    if (!name || !name.trim()) return fail("MISSING_FIELDS", "Need a product name.");
    try {
      const product = await sock.productCreate({
        name: name.trim(),
        description: description || "",
        price: price || 0,
        currency: currency || "USD",
        images: (images || []).map((url) => ({ url })),
        isHidden: false,
      });
      return ok(product);
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateProduct", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { productId, updates }) {
    if (!productId) return fail("MISSING_FIELDS", "Need the product's ID.");
    try {
      const product = await sock.productUpdate(productId, updates || {});
      return ok(product);
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("deleteProduct", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { productId }) {
    if (!productId) return fail("MISSING_FIELDS", "Need the product's ID.");
    try {
      await sock.productDelete([productId]);
      return ok({ productId, deleted: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

module.exports = {};
