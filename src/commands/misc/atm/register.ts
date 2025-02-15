import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { checkUserRegistration } from '../../../utils/utils'
import {
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  TextChannel,
} from 'discord.js'
import User from '../../../models/User'
import GuildConfiguration from '../../../models/GuildConfiguration'

export const data: CommandData = {
  name: 'register',
  description: 'Zaregistruj se do systému.',
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction, client }: SlashCommandProps) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const user = await checkUserRegistration(interaction.user.id)

    if (user) {
      return interaction.editReply('Už jsi zaregistrován.')
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
            .setTitle(
              `Registrace uživatele ${displayName} (${interaction.user.username})`
            )
            .setColor('Purple')
            .setDescription(`Uživatel se úspěšně zaregistroval.`),
        ],
      })
      .catch(console.error)

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
