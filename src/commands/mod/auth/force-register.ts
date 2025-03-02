import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { checkUserRegistration } from '../../../utils/utils'
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  TextChannel,
} from 'discord.js'
import User from '../../../models/User'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'force-register',
  description: 'Registruj uživatele.',
  options: [
    {
      name: 'user',
      description: 'Uživatele, kterého chceš odregistrovat.',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
}

export const options: CommandOptions = {
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

    const user = interaction.options.getUser('user', true)

    const registeredUser = await checkUserRegistration(user.id)

    if (registeredUser) {
      return interaction.editReply('Uživatel je již zaregistrován.')
    }

    const logChannel = client.channels.cache.get(
      guildConfiguration.atmChannelIds.logs
    ) as TextChannel

    logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `Manažer ${interaction.user.username} zaregistroval uživatele ${user.username}`
            )
            .setColor('Grey'),
        ],
      })
      .catch(console.error)

    const newUser = new User({
      userId: user.id,
    })

    await newUser.save()

    return interaction.editReply('Uživatel byl úspěšně zaregistrován.')
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
