// src/ai/reportFormatter.js
'use strict';

// Pure function: takes already-fetched real tool data and formats it into
// report text. Kept separate from the email-sending tool specifically so
// this logic can be tested without touching SMTP, a socket, or the network.

function buildReportText({ diagnostics, groups }) {
  const lines = [];
  lines.push("Miss Aria — Status Report");
  lines.push(new Date().toLocaleString());
  lines.push("");

  if (diagnostics) {
    lines.push("CONNECTION");
    lines.push(`  WhatsApp: ${diagnostics.connection?.state || "UNKNOWN"}`);
    lines.push(`  Groups: ${diagnostics.status?.groupCount ?? "?"}`);
    lines.push(`  Admin in: ${diagnostics.status?.adminGroupCount ?? "?"} groups`);
    lines.push(`  Uptime: ${formatUptime(diagnostics.status?.uptimeSeconds)}`);
    lines.push(`  Memory (RSS): ${diagnostics.memory?.rssMb ?? "?"} MB`);
    lines.push(`  Version: ${diagnostics.version?.name || "?"} ${diagnostics.version?.version || ""}`);
    lines.push("");
  }

  if (groups && groups.length) {
    lines.push(`GROUPS (${groups.length})`);
    for (const g of groups) {
      lines.push(`  - ${g.subject} (${g.participantCount} members)${g.isAnnounce ? " [locked]" : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatUptime(seconds) {
  if (seconds == null) return "?";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

module.exports = { buildReportText };
