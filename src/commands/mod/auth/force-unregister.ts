import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
} from 'discord.js'
import {
  checkChannelConfiguration,
  checkUserRegistration,
} from '../../../utils/utils'
import User from '../../../models/User'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'force-unregister',
  description: 'Odregistruj uživatele (smaž z DB).',
  options: [
    {
      name: 'user-id',
      description: 'ID uživatele, kterého chceš odregistrovat.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction, client }: SlashCommandProps) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration?.atmChannelIds.logs) {
      return interaction.editReply(
        'Není nastaven logovací kanál pro ATM. Nastav ho pomocí `/setup-atm`.'
      )
    }

    const userId = interaction.options.getString('user-id', true)

    const registeredUser = await checkUserRegistration(userId)

    if (!registeredUser) {
      return interaction.editReply('Uživatel ještě není registrován.')
    }

    const logChannel = client.channels.cache.get(
      guildConfiguration.atmChannelIds.logs
    ) as TextChannel

    logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `Manažer ${interaction.user.username} odregistroval uživatele s ID ${userId}`
            )
            .setColor('NotQuiteBlack'),
        ],
      })
      .catch(console.error)

    User.findOneAndDelete({ userId }).exec()

    return interaction.editReply({
      content: `Uživatel s ID ${userId} byl úspěšně odregistrován.`,
    })
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
