import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  checkUserRegistration,
  formatNumberToReadableString,
} from '../../../utils/utils'
import { MessageFlags } from 'discord.js'
import User from '../../../models/User'

export const data: CommandData = {
  name: 'register',
  description: 'Zaregistruj se do systému.',
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const user = await checkUserRegistration(interaction.user.id)

    if (user) {
      return interaction.editReply('Už jsi zaregistrován.')
    }

    const newUser = new User({
      userId: interaction.user.id,
    })

    await newUser.save()

    return interaction.editReply('Byl jsi úspěšně zaregistrován.')
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
