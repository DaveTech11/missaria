module.exports = {
  apps: [
    {
      name: "miss-aria",
      script: "bot.js",
      cwd: __dirname,
      instances: 1, // must stay 1 — a second instance would fight over the same paired WhatsApp session
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
      },
      // .env is loaded by dotenv inside bot.js itself — pm2 doesn't need
      // to inject these, just make sure .env sits next to bot.js on the VPS.
    },
  ],
};
