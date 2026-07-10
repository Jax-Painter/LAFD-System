import { Router, type IRouter } from "express";
import { adminAuth } from "../middlewares/adminAuth";
import { getClient } from "../bot/client";
import { getConfig, updateConfig } from "../bot/store";
import {
  GetBotConfigQueryParams,
  GetBotConfigResponse,
  UpdateBotConfigBody,
  UpdateBotConfigResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function resolveNames(
  guildId: string,
  cadetRoleId: string | null,
  cadetChannelId: string | null,
) {
  const guild = getClient()?.guilds.cache.get(guildId);
  return {
    cadetRoleName:
      cadetRoleId && guild
        ? (guild.roles.cache.get(cadetRoleId)?.name ?? null)
        : null,
    cadetChannelName:
      cadetChannelId && guild
        ? (guild.channels.cache.get(cadetChannelId)?.name ?? null)
        : null,
  };
}

router.get("/bot/config", async (req, res): Promise<void> => {
  const parsed = GetBotConfigQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { guildId } = parsed.data;
  const cfg = getConfig(guildId);
  const { cadetRoleName, cadetChannelName } = resolveNames(
    guildId,
    cfg.cadetRoleId,
    cfg.cadetChannelId,
  );

  res.json(
    GetBotConfigResponse.parse({
      guildId,
      ...cfg,
      cadetRoleName,
      cadetChannelName,
    }),
  );
});

router.put("/bot/config", adminAuth, async (req, res): Promise<void> => {
  const parsed = UpdateBotConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { guildId } = parsed.data;
  const patch: Partial<Record<"cadetRoleId" | "cadetChannelId", string | null>> =
    {};
  if ("cadetRoleId" in parsed.data) patch.cadetRoleId = parsed.data.cadetRoleId ?? null;
  if ("cadetChannelId" in parsed.data)
    patch.cadetChannelId = parsed.data.cadetChannelId ?? null;

  const updated = updateConfig(guildId, patch);
  const { cadetRoleName, cadetChannelName } = resolveNames(
    guildId,
    updated.cadetRoleId,
    updated.cadetChannelId,
  );

  req.log.info({ guildId, updated }, "Bot config updated");
  res.json(
    UpdateBotConfigResponse.parse({
      guildId,
      ...updated,
      cadetRoleName,
      cadetChannelName,
    }),
  );
});

export default router;
