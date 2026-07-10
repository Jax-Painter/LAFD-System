import {
  Client,
  GatewayIntentBits,
  Events,
  GuildMember,
  PartialGuildMember,
  EmbedBuilder,
  Colors,
  DiscordAPIError,
  BaseGuildTextChannel,
} from "discord.js";
import { logger } from "../lib/logger";
import { setClient } from "./client";
import { getConfig } from "./store";

const CHANNEL_INFO = [
  {
    name: "📋 Academy Information",
    id: "1493140021836775605",
    description: "Everything you need to know about the academy program",
  },
  {
    name: "📝 Academy Exam",
    id: "1493140030636687441",
    description: "Exam details, dates, and study resources",
  },
  {
    name: "🚗 Academy Ride-Along",
    id: "1493140032012423218",
    description: "Information about ride-along opportunities",
  },
  {
    name: "📋 Ride-Along Request",
    id: "1493140027708801054",
    description: "Submit your ride-along requests here",
  },
  {
    name: "🏆 Academy Results",
    id: "1493140025892933864",
    description: "Academy test and evaluation results",
  },
  {
    name: "📢 Training Announcements",
    id: "1504585673854812350",
    description: "Stay up to date with training schedules and announcements",
  },
];

export function createDiscordBot(): Client | null {
  const token = process.env["DISCORD_BOT_TOKEN"];

  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — Discord bot will not start");
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    setClient(client);
    logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  });

  client.on(
    Events.GuildMemberUpdate,
    async (
      oldMember: GuildMember | PartialGuildMember,
      newMember: GuildMember,
    ) => {
      try {
        // If old member is partial, fetch the full record so role comparison is accurate.
        // Without this, oldMember.roles.cache may be empty and trigger false positives.
        const { cadetRoleId, cadetChannelId } = getConfig(newMember.guild.id);

        if (!cadetRoleId || !cadetChannelId) {
          logger.warn("Cadet role or channel not configured — skipping");
          return;
        }

        const resolvedOld = oldMember.partial
          ? await oldMember.fetch()
          : oldMember;

        const hadRole = resolvedOld.roles.cache.has(cadetRoleId);
        const hasRole = newMember.roles.cache.has(cadetRoleId);

        // Only fire when the cadet role is newly added
        if (hadRole || !hasRole) return;

        logger.info(
          { userId: newMember.user.id, username: newMember.user.tag },
          "New cadet detected — sending congratulations",
        );

        // Prefer cached channel; fall back to fetch so we don't miss non-cached channels.
        const rawChannel =
          newMember.guild.channels.cache.get(cadetChannelId) ??
          (await newMember.guild.channels.fetch(cadetChannelId));

        if (!rawChannel) {
          logger.error(
            { channelId: cadetChannelId },
            "Cadet chat channel not found",
          );
          return;
        }

        // Runtime type guard: only send if the channel can receive messages.
        if (!rawChannel.isTextBased() || rawChannel.isDMBased()) {
          logger.error(
            { channelId: cadetChannelId, channelType: rawChannel.type },
            "Cadet chat channel is not a sendable text channel",
          );
          return;
        }

        const channel = rawChannel as BaseGuildTextChannel;

        const channelList = CHANNEL_INFO.map(
          (ch) => `**${ch.name}** — <#${ch.id}>\n${ch.description}`,
        ).join("\n\n");

        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription(
            `## <:lafd:1493151973900554330> Welcome to the LAFD Academy, Cadet! <:lafd:1493151973900554330>\n\nCongratulations <@${newMember.user.id}>! You have officially been accepted as an **LAFD | Cadet**.\n\nWelcome to the Los Angeles Fire Department — LARPC. We're excited to have you with us. Below are the key channels you'll need to get started.`,
          )
          .addFields({
            name: "📌 Key Channels",
            value: channelList,
          })
          .setFooter({
            text: "Los Angeles Fire Department — LARPC",
          })
          .setTimestamp();

        await channel.send({
          content: `<@${newMember.user.id}>`,
          embeds: [embed],
        });

        logger.info(
          { userId: newMember.user.id, channelId: cadetChannelId },
          "Congratulations message sent",
        );
      } catch (err) {
        if (err instanceof DiscordAPIError) {
          logger.error(
            { code: err.code, status: err.status, message: err.message },
            "Discord API error handling guildMemberUpdate",
          );
        } else {
          logger.error({ err }, "Unexpected error handling guildMemberUpdate");
        }
      }
    },
  );

  client.login(token).catch((err: unknown) => {
    logger.error({ err }, "Failed to login to Discord");
  });

  return client;
}
