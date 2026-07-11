import {
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  DiscordAPIError,
  BaseGuildTextChannel,
} from "discord.js";
import { logger } from "../lib/logger";
import { getConfig } from "./store";

// ─── Command definitions ──────────────────────────────────────────────────────

export const COMMANDS = [
  new SlashCommandBuilder()
    .setName("host-ride-along")
    .setDescription("Post a ride-along announcement to the configured channel")
    .addStringOption((opt) =>
      opt
        .setName("time")
        .setDescription("The time of the ride-along (e.g. 3:00 PM EST)")
        .setRequired(true),
    ),
].map((cmd) => cmd.toJSON());

// ─── Command registration ─────────────────────────────────────────────────────

/**
 * Registers slash commands as guild commands (instant — no propagation delay)
 * for every guild the bot is currently in.
 */
export async function registerCommands(
  token: string,
  clientId: string,
  guildIds: string[],
): Promise<void> {
  const rest = new REST().setToken(token);

  for (const guildId of guildIds) {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: COMMANDS,
      });
      logger.info({ guildId }, "Slash commands registered");
    } catch (err) {
      if (err instanceof DiscordAPIError) {
        logger.error(
          { guildId, code: err.code, status: err.status },
          "Failed to register slash commands",
        );
      } else {
        logger.error({ guildId, err }, "Unexpected error registering commands");
      }
    }
  }
}

// ─── Command handlers ─────────────────────────────────────────────────────────

export async function handleHostRideAlong(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true,
    });
    return;
  }

  const { rideAlongChannelId, rideAlongMessage, cadetRoleId } = getConfig(guildId);

  if (!rideAlongChannelId) {
    await interaction.reply({
      content:
        "No ride-along channel is configured. Set one in the admin dashboard first.",
      ephemeral: true,
    });
    return;
  }

  const time = interaction.options.getString("time", true);
  const host = interaction.user;

  const rawChannel =
    interaction.guild?.channels.cache.get(rideAlongChannelId) ??
    (await interaction.guild?.channels.fetch(rideAlongChannelId));

  if (!rawChannel || !rawChannel.isTextBased() || rawChannel.isDMBased()) {
    await interaction.reply({
      content: "The configured ride-along channel is invalid or inaccessible.",
      ephemeral: true,
    });
    return;
  }

  const channel = rawChannel as BaseGuildTextChannel;

  const description = [
    `# <:lafd:1493151973900554330> LAFD Ride-Along`,
    `A ride along is being hosted right now!`,
    ``,
    `**Host:** <@${host.id}>`,
    `**Time:** ${time}`,
    `**Server:** LARPC`,
    ``,
    `**Notes:** ${rideAlongMessage}`,
  ].join("\n");

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription(description)
    .setFooter({ text: "Los Angeles Fire Department — LARPC" })
    .setTimestamp();

  // Role ping goes in content so members actually get notified
  const pingContent = cadetRoleId ? `<@&${cadetRoleId}>` : undefined;

  try {
    await channel.send({ content: pingContent, embeds: [embed] });
    await interaction.reply({
      content: `Ride-along announcement posted to <#${rideAlongChannelId}>.`,
      ephemeral: true,
    });
    logger.info(
      { guildId, channelId: rideAlongChannelId, userId: host.id },
      "Ride-along announcement posted",
    );
  } catch (err) {
    if (err instanceof DiscordAPIError) {
      logger.error(
        { code: err.code, status: err.status },
        "Failed to post ride-along announcement",
      );
      await interaction.reply({
        content: "Failed to post the announcement. Check bot permissions.",
        ephemeral: true,
      });
    } else {
      throw err;
    }
  }
}
