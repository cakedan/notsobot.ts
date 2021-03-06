import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { DefaultParameters, Parameters, createUserEmbed, editOrReply, languageCodeToText } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  noembed: boolean,
  upload: boolean,
  url?: null | string,
}

export interface CommandArgs {
  noembed: boolean,
  upload: boolean,
  url: string,
}

export const COMMAND_NAME = 'ocr';

export default class OCRCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'noembed', default: DefaultParameters.noEmbed, type: () => true},
        {name: 'files.gg', label: 'upload', type: Boolean},
      ],
      metadata: {
        description: 'Read text inside of an image (Optical Character Recognition)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
        ],
        type: CommandTypes.TOOLS,
        usage: '?<emoji,user:id|mention|name,url> (-noembed) (-files.gg)',
      },
      type: Parameters.lastImageUrl,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { annotation } = await googleContentVisionOCR(context, {url: args.url});

    let description: string = '';
    if (annotation) {
      if (2000 < annotation.description.length && args.upload) {
        try {
          const upload = await context.rest.request({
            files: [{filename: 'ocr.txt', key: 'file', value: annotation.description}],
            method: 'post',
            url: 'https://api.files.gg/files',
          });
          description = upload.urls.main;
        } catch(error) {
          description = Markup.codeblock(annotation.description);
        }
      } else {
        description = Markup.codeblock(annotation.description);
      }
    }

    if (args.noembed) {
      if (!annotation) {
        return editOrReply(context, {content: '⚠ No text detected'});
      }

      const title = languageCodeToText(annotation.locale);
      return editOrReply(context, [title, description].join('\n'));
    } else {
      const embed = createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setFooter('Optical Character Recognition', EmbedBrands.GOOGLE_GO);
      embed.setThumbnail(args.url);

      if (annotation) {
        const language = languageCodeToText(annotation.locale);
        embed.setTitle(language);
        embed.setDescription(description);
      } else {
        embed.setColor(EmbedColors.ERROR);
        embed.setDescription('No text detected');
      }

      return editOrReply(context, {embed});
    }
  }
}
