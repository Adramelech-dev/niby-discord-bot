import Client from '@/structures/Client';
import { Command } from '@/structures/Command';
import { AudioOutputs } from 'lavalink-client';

export default {
   execute(client: Client, message, args, prefix, guildData, userData, player) {
      if (!client.utils.music.isPlaying(message, player, prefix, guildData.language)) return;
      // Not allowed? return
      if (!client.utils.music.isAllowedToAction(message, this.NAME, guildData)) return;

      return client.utils.music.setAudioOutput(message, this.NAME as AudioOutputs, player, guildData.language);
   },
} as Command;
