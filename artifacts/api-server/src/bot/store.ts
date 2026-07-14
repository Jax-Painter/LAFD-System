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

const DEFAULT_RIDE_ALONG_MESSAGE = `Before joining make sure to check the following!
> * You've done the Academy Exam.
> * Make sure to check out our SOP, BLS Fire Calls Guide -> https://discord.com/channels/1492048130093486150/1493140021836775605
> * Once in-Game make sure to wear the LAFD | Cadet uniform.
> * Head over to briefing room and wait for the host to arrive.
> * Use callsign RA-1 (If claimed continue with next number).`;

// Default guild seeded from env vars (the LAFD LARPC server)
const DEFAULT_GUILD_ID = "1492048130093486150";

const configs = new Map<string, GuildConfig>([
  [
    DEFAULT_GUILD_ID,
    {
      cadetRoleId: process.env["CADET_ROLE_ID"] ?? "1492048358767067146",
      cadetChannelId:
        process.env["CADET_CHAT_CHANNEL_ID"] ?? "1493140035162341456",
      rideAlongChannelId: process.env["RIDE_ALONG_CHANNEL_ID"] ?? "1504585673854812350",
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
