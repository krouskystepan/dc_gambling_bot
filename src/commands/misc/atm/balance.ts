import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  checkUserRegistration,
  formatNumberToReadableString,
} from '../../../utils/utils'
import { MessageFlags } from 'discord.js'

export const data: CommandData = {
  name: 'balance',
  description: 'Zjisti tvůj zůstatek (ostatním uživatelům se nezobrazuje).',
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const user = await checkUserRegistration(interaction.user.id)

    if (!user) {
      return interaction.reply({
        content: 'Nemáš účet. Pro vytvoření účtu napiš `/register`.',
        flags: MessageFlags.Ephemeral,
      })
    }

    return interaction.editReply(
      `Tvůj zůstatek je $**${formatNumberToReadableString(user.balance)}**.`
    )
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
