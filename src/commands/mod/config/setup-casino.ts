import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from 'discord.js'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'setup-casino',
  description: 'Správa sázkových kanálu.',
  options: [
    {
      name: 'add',
      description: 'Nastav kanál pro používání casino sázek.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description:
            'Kanál, který chceš nastavit pro používání casino sázek.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Odeber kanál pro používání casino sázek skrze ID.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description:
            'ID kanálu, který chceš odebrat z používání casino sázek.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
  contexts: [0],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    let guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration) {
      guildConfiguration = new GuildConfiguration({
        guildId: interaction.guildId,
      })
    }

    const options = interaction.options as CommandInteractionOptionResolver

    const subcommand = options.getSubcommand()

    if (subcommand === 'add') {
      const channel = interaction.options.getChannel('channel', true)

      guildConfiguration.casinoChannelIds.push(channel.id)

      await guildConfiguration.save()

      return interaction.reply({
        content: `Kanál ${channel} byl úspěšně nastaven pro používání casino sázkových příkazů.`,
      })
    }

    if (subcommand === 'remove') {
      const channelId = options.getString('channel-id', true)

      if (!guildConfiguration.casinoChannelIds.includes(channelId)) {
        return await interaction.reply(
          `Kanál s ID ${channelId} není nastavený pro casino sázkové příkazů.`
        )
      }

      guildConfiguration.casinoChannelIds =
        guildConfiguration.casinoChannelIds.filter((id) => id !== channelId)

      await guildConfiguration.save()

      return interaction.reply(
        `Kanál s ID ${channelId} byl úspěšně odebrán z používání casino sázkových příkazů.`
      )
    }

    return interaction.reply({
      content: 'Něco se pokazilo.',
      flags: MessageFlags.Ephemeral,
    })
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
