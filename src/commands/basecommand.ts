import { Command, CommandClient, Constants, Utils } from 'detritus-client';
const { Permissions } = Constants;

import { EmbedColors, PermissionsText } from '../constants';
import { Parameters } from '../utils';


export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 5, type: 'guild'},
        {duration: 1000, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  onPermissionsFailClient(context: Command.Context, failed: Array<Constants.Permissions>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
    return context.editOrReply(`⚠ ${command} requires the bot to have ${permissions.join(', ')} to work.`);
  }

  onPermissionsFail(context: Command.Context, failed: Array<Constants.Permissions>) {
    const permissions: Array<string> = [];
    for (let permission of failed) {
      if (permission in PermissionsText) {
        permissions.push(`\`${PermissionsText[permission]}\``);
      } else {
        permissions.push(`\`(Unknown: ${permission})\``);
      }
    }
    const command = (context.command) ? `\`${context.command.name}\`` : 'This command';
    return context.editOrReply(`⚠ ${command} requires you to have ${permissions.join(', ')}.`);
  }

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Error');
  
    const description: Array<string> = [(error.message || error.stack) + '\n'];
    if (error.response) {
      try {
        const information = await error.response.json();
        if ('errors' in information) {
          for (let key in information.errors) {
            const value = information.errors[key];
            let message: string;
            if (typeof(value) === 'object') {
              message = JSON.stringify(value);
            } else {
              message = String(value);
            }
            description.push(`**${key}**: ${message}`);
          }
        }
      } catch(e) {
        description.push('Could not parse');
        description.push(`**Mimetype**: ${error.response.contentType}`);
      }
    }
  
    embed.setDescription(description.join('\n'));
    return context.editOrReply({embed});
  }

  onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    const embed = new Utils.Embed();
    embed.setColor(EmbedColors.ERROR);
    embed.setTitle('⚠ Command Argument Error');
  
    const store: {[key: string]: string} = {};

    const description: Array<string> = ['Invalid Arguments' + '\n'];
    for (let key in errors) {
      const message = errors[key].message;
      if (message in store) {
        description.push(`**${key}**: Same error as **${store[message]}**`);
      } else {
        description.push(`**${key}**: ${message}`);
      }
      store[message] = key;
    }
  
    embed.setDescription(description.join('\n'));
    return context.editOrReply({embed});
  }
}

export class BaseImageCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  label = 'url';
  permissionsClient = [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS];
  type = Parameters.lastImageUrl;

  onBeforeRun(context: Command.Context, args: {url?: null | string}) {
    return !!args.url;
  }

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    }
    return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
  }
}


export class BaseSearchCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  label = 'query';
  nsfw = false;
  permissionsClient = [Permissions.EMBED_LINKS];

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, options);
    if (this.metadata) {
      this.metadata.nsfw = this.nsfw;
    }
  }

  onBefore(context: Command.Context) {
    if (this.nsfw) {
      if (context.channel) {
        return context.channel.isDm || context.channel.nsfw;
      }
      return false;
    }
    return true;
  }

  onCancel(context: Command.Context) {
    return context.editOrReply('⚠ Not a NSFW channel.');
  }

  onBeforeRun(context: Command.Context, args: {query: string}) {
    return !!args.query;
  }

  onCancelRun(context: Command.Context, args: {query: string}) {
    return context.editOrReply('⚠ Provide some kind of search term.');
  }
}

/*

onBeforeRun(context: Command.Context, args: CommandArgsBefore) {

}

onCancelRun(context: Command.Context, args: CommandArgsBefore) {

}

async run(context: Command.Context, args: CommandArgs) {

}
*/
