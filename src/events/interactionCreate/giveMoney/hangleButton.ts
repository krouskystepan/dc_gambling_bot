import {
  Client,
  EmbedBuilder,
  GuildMember,
  Interaction,
  TextChannel,
} from 'discord.js'
import User from '../../../models/User'
import { formatNumberToReadableString } from '../../../utils/utils'
import GuildConfiguration from '../../../models/GuildConfiguration'

export default async (interaction: Interaction, client: Client) => {
  if (!interaction.isButton() || !interaction.customId) return

  try {
    const [type, amount] = interaction.customId.split('.')

    if (!type || !amount) return
    if (type !== 'give-money') return

    const guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration?.atmChannelIds.logs) {
      return await interaction.reply({
        content: 'Není nastavený logovací kanál pro ATM.',
        ephemeral: true,
      })
    }

    const parsedAmount = parseInt(amount)

    const user = await User.findOne({ userId: interaction.user.id })

    if (!user) return

    user.balance += parsedAmount
    user.save()

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
              `Uživatel ${displayName} (${interaction.user.username}) si přidal peníze na účet.`
            )
            .setDescription(
              `Bylo mu přidáno **$${formatNumberToReadableString(
                parsedAmount
              )}** na účet.`
            )
            .setColor('Gold'),
        ],
      })
      .catch(console.error)

    await interaction.reply({
      content: `Přidal jsem ti ${formatNumberToReadableString(
        parsedAmount
      )} na účet.\nTvůj nový zůstatek je **$${formatNumberToReadableString(
        user.balance
      )}**.`,
      ephemeral: true,
    })
  } catch (error) {
    console.error('Error in handlePrediction.ts', error)
  }
}
