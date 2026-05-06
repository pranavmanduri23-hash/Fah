import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const guildSchema = new Schema(
  {
    id: { type: String, required: true },
    prefix: { type: String, default: "?" },
    disabledCommands: { type: [String], default: [] },
    disabledChannels: { type: [String], default: [] },
    blacklisted: { type: Boolean, default: false },
    welcome: { type: Object, default: { channel: null, content: " ", embeds: {} } },
    autorole: {
      type: Object,
      default: { enabled: false, botRoles: [], humanRoles: [] }
    },
    greet: {
      type: Object,
      default: {
        enabled: false,
        channel: [],
        content: "Welcome $user_mention to $guild_name!",
        deletetime: 5000
      }
    },
    tickets: {
      type: Object,
      default: {
        enabled: false,
        categoryId: null,
        logChannelId: null,
        panelChannelId: null,
        supportRoleIds: [],
        counter: 0
      }
    },
    applications: {
      type: Object,
      default: {
        enabled: false,
        panelChannelId: null,
        reviewChannelId: null,
        reviewerRoleIds: [],
        questions: [],
        counter: 0
      }
    },
    automod: { type: Object, default: { enabled: false } },
    dashboard: {
      type: Object,
      default: {
        commandPermissions: {},
        commandCooldowns: {},
        commandToggles: {},
        roleBindings: {}
      }
    }
  },
  { minimize: false }
);

const antiNukeSchema = new Schema(
  {
    id: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    punishment: { type: String, default: "ban" },
    whitelistusers: { type: [String], default: [] },
    logchannelid: { type: String, default: null },
    antivanity: { type: Boolean, default: false },
    MonarchClientrole: { type: String, default: null },
    thresholds: {
      type: Object,
      default: {
        roleCreate: 3,
        roleUpdate: 3,
        roleDelete: 3,
        channelCreate: 3,
        channelDelete: 3,
        webhookCreate: 2,
        bans: 3,
        kicks: 3
      }
    },
    responses: {
      type: Object,
      default: {
        lockdown: false,
        removeRoles: true,
        alertOnly: false
      }
    }
  },
  { minimize: false }
);

const caseSchema = new Schema({
  guildId: String,
  caseId: Number,
  userId: String,
  moderatorId: String,
  action: { type: String, default: "warn" },
  reason: { type: String, default: "No reason provided" },
  date: { type: Date, default: Date.now }
});

const dashboardEventSchema = new Schema(
  {
    guildId: { type: String, index: true, required: true },
    type: { type: String, required: true },
    source: { type: String, default: "bot" },
    severity: { type: String, default: "info" },
    actorId: { type: String, default: null },
    actorTag: { type: String, default: null },
    commandName: { type: String, default: null },
    channelId: { type: String, default: null },
    summary: { type: String, required: true },
    details: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { minimize: false }
);

export const GuildModel = models.guildData || model("guildData", guildSchema);
export const AntiNukeModel = models.antiNukeData || model("antiNukeData", antiNukeSchema);
export const CaseModel = models.Case || model("Case", caseSchema);
export const DashboardEventModel = models.DashboardEvent || model("DashboardEvent", dashboardEventSchema);
