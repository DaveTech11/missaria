// src/ai/tools/automation.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");
const scheduler = require("../../automation/scheduler");

define("scheduleMessage", {
  permission: PERMISSION.OWNER,
  async run({ senderJid }, { targetJid, text, schedule }) {
    const result = scheduler.createTask({
      ownerJid: senderJid,
      targetJid,
      action: "sendMessage",
      payload: { jid: targetJid, text },
      schedule,
    });
    return result.success ? ok(result.data) : fail(result.error.code, result.error.message);
  },
});

define("cancelScheduledMessage", {
  permission: PERMISSION.OWNER,
  async run({ senderJid }, { taskId }) {
    const result = scheduler.cancelTask(taskId, senderJid);
    return result.success ? ok(result.data) : fail(result.error.code, result.error.message);
  },
});

define("listScheduledTasks", {
  permission: PERMISSION.OWNER,
  async run({ senderJid }) {
    return ok(scheduler.listTasks(senderJid));
  },
});
