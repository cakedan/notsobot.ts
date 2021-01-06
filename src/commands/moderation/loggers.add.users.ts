import { Command, Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { createGuildLogger } from '../../api';
import { CommandTypes, GuildLoggerTypes } from '../../constants';

import { createLoggersEmbed } from './loggers';
import { LoggersAddBaseCommand, CommandArgs } from './loggers.add.base';


export default class LoggersAddUsersCommand extends LoggersAddBaseCommand {
  name = 'loggers add users';

  metadata = {
    description: 'Create a logger for user events.',
    examples: [
      'loggers add users',
      'loggers add users -channel user-logs',
      'loggers add users -in logs',
    ],
    type: CommandTypes.MODERATION,
    usage: 'loggers add users (-channel <text-channel mention|name>) (-in <category-channel mention|name>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;

    let channel: Structures.Channel;
    if (args.channel) {
      channel = args.channel;
    } else {
      channel = await guild.createChannel({
        name: 'user-logs',
        parentId: (args.in) ? args.in.id : undefined,
        type: ChannelTypes.GUILD_TEXT,
      });
    }

    const webhook = await channel.createWebhook({name: 'NotSoLogs'});
    const loggers = await createGuildLogger(context, guild.id, {
      channelId: channel.id,
      type: GuildLoggerTypes.USERS,
      webhookId: webhook.id,
      webhookToken: webhook.token,
    });
    return createLoggersEmbed(context, loggers, {title: `Created a User Logger in ${channel} (${channel.id})`});
  }
}
