import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let sharedSettings = null;
try {
  sharedSettings = require("../../source/settings");
} catch {
  sharedSettings = null;
}

const defaultSecret =
  process.env.NODE_ENV === "production"
    ? "build-nextauth-secret"
    : sharedSettings?.Client?.botSecret ||
      sharedSettings?.Client?.Token ||
      "local-monarchclient-secret";

export function getConfig() {
  return {
    nextAuthSecret: process.env.NEXTAUTH_SECRET || defaultSecret,
    discordClientId: process.env.DISCORD_CLIENT_ID || sharedSettings?.Client?.botId || "",
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET || sharedSettings?.Client?.botSecret || "",
    discordBotToken: process.env.DISCORD_BOT_TOKEN || sharedSettings?.Client?.Token || "",
    mongoUri: process.env.MONGODB_URI || sharedSettings?.Database?.Uri || "",
    botApiBaseUrl: process.env.BOT_API_BASE_URL || "http://localhost:3001"
  };
}
