import { mergeAntiNukeConfig, mergeAutomodConfig } from "./automod-defaults.js";
import { loadCommandCatalog } from "./catalog.js";
import { connectDatabase } from "./db.js";
import { fetchBotGuild, fetchBotGuilds, fetchUserGuilds, getGuildIconUrl } from "./discord.js";
import { AntiNukeModel, CaseModel, DashboardEventModel, GuildModel } from "./models.js";

const dashboardGuildCache = new Map();
const userGuildCache = new Map();
const accessCache = new Map();
const configCache = new Map();
const overviewCache = new Map();
const musicCache = new Map();
const botStatusUrl = process.env.DASHBOARD_BOT_STATUS_URL || "http://127.0.0.1:3001";

async function syncBotRuntimeCache(guildId, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    await fetch(`${botStatusUrl}/guilds/${guildId}/cache`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch {
    // Saving should still work even if the bot is restarting.
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBotRuntimeMusic(guildId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`${botStatusUrl}/guilds/${guildId}/music`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.music || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGuildConfig(guild) {
  if (!guild) return guild;
  const plain = typeof guild.toObject === "function" ? guild.toObject() : { ...guild };
  return {
    ...plain,
    automod: mergeAutomodConfig(plain.automod ?? {})
  };
}

function normalizeAntiNukeConfig(antiNuke) {
  if (!antiNuke) return mergeAntiNukeConfig();
  const plain = typeof antiNuke.toObject === "function" ? antiNuke.toObject() : { ...antiNuke };
  return mergeAntiNukeConfig(plain);
}

async function getSessionGuilds(session) {
  const sessionGuilds = session.user.guilds ?? [];
  if (sessionGuilds.length) return sessionGuilds;
  if (!session.accessToken) return [];

  const cached = userGuildCache.get(session.user.id);
  if (cached && cached.expiresAt > Date.now()) return cached.guilds;

  const guilds = await fetchUserGuilds(session.accessToken).catch(() => []);
  userGuildCache.set(session.user.id, {
    guilds,
    expiresAt: Date.now() + 60_000
  });
  return guilds;
}

export async function assertGuildAccess(session, guildId) {
  const cacheKey = `${session.user.id}:${guildId}`;
  const cachedAccess = accessCache.get(cacheKey);
  if (cachedAccess && cachedAccess.expiresAt > Date.now()) return cachedAccess.guild;

  const cachedGuildList = dashboardGuildCache.get(session.user.id);
  const cachedDashboardGuild = cachedGuildList?.expiresAt && cachedGuildList.expiresAt > Date.now()
    ? cachedGuildList.guilds.find((entry) => entry.id === guildId)
    : null;

  if (cachedDashboardGuild) {
    accessCache.set(cacheKey, { guild: cachedDashboardGuild, expiresAt: Date.now() + 60_000 });
    return cachedDashboardGuild;
  }

  const sessionGuilds = await getSessionGuilds(session);
  const guilds = sessionGuilds.filter(
    (guild, index, all) => all.findIndex((entry) => entry.id === guild.id) === index
  );
  const guild = guilds.find((entry) => entry.id === guildId);
  if (!guild) return null;
  const botGuild = await fetchBotGuild(guildId).catch(() => null);
  if (!botGuild) return null;
  accessCache.set(cacheKey, { guild, expiresAt: Date.now() + 60_000 });
  return guild;
}

export async function listDashboardGuilds(session) {
  const sessionGuilds = await getSessionGuilds(session);
  const guilds = sessionGuilds.filter(
    (guild, index, all) => all.findIndex((entry) => entry.id === guild.id) === index
  );
  const signature = guilds.map((guild) => guild.id).sort().join(",");
  const cached = dashboardGuildCache.get(session.user.id);
  if (cached && cached.signature === signature && cached.expiresAt > Date.now()) {
    return cached.guilds;
  }

  let botGuilds = await fetchBotGuilds().catch(() => []);
  if (!botGuilds.length && guilds.length) {
    const checkedGuilds = await Promise.all(
      guilds.map((guild) => fetchBotGuild(guild.id).catch(() => null))
    );
    botGuilds = checkedGuilds.filter(Boolean);
  }
  if (!botGuilds.length) return [];

  const botGuildMap = new Map(botGuilds.map((guild) => [guild.id, guild]));
  const enriched = guilds.map((guild) => {
    const botGuild = botGuildMap.get(guild.id);
    return {
      id: guild.id,
      name: guild.name,
      iconUrl: botGuild?.iconUrl ?? getGuildIconUrl(guild.id, guild.icon),
      hasBot: Boolean(botGuild),
      memberCount: botGuild?.memberCount ?? botGuild?.approximate_member_count ?? null,
      onlineCount: botGuild?.onlineCount ?? botGuild?.approximate_presence_count ?? null
    };
  });

  const filtered = enriched
    .filter((guild) => guild.hasBot)
    .sort((left, right) => left.name.localeCompare(right.name));

  dashboardGuildCache.set(session.user.id, {
    guilds: filtered,
    signature,
    expiresAt: Date.now() + 60_000
  });

  return filtered;
}

export async function getGuildOverview(guildId) {
  const cached = overviewCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  await connectDatabase();

  const [guildConfig, antiNuke, recentCases, recentEvents] = await Promise.all([
    GuildModel.findOne({ id: guildId }).lean(),
    AntiNukeModel.findOne({ id: guildId }).lean(),
    CaseModel.find({ guildId }).sort({ date: -1 }).limit(100).lean(),
    DashboardEventModel.find({ guildId }).sort({ createdAt: -1 }).limit(200).lean()
  ]);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const charts = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now - dayMs * (6 - index));
    const end = new Date(start.getTime() + dayMs);
    const label = start.toLocaleDateString("en-US", { weekday: "short" });

    const eventBucket = recentEvents.filter((event) => {
      const created = new Date(event.createdAt).getTime();
      return created >= start.getTime() && created < end.getTime();
    });

    const caseBucket = recentCases.filter((entry) => {
      const created = new Date(entry.date).getTime();
      return created >= start.getTime() && created < end.getTime();
    });

    return {
      label,
      commands: eventBucket.filter((event) => event.type === "command.executed").length,
      automod: eventBucket.filter((event) => event.type === "automod.triggered").length,
      security: eventBucket.filter((event) => event.type.startsWith("security.")).length,
      moderation: caseBucket.length
    };
  });

  const overview = {
    guild: guildConfig,
    antiNuke,
    metrics: {
      totalCommands: recentEvents.filter((event) => event.type === "command.executed").length,
      automodTriggers: recentEvents.filter((event) => event.type === "automod.triggered").length,
      securityAlerts: recentEvents.filter((event) => event.type.startsWith("security.")).length,
      moderationActions: recentCases.length
    },
    charts,
    recentEvents: recentEvents.slice(0, 12),
    recentCases: recentCases.slice(0, 12)
  };

  overviewCache.set(guildId, { value: overview, expiresAt: Date.now() + 15_000 });
  return overview;
}

export async function getGuildConfiguration(guildId) {
  const cached = configCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  await connectDatabase();
  const [guild, antiNuke] = await Promise.all([
    GuildModel.findOne({ id: guildId }).lean(),
    AntiNukeModel.findOne({ id: guildId }).lean()
  ]);

  const value = { guild: normalizeGuildConfig(guild), antiNuke: normalizeAntiNukeConfig(antiNuke) };
  configCache.set(guildId, { value, expiresAt: Date.now() + 20_000 });
  return value;
}

export async function getGuildMusic(guildId) {
  const cached = musicCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  await connectDatabase();
  const [nowPlaying, recentEvents] = await Promise.all([
    fetchBotRuntimeMusic(guildId),
    DashboardEventModel.find({ guildId, type: "music.playback" }).sort({ createdAt: -1 }).limit(20).lean()
  ]);

  const value = {
    nowPlaying,
    recentTracks: recentEvents.map((entry) => ({
      type: entry.type,
      severity: entry.severity,
      summary: entry.summary,
      createdAt: entry.createdAt,
      details: entry.details || {}
    }))
  };

  musicCache.set(guildId, { value, expiresAt: Date.now() + 5_000 });
  return value;
}

export async function updateGuildConfiguration(guildId, patch) {
  await connectDatabase();
  const current = await GuildModel.findOne({ id: guildId });
  const guild = current || new GuildModel({ id: guildId });
  const normalizedPatch = {
    ...patch,
    ...(patch.automod ? { automod: mergeAutomodConfig(patch.automod) } : {})
  };
  Object.assign(guild, normalizedPatch);
  await guild.save();
  const normalizedGuild = normalizeGuildConfig(guild);
  configCache.delete(guildId);
  overviewCache.delete(guildId);
  musicCache.delete(guildId);
  await syncBotRuntimeCache(guildId, { guild: normalizedGuild });
  return normalizedGuild;
}

export async function updateAntiNukeConfiguration(guildId, patch) {
  await connectDatabase();
  const current = await AntiNukeModel.findOne({ id: guildId });
  const antiNuke = current || new AntiNukeModel({ id: guildId });
  Object.assign(antiNuke, mergeAntiNukeConfig(patch));
  await antiNuke.save();
  const normalizedAntiNuke = normalizeAntiNukeConfig(antiNuke);
  configCache.delete(guildId);
  overviewCache.delete(guildId);
  musicCache.delete(guildId);
  await syncBotRuntimeCache(guildId, { antiNuke: normalizedAntiNuke });
  return normalizedAntiNuke;
}

export function getGuildCommandsSnapshot(guildConfig) {
  return {
    commands: loadCommandCatalog(),
    commandState: guildConfig?.dashboard ?? {},
    disabledCommands: guildConfig?.disabledCommands ?? [],
    disabledChannels: guildConfig?.disabledChannels ?? []
  };
}
