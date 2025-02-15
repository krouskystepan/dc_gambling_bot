import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  checkUserRegistration,
  formatNumberToReadableString,
  parseReadableStringToNumber,
} from '../../../utils/utils'
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  TextChannel,
} from 'discord.js'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'withdraw',
  description:
    'Vyber peníze z herního účtu (ostatním uživatelům se nezobrazuje).',
  options: [
    {
      name: 'amount',
      description: 'Částka, kterou chceš vybrat (např 1000, 2k, 10.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'account',
      description: 'Účet na který chceš poslat peníze.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client }: SlashCommandProps) {
  try {
    const user = await checkUserRegistration(interaction.user.id)

    if (!user) {
      return interaction.reply({
        content: 'Nemáš účet. Pro vytvoření účtu napiš `/register`.',
        flags: MessageFlags.Ephemeral,
      })
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const account = interaction.options.getString('account', true)

    const amount = interaction.options.getString('amount', true)
    const parsedAmout = parseReadableStringToNumber(amount)
    const readableAmount = formatNumberToReadableString(parsedAmout)

    if (isNaN(parsedAmout)) {
      return interaction.editReply('Částka musí být reálné číslo.')
    }

    if (parsedAmout <= 0) {
      return interaction.editReply('Částka musí být kladné číslo.')
    }

    const guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration?.atmChannelIds.logs) {
      return interaction.editReply('ATM ještě není nastaven. Počkejte prosím.')
    }

    if (!guildConfiguration?.atmChannelIds.actions) {
      return interaction.editReply(`Tento příkaz zatím není nastaven.`)
    }

    if (guildConfiguration?.atmChannelIds.actions !== interaction.channelId) {
      return interaction.editReply(
        `Tento příkaz můžeš použít pouze v kanálu <#${guildConfiguration.atmChannelIds.actions}>`
      )
    }

    if (user.balance < parsedAmout) {
      return interaction.editReply(
        `Nemáš dostatek peněz na účtu k vybrání.\nTvůj aktuální zůstatek je **$${formatNumberToReadableString(
          user.balance
        )}**.`
      )
    }

    user.balance -= parsedAmout

    await user.save()

    const logChannel = client.channels.cache.get(
      guildConfiguration.atmChannelIds.logs
    ) as TextChannel

    const member = interaction.member as GuildMember | null
    const displayName =
      member?.displayName ||
      interaction.user.globalName ||
      interaction.user.username

    logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Výběr od ${displayName} (${interaction.user.username})`)
            .setColor('Red')
            .setDescription(
              `Uživatel vybral **$${readableAmount}** na účet **${account}**.`
            ),
        ],
      })
      .then((message) => {
        message.react('✅')
      })
      .catch(console.error)

    return interaction.editReply(
      `Vybral jsi **$${readableAmount}**. Počkej na zpracování.`
    )
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
