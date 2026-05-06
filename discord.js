import { getConfig } from "./config.js";

const DISCORD_API = "https://discord.com/api/v10";

export async function discordRequest(path, token, init = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Discord request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchDiscordToken(code, redirectUri) {
  const config = getConfig();
  const body = new URLSearchParams({
    client_id: config.discordClientId,
    client_secret: config.discordClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchDiscordUser(accessToken) {
  return discordRequest("/users/@me", accessToken);
}

export async function fetchUserGuilds(accessToken) {
  const guilds = await discordRequest("/users/@me/guilds", accessToken);
  return guilds.filter((guild) => guild.owner || hasDashboardPermission(guild.permissions));
}

export async function fetchBotGuild(guildId) {
  const config = getConfig();
  const response = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
    headers: {
      Authorization: `Bot ${config.discordBotToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) return null;
  return response.json();
}

export async function fetchBotGuilds() {
  const config = getConfig();
  if (!config.botApiBaseUrl) return [];

  const response = await fetch(`${config.botApiBaseUrl}/guilds`, {
    cache: "no-store",
    signal: AbortSignal.timeout(700)
  });

  if (!response.ok) return [];
  return response.json();
}

export function hasDashboardPermission(permissionString) {
  try {
    const permissions = BigInt(permissionString);
    const administrator = 1n << 3n;
    const manageGuild = 1n << 5n;
    return (permissions & administrator) === administrator || (permissions & manageGuild) === manageGuild;
  } catch {
    return false;
  }
}

export function getGuildIconUrl(guildId, icon) {
  if (!icon) return null;
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=256`;
}
