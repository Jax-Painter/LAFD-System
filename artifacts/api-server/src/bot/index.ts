import {
  Client,
  GatewayIntentBits,
  Events,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { logger } from "../lib/logger";

const CADET_ROLE_ID = process.env["CADET_ROLE_ID"] ?? "1492048358767067146";
const CADET_CHAT_CHANNEL_ID =
  process.env["CADET_CHAT_CHANNEL_ID"] ?? "1493140035162341456";

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
    logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  });

  client.on(
    Events.GuildMemberUpdate,
    async (
      oldMember: GuildMember | PartialGuildMember,
      newMember: GuildMember,
    ) => {
      try {
        const hadRole = oldMember.roles.cache.has(CADET_ROLE_ID);
        const hasRole = newMember.roles.cache.has(CADET_ROLE_ID);

        // Only fire when the cadet role is newly added
        if (hadRole || !hasRole) return;

        logger.info(
          { userId: newMember.user.id, username: newMember.user.tag },
          "New cadet detected — sending congratulations",
        );

        const channel = newMember.guild.channels.cache.get(
          CADET_CHAT_CHANNEL_ID,
        ) as TextChannel | undefined;

        if (!channel) {
          logger.error(
            { channelId: CADET_CHAT_CHANNEL_ID },
            "Cadet chat channel not found",
          );
          return;
        }

        const channelList = CHANNEL_INFO.map(
          (ch) => `**${ch.name}** — <#${ch.id}>\n${ch.description}`,
        ).join("\n\n");

        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("🚒 Welcome to the LAFD Academy, Cadet!")
          .setDescription(
            `Congratulations <@${newMember.user.id}>! You have officially been accepted as an **LAFD | Cadet**.\n\nWelcome to the Los Angeles Fire Department — LARPC. We're excited to have you with us. Below are the key channels you'll need to get started.`,
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
          { userId: newMember.user.id, channelId: CADET_CHAT_CHANNEL_ID },
          "Congratulations message sent",
        );
      } catch (err) {
        logger.error({ err }, "Error handling guildMemberUpdate");
      }
    },
  );

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });

  return client;
}
