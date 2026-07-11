import {
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  Colors,
  DiscordAPIError,
  BaseGuildTextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { logger } from "../lib/logger";
import { getConfig } from "./store";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ATTEND_BUTTON_ID = "attend_ride_along";
const AUTHORIZED_ROLE_ID = "1493139720434225233";
const CADET_ROLE_PING = "<@&1492048358767067146>";

// Sentinel text used to detect an unclaimed trainee slot
const TRAINEE_UNCLAIMED = "**Trainee:** *Not yet claimed*";

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

// ─── Shared button row builder ────────────────────────────────────────────────

function buildButtons(attendDisabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Join Ride-Along")
      .setURL("https://erlc.gg/join/larpc")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setCustomId(ATTEND_BUTTON_ID)
      .setLabel("Attend Ride-Along")
      .setStyle(ButtonStyle.Success)
      .setDisabled(attendDisabled),
  );
}

// ─── /host-ride-along ─────────────────────────────────────────────────────────

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

  const member =
    interaction.guild?.members.cache.get(interaction.user.id) ??
    (await interaction.guild?.members.fetch(interaction.user.id));

  if (!member?.roles.cache.has(AUTHORIZED_ROLE_ID)) {
    await interaction.reply({
      content: "You do not have permission to host a ride-along.",
      ephemeral: true,
    });
    return;
  }

  const { rideAlongChannelId, rideAlongMessage } = getConfig(guildId);

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
    TRAINEE_UNCLAIMED,
    ``,
    `**Notes:** ${rideAlongMessage}`,
  ].join("\n");

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription(description)
    .setFooter({ text: "Los Angeles Fire Department — LARPC" })
    .setTimestamp();

  try {
    await channel.send({
      content: CADET_ROLE_PING,
      embeds: [embed],
      components: [buildButtons(false)],
    });
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

// ─── Attend Ride-Along button ─────────────────────────────────────────────────

export async function handleAttendRideAlong(
  interaction: ButtonInteraction,
): Promise<void> {
  const existingEmbed = interaction.message.embeds[0];

  if (!existingEmbed?.description) {
    await interaction.reply({
      content: "Could not read the ride-along message.",
      ephemeral: true,
    });
    return;
  }

  // Guard: already claimed (shouldn't happen since button is disabled, but be safe)
  if (!existingEmbed.description.includes(TRAINEE_UNCLAIMED)) {
    await interaction.reply({
      content: "A trainee has already claimed this ride-along.",
      ephemeral: true,
    });
    return;
  }

  // Swap the unclaimed placeholder for the user's mention
  const updatedDescription = existingEmbed.description.replace(
    TRAINEE_UNCLAIMED,
    `**Trainee:** <@${interaction.user.id}>`,
  );

  const updatedEmbed = EmbedBuilder.from(existingEmbed).setDescription(
    updatedDescription,
  );

  await interaction.update({
    embeds: [updatedEmbed],
    components: [buildButtons(true)], // disable the Attend button
  });

  logger.info(
    { userId: interaction.user.id, messageId: interaction.message.id },
    "Trainee claimed ride-along",
  );
}
