import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import User from '../../models/User'
import { formatNumberToReadableString } from '../../utils/utils'
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

    const user = await User.findOne({ userId: interaction.user.id })

    if (!user) {
      await User.create({ userId: interaction.user.id })
      return interaction.editReply(`Tvůj zůstatek je $**0**.`)
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
