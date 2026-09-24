'use strict';
const { AriaAgent } = require('./agent');
function createAriaAgent(ctx, registry) {
  return new AriaAgent(ctx, registry);
}
module.exports = { createAriaAgent };
