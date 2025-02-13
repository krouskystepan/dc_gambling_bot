import {
  ActionRowBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  MessageFlags,
} from 'discord.js'
import Prediction from '../../../models/Prediction'
import { parseReadableStringToNumber } from '../../../utils/utils'
import User from '../../../models/User'

export default async (interaction: Interaction) => {
  if (!interaction.isButton() || !interaction.customId) return

  try {
    const [type, predictionId, choiceName, odds] =
      interaction.customId.split('.')

    if (!type || !predictionId || !choiceName || !odds) return
    if (type !== 'prediction') return

    const targetPrediction = await Prediction.findOne({ predictionId })
    if (!targetPrediction || !interaction.channel) return

    if (targetPrediction.status === 'ended') {
      return await interaction.reply({
        content: `❌ Tato příležitost už není aktivní.`,
        flags: MessageFlags.Ephemeral,
      })
    }

    const modal = new ModalBuilder()
      .setTitle(`Vsaď si částku na příležitost ${choiceName}.`)
      .setCustomId(`prediction-${predictionId}-${choiceName}`)

    const textInput = new TextInputBuilder()
      .setCustomId(`bet-${predictionId}-input`)
      .setLabel('Kolik by jsi chtěl vsadit?')
      .setPlaceholder('např. 1000, 4k, 10.5k')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      textInput
    )

    modal.addComponents(actionRow)

    await interaction.showModal(modal)

    const filter = (i: ModalSubmitInteraction) =>
      i.customId === `prediction-${predictionId}-${choiceName}`

    interaction.client.once('interactionCreate', async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return
      if (!filter(modalInteraction)) return

      const betAmount = modalInteraction.fields
        .getTextInputValue(`bet-${predictionId}-input`)
        .toUpperCase()

      const user = await User.findOne({ userId: modalInteraction.user.id })

      if (!user) return

      const parsedBetAmount = parseReadableStringToNumber(betAmount)

      if (isNaN(parsedBetAmount)) {
        return await modalInteraction.reply({
          content: `❌ Neplatná částka.`,
          flags: MessageFlags.Ephemeral,
        })
      }

      if (user.balance < parseReadableStringToNumber(betAmount)) {
        return await modalInteraction.reply({
          content: `❌ Nemáš dostatek peněz na vsazení $**${betAmount}**`,
          flags: MessageFlags.Ephemeral,
        })
      }

      user.balance -= parseReadableStringToNumber(betAmount)
      await user.save()

      targetPrediction.choices
        .filter((choice) => choice.choiceName === choiceName)[0]
        .bets.push({
          userId: user.userId,
          amount: parseReadableStringToNumber(betAmount),
        })

      await targetPrediction.save()

      await modalInteraction.reply({
        content: `✅ Vsadil jsi $**${betAmount}** na **${choiceName}**`,
        flags: MessageFlags.Ephemeral,
      })
    })
  } catch (error) {
    console.error('Error in handlePrediction.ts', error)
  }
}
