'use strict';

const DEFAULT_RISK = 'LOW';
const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function riskForTool(tool) {
  const risk = String(tool?.risk || DEFAULT_RISK).toUpperCase();
  return Object.prototype.hasOwnProperty.call(RISK_ORDER, risk) ? risk : DEFAULT_RISK;
}

function needsConfirmation(tool) {
  const risk = riskForTool(tool);
  return risk === 'HIGH' || risk === 'CRITICAL';
}

function canAutoRun(tool, opts = {}) {
  if (opts.confirmed) return true;
  return !needsConfirmation(tool);
}

module.exports = { RISK_ORDER, riskForTool, needsConfirmation, canAutoRun };
