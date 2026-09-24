/** Registers all extracted Telegram handlers in their original order. */
const packs = [
  require("./01_bootstrap"),
  require("./02_moderation_admin"),
  require("./03_group_flow"),
  require("./04_owner_admin"),
  require("./05_membership_payments"),
  require("./06_reports_ai"),
  require("./07_media_generation"),
  require("./08_channels_downloads"),
  require("./09_agent"),
  require("./10_v10_upgrade"),
  require("./11_usage_limits"),
  require("./12_media_hub"),
  require("./13_aria_ai_companion"),
  require("./14_v12_upgrade"),
  require("./15_v13_power_upgrade"),
  require("./16_v14_workspace"),
  require("./17_v15_command_center"),
  require("./18_v16_media_security"),
  require("./19_v17_profile_premium"),
  require("./20_v21_image_premium"),
];

function registerHandlers(ctx) {
  for (const register of packs) register(ctx);
}

module.exports = { registerHandlers };
