import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js'
import User from '../../models/User'
import { parseReadableStringToNumber } from '../../utils/utils'

export const data: CommandData = {
  name: 'give-balance',
  description: 'Vytvoř embed pro givovalní peněz.',
  options: [
    {
      name: 'amount',
      description: 'Množství peněz, které chceš dát.',
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

export async function run({ interaction }: SlashCommandProps) {
  try {
    const amount = interaction.options.getString('amount', true)
    const parsedAmount = parseReadableStringToNumber(amount)

    User.findOne({ userId: interaction.user.id })

    const embed = new EmbedBuilder()
      .setTitle('Generátor peněz')
      .setColor(Colors.Yellow)
      .setDescription(
        `Klikni s přidej si **$${amount}** na svůj účet.\n` +
          'Můžeš takto zkusit **CASINO** hry.'
      )
      .setTimestamp()

    const betButtons = new ButtonBuilder()
      .setLabel(`💸 Získat peníze`)
      .setStyle(ButtonStyle.Success)
      .setCustomId(`give-money.${parsedAmount}`)

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(betButtons)

    return interaction.reply({
      embeds: [embed],
      components: [row],
    })
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
