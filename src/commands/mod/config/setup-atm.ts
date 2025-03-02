import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from 'discord.js'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'setup-atm',
  description: 'Správa kanálů pro ATM a logy.',
  options: [
    {
      name: 'add-actions',
      description: 'Nastav kanál pro ATM. (výběry a vklady)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál, který chceš nastavit.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove-actions',
      description: 'Odeber kanál pro ATM skrze ID. (výběry a vklady)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description: 'ID kanálu, který chceš odebrat.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'add-logs',
      description: 'Nastav kanál pro logy. (logy o transakcích)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel',
          description: 'Kanál, který chceš nastavit.',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      name: 'remove-logs',
      description: 'Odeber kanál pro logy skrze ID. (logy o transakcích)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'channel-id',
          description: 'ID kanálu, který chceš odebrat.',
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

    if (subcommand === 'add-actions') {
      const channel = interaction.options.getChannel('channel', true)

      guildConfiguration.atmChannelIds.actions = channel.id

      await guildConfiguration.save()

      return interaction.reply({
        content: `Kanál ${channel} byl úspěšně nastaven pro ATM.`,
      })
    }

    if (subcommand === 'remove-actions') {
      const channelId = options.getString('channel-id', true)

      if (guildConfiguration.atmChannelIds.actions !== channelId) {
        return await interaction.reply(
          `Kanál s ID ${channelId} není nastavený pro ATM.`
        )
      }

      guildConfiguration.atmChannelIds.actions = ''

      await guildConfiguration.save()

      return interaction.reply(
        `Kanál s ID ${channelId} byl úspěšně odebrán z používání ATM.`
      )
    }

    if (subcommand === 'add-logs') {
      const channel = interaction.options.getChannel('channel', true)

      guildConfiguration.atmChannelIds.logs = channel.id

      await guildConfiguration.save()

      return interaction.reply({
        content: `Kanál ${channel} byl úspěšně nastaven pro logy z ATM.`,
      })
    }

    if (subcommand === 'remove-logs') {
      const channelId = options.getString('channel-id', true)

      if (guildConfiguration.atmChannelIds.logs !== channelId) {
        return await interaction.reply(
          `Kanál s ID ${channelId} není nastavený pro logy z ATM.`
        )
      }

      guildConfiguration.atmChannelIds.logs = ''

      await guildConfiguration.save()

      return interaction.reply(
        `Kanál s ID ${channelId} byl úspěšně odebrán z logů z ATM.`
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
