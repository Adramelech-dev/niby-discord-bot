import { Guild, Locale } from "discord.js";
import { ExecuteSystems } from '@/handlers/SystemHandler';
import Client from '@/structures/Client';

export default async (client: Client, guild:Guild) => {
   const guildLocale = Object.keys(Locale).find((key) => Locale[key] === guild.preferredLocale) as Locale;
   const GUILD_DATA = await client.db.getGuildData(guild.id, guildLocale);

   // @ts-expect-error
   const eventName = this.default.NAME as string;
   return ExecuteSystems(client, eventName, GUILD_DATA, null, guild);
};
