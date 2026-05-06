import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const interactionRoot = path.resolve(process.cwd(), "..", "source", "interactions", "commands");
let catalogCache = null;

function normalizeUsage(input) {
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === "string" && input.trim()) return [input.trim()];
  return [];
}

function normalizeList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === "string" && input.trim()) return [input.trim()];
  if (typeof input?.toArray === "function") {
    return (input.toArray() || []).filter(Boolean).map(String);
  }
  return [];
}

function cleanCommandName(fileName) {
  return fileName.replace(/\.js$/, "").toLowerCase();
}

function titleCaseWords(value) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function describeCommand(name, category, usage = []) {
  const friendlyName = titleCaseWords(name);
  const friendlyCategory = titleCaseWords(category || "General");
  const firstUsage = usage[0] ? ` Use \`${usage[0]}\` from Discord chat or slash commands where available.` : "";

  const categoryDescriptions = {
    antinuke: `Configure or inspect anti-nuke protection for destructive server actions.${firstUsage}`,
    automod: `Configure message-guard automation for spam, links, mentions, caps, and repeat-message protection.${firstUsage}`,
    moderation: `Run a moderation action or inspect moderation state for this server.${firstUsage}`,
    utilities: `Use a utility command for server, user, bot, or helper information.${firstUsage}`,
    utility: `Use a utility command for server, user, bot, or helper information.${firstUsage}`,
    welcome: `Manage welcome, greeting, onboarding, or member-arrival behavior.${firstUsage}`,
    music: `Control music playback, queues, filters, or player state.${firstUsage}`,
    owner: `Owner-only maintenance command for bot administration.${firstUsage}`,
    info: `View useful information from the bot or this Discord server.${firstUsage}`,
    image: `Generate, inspect, or transform media with a bot image command.${firstUsage}`,
    fun: `Run a fun or social command for the current server.${firstUsage}`,
    economy: `Use an economy command for balances, rewards, or progression.${firstUsage}`
  };

  return categoryDescriptions[category.toLowerCase()] || `Run the ${friendlyName} command from the ${friendlyCategory} module.${firstUsage}`;
}

function fallbackCommand(category, fileName) {
  const name = cleanCommandName(fileName);
  return {
    name,
    description: describeCommand(name, category, [name]),
    category,
    usage: [name],
    aliases: [],
    cooldown: 0,
    userPerms: [],
    botPerms: [],
    configurable: ["Moderation", "Utilities", "Welcome", "antinuke", "automod"].includes(category)
  };
}

function commandFromDefinition(definition, category, fileName) {
  const globalDefinition = definition?.Global || {};
  const categoryName = String(globalDefinition.category || definition?.category || category);
  const name = String(globalDefinition.name || definition?.name || cleanCommandName(fileName)).toLowerCase();
  const usage = normalizeUsage(globalDefinition.usage ?? definition?.usage ?? name);
  const rawDescription = String(globalDefinition.description || definition?.description || "").trim();

  return {
    name,
    description: rawDescription && rawDescription !== "No description provided."
      ? rawDescription
      : describeCommand(name, categoryName, usage),
    category: categoryName,
    usage,
    aliases: normalizeList(globalDefinition.aliases ?? definition?.aliases),
    cooldown: Number(globalDefinition.cooldown ?? definition?.cooldown ?? 0),
    userPerms: normalizeList(globalDefinition.userPerms ?? definition?.userPerms),
    botPerms: normalizeList(globalDefinition.botPerms ?? definition?.botPerms),
    configurable:
      Boolean(definition?.options?.length || globalDefinition.options?.length) ||
      ["Moderation", "Utilities", "Welcome", "antinuke", "automod"].includes(categoryName)
  };
}

export function loadCommandCatalog() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.commands;
  }

  if (!fs.existsSync(interactionRoot)) return [];

  const commands = [];
  for (const category of fs.readdirSync(interactionRoot)) {
    const categoryPath = path.join(interactionRoot, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const fileName of fs.readdirSync(categoryPath)) {
      if (!fileName.endsWith(".js") || fileName.startsWith("_")) continue;

      const filePath = path.join(categoryPath, fileName);

      try {
        const ImportedCommand = require(filePath);
        if (typeof ImportedCommand !== "function") {
          commands.push(fallbackCommand(category, fileName));
          continue;
        }

        const definition = new ImportedCommand(
          { config: { Client: { Prefix: "?", emoji: {} } } },
          cleanCommandName(fileName)
        );

        commands.push(commandFromDefinition(definition, category, fileName));
      } catch {
        commands.push(fallbackCommand(category, fileName));
      }
    }
  }

  const sorted = commands.sort((left, right) => {
    const categorySort = left.category.localeCompare(right.category);
    return categorySort || left.name.localeCompare(right.name);
  });

  catalogCache = {
    commands: sorted,
    expiresAt: Date.now() + 5 * 60_000
  };

  return sorted;
}
