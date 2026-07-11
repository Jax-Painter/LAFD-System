/**
 * Per-guild in-memory config store.
 * Seeded from environment variables on startup; updated via the API.
 */

export interface GuildConfig {
  cadetRoleId: string | null;
  cadetChannelId: string | null;
  rideAlongChannelId: string | null;
  rideAlongMessage: string;
}

const DEFAULT_RIDE_ALONG_MESSAGE = `A **Ride-Along** has been scheduled! This is your chance to experience the LAFD firsthand.

Check <#1493140032012423218> for full details and submit your request in <#1493140027708801054>.

Spots are **limited** — sign up early.`;

// Default guild seeded from env vars (the LAFD LARPC server)
const DEFAULT_GUILD_ID = "1492048130093486150";

const configs = new Map<string, GuildConfig>([
  [
    DEFAULT_GUILD_ID,
    {
      cadetRoleId: process.env["CADET_ROLE_ID"] ?? "1492048358767067146",
      cadetChannelId:
        process.env["CADET_CHAT_CHANNEL_ID"] ?? "1493140035162341456",
      rideAlongChannelId: null,
      rideAlongMessage: DEFAULT_RIDE_ALONG_MESSAGE,
    },
  ],
]);

export function getConfig(guildId: string): GuildConfig {
  return (
    configs.get(guildId) ?? {
      cadetRoleId: null,
      cadetChannelId: null,
      rideAlongChannelId: null,
      rideAlongMessage: DEFAULT_RIDE_ALONG_MESSAGE,
    }
  );
}

/**
 * Patch the config for a guild. Only keys explicitly present in the patch
 * are applied — including null, which clears nullable fields.
 */
export function updateConfig(
  guildId: string,
  patch: Partial<
    Record<
      "cadetRoleId" | "cadetChannelId" | "rideAlongChannelId",
      string | null
    > &
      Record<"rideAlongMessage", string>
  >,
): GuildConfig {
  const current = getConfig(guildId);
  const updated: GuildConfig = { ...current };
  if ("cadetRoleId" in patch) updated.cadetRoleId = patch.cadetRoleId ?? null;
  if ("cadetChannelId" in patch)
    updated.cadetChannelId = patch.cadetChannelId ?? null;
  if ("rideAlongChannelId" in patch)
    updated.rideAlongChannelId = patch.rideAlongChannelId ?? null;
  if ("rideAlongMessage" in patch && patch.rideAlongMessage !== undefined)
    updated.rideAlongMessage = patch.rideAlongMessage;
  configs.set(guildId, updated);
  return { ...updated };
}
