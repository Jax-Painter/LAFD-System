/**
 * Per-guild in-memory config store.
 * Seeded from environment variables on startup; updated via the API.
 */

export interface GuildConfig {
  cadetRoleId: string | null;
  cadetChannelId: string | null;
}

// Default guild seeded from env vars (the original LAFD server)
const DEFAULT_GUILD_ID = "1492048130093486150";

const configs = new Map<string, GuildConfig>([
  [
    DEFAULT_GUILD_ID,
    {
      cadetRoleId: process.env["CADET_ROLE_ID"] ?? "1492048358767067146",
      cadetChannelId:
        process.env["CADET_CHAT_CHANNEL_ID"] ?? "1493140035162341456",
    },
  ],
]);

export function getConfig(guildId: string): GuildConfig {
  return configs.get(guildId) ?? { cadetRoleId: null, cadetChannelId: null };
}

/**
 * Patch the config for a guild. Only keys explicitly present in the patch
 * are applied — including null, which clears a field.
 */
export function updateConfig(
  guildId: string,
  patch: Partial<Record<keyof GuildConfig, string | null>>,
): GuildConfig {
  const current = getConfig(guildId);
  const updated: GuildConfig = { ...current };
  if ("cadetRoleId" in patch) updated.cadetRoleId = patch.cadetRoleId ?? null;
  if ("cadetChannelId" in patch)
    updated.cadetChannelId = patch.cadetChannelId ?? null;
  configs.set(guildId, updated);
  return { ...updated };
}
