import { Router, type IRouter } from "express";
import { ChannelType, DiscordAPIError } from "discord.js";
import { getClient } from "../bot/client";
import {
  ListDiscordGuildsResponse,
  ListDiscordChannelsQueryParams,
  ListDiscordChannelsResponse,
  ListDiscordRolesQueryParams,
  ListDiscordRolesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/discord/guilds", async (req, res): Promise<void> => {
  const client = getClient();
  if (!client || !client.isReady()) {
    res.status(503).json({ error: "Discord bot is not connected" });
    return;
  }

  const guilds = client.guilds.cache.map((g) => ({
    id: g.id,
    name: g.name,
    iconUrl: g.iconURL() ?? null,
    memberCount: g.memberCount,
  }));

  req.log.info({ count: guilds.length }, "Returning Discord guilds");
  res.json(ListDiscordGuildsResponse.parse(guilds));
});

router.get("/discord/channels", async (req, res): Promise<void> => {
  const parsed = ListDiscordChannelsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const client = getClient();
  if (!client || !client.isReady()) {
    res.status(503).json({ error: "Discord bot is not connected" });
    return;
  }

  const guild = client.guilds.cache.get(parsed.data.guildId);
  if (!guild) {
    res.status(404).json({ error: "Guild not found" });
    return;
  }

  try {
    await guild.channels.fetch();
  } catch (err) {
    if (err instanceof DiscordAPIError) {
      req.log.error(
        { code: err.code, status: err.status },
        "Discord API error fetching channels",
      );
      res.status(503).json({ error: "Failed to fetch channels from Discord" });
      return;
    }
    throw err;
  }

  const channels = guild.channels.cache
    .filter(
      (ch) =>
        ch.type === ChannelType.GuildText ||
        ch.type === ChannelType.GuildAnnouncement,
    )
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      categoryName: ch.parent?.name ?? null,
    }))
    .sort((a, b) => {
      const cat = (a.categoryName ?? "").localeCompare(b.categoryName ?? "");
      return cat !== 0 ? cat : a.name.localeCompare(b.name);
    });

  req.log.info({ count: channels.length }, "Returning Discord channels");
  res.json(ListDiscordChannelsResponse.parse(channels));
});

router.get("/discord/roles", async (req, res): Promise<void> => {
  const parsed = ListDiscordRolesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const client = getClient();
  if (!client || !client.isReady()) {
    res.status(503).json({ error: "Discord bot is not connected" });
    return;
  }

  const guild = client.guilds.cache.get(parsed.data.guildId);
  if (!guild) {
    res.status(404).json({ error: "Guild not found" });
    return;
  }

  try {
    await guild.roles.fetch();
  } catch (err) {
    if (err instanceof DiscordAPIError) {
      req.log.error(
        { code: err.code, status: err.status },
        "Discord API error fetching roles",
      );
      res.status(503).json({ error: "Failed to fetch roles from Discord" });
      return;
    }
    throw err;
  }

  const roles = guild.roles.cache
    .filter((r) => !r.managed && r.name !== "@everyone")
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      position: r.position,
    }))
    .sort((a, b) => b.position - a.position);

  req.log.info({ count: roles.length }, "Returning Discord roles");
  res.json(ListDiscordRolesResponse.parse(roles));
});

export default router;
