/**
 * Singleton Discord client accessor.
 * The bot sets the client on startup; routes read it to fetch guild data.
 */
import { Client } from "discord.js";

let _client: Client | null = null;

export function setClient(client: Client): void {
  _client = client;
}

export function getClient(): Client | null {
  return _client;
}
