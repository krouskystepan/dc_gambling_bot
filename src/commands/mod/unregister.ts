import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { checkChannelConfiguration } from '../../utils/utils'
import User from '../../models/User'

export const data: CommandData = {
  name: 'unregister',
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
    const configReply = await checkChannelConfiguration(
      interaction,
      'adminChannelIds',
      {
        notSet:
          'Tento server nebyl ještě nastaven pro používání unregister. Nastav ho pomocí `/setup-manage`.',
        notAllowed: `Tento kanál není nastaven pro používání unregister. Zkuste jeden z těchto kanálů:`,
      }
    )

    if (configReply) return

    const user = interaction.options.getString('user-id', true)

    User.findOneAndDelete({ userId: user }).exec()

    return interaction.reply({
      content: `Uživatel s ID ${user} byl úspěšně odregistrován (odstraněn z DB).`,
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
