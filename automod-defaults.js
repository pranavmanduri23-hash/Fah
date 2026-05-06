export const DEFAULT_AUTOMOD = {
  enabled: false,
  logChannelId: null,
  exemptChannels: [],
  exemptRoles: [],
  action: "delete",
  timeoutDurationMs: 600000,
  massMention: {
    enabled: true,
    limit: 5,
    blockEveryone: true
  },
  inviteLinks: {
    enabled: true,
    allowVanity: false
  },
  externalLinks: {
    enabled: false
  },
  caps: {
    enabled: true,
    minimumLength: 16,
    ratio: 0.7
  },
  spam: {
    enabled: true,
    intervalMs: 8000,
    maxMessages: 6
  },
  repeatedMessages: {
    enabled: true,
    windowMs: 120000,
    threshold: 3
  }
};

export function mergeAutomodConfig(input = {}) {
  return {
    ...DEFAULT_AUTOMOD,
    ...input,
    massMention: { ...DEFAULT_AUTOMOD.massMention, ...(input.massMention ?? {}) },
    inviteLinks: { ...DEFAULT_AUTOMOD.inviteLinks, ...(input.inviteLinks ?? {}) },
    externalLinks: { ...DEFAULT_AUTOMOD.externalLinks, ...(input.externalLinks ?? {}) },
    caps: { ...DEFAULT_AUTOMOD.caps, ...(input.caps ?? {}) },
    spam: { ...DEFAULT_AUTOMOD.spam, ...(input.spam ?? {}) },
    repeatedMessages: { ...DEFAULT_AUTOMOD.repeatedMessages, ...(input.repeatedMessages ?? {}) }
  };
}

export const DEFAULT_ANTI_NUKE = {
  enabled: false,
  punishment: "ban",
  whitelistusers: [],
  logchannelid: null,
  antivanity: false,
  thresholds: {
    roleCreate: 3,
    roleUpdate: 3,
    roleDelete: 3,
    channelCreate: 3,
    channelUpdate: 3,
    channelDelete: 3,
    webhookCreate: 2,
    webhookUpdate: 2,
    bans: 3,
    kicks: 3,
    botAdd: 1
  },
  responses: {
    lockdown: false,
    removeRoles: true,
    alertOnly: false
  }
};

export function mergeAntiNukeConfig(input = {}) {
  return {
    ...DEFAULT_ANTI_NUKE,
    ...input,
    thresholds: { ...DEFAULT_ANTI_NUKE.thresholds, ...(input.thresholds ?? {}) },
    responses: { ...DEFAULT_ANTI_NUKE.responses, ...(input.responses ?? {}) },
    whitelistusers: Array.isArray(input.whitelistusers) ? input.whitelistusers : []
  };
}
