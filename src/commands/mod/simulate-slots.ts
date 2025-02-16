import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../utils/createEmbed'
import {
  formatNumberToReadableString,
  parseReadableStringToNumber,
} from '../../utils/utils'
import { SLOT_MULTIPLIERS, SYMBOL_WEIGHTS } from '../../utils/multipliers'
import { calculateRTP, spinSlot } from '../../utils/slotsHelpers'

export const data: CommandData = {
  name: 'simulate-slots',
  description: 'Simulace X spinů na slot machine. !POZOR: Může trvat dlouho!',
  options: [
    {
      name: 'spins',
      description: 'Počet spinů, které chceš simulovat (max. 10k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'bet',
      description: 'Vlož sázku (např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  contexts: [0],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
  devOnly: true,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    await interaction.deferReply()

    let totalBet = 0
    let totalWinnings = 0

    const spins = parseReadableStringToNumber(
      interaction.options.getString('spins', true)
    )

    if (spins > 1_000_000) {
      return await interaction.editReply({
        content: 'Maximální počet spinů je 1 000 000.',
      })
    }

    const bet = parseReadableStringToNumber(
      interaction.options.getString('bet', true)
    )

    const startTime = performance.now()
    for (let i = 0; i < spins; i++) {
      totalBet += bet
      const resultString = spinSlot()
      let winnings = 0

      if (SLOT_MULTIPLIERS[resultString]) {
        winnings = bet * SLOT_MULTIPLIERS[resultString]
        console.log(i, '🎉 ', resultString, SLOT_MULTIPLIERS[resultString])
      } else {
        console.log(i, '❌', resultString, 0)
      }

      totalWinnings += winnings
    }
    const endTime = performance.now()

    const profitOrLoss = totalWinnings - totalBet
    const profitOrLossPercentage = (profitOrLoss / totalBet) * 100
    const rtp = calculateRTP(spins)

    const embed = createBetEmbed(
      `🎰 Simulace Slotů - ${formatNumberToReadableString(spins)} spinů`,
      profitOrLoss >= 0 ? 'Green' : 'Red',
      `Celková sázka: **$${formatNumberToReadableString(totalBet)}**\n` +
        `Celkové výhry: **$${formatNumberToReadableString(totalWinnings)}**\n` +
        `Profit/Ztráta: **$${formatNumberToReadableString(profitOrLoss)}**\n` +
        `Procento profit/ztráta: **${profitOrLossPercentage.toFixed(2)}%**\n` +
        `📊 RTP: **${rtp.toFixed(2)}%**\n\n` +
        `Váha symbolů a násobiče symbolů:\n` +
        Object.entries(SYMBOL_WEIGHTS)
          .map(([symbol, weight]) => {
            const multiplier =
              SLOT_MULTIPLIERS[`${symbol}${symbol}${symbol}`] || 'N/A'
            return `${symbol}: Váha = ${weight}, Násobič = ${multiplier}x`
          })
          .join('\n') +
        '\n\n' +
        `Všechny spiny trvaly: **${((endTime - startTime) / 1000).toFixed(
          2
        )}s**`
    )

    await interaction.editReply({
      embeds: [embed],
    })
  } catch (error) {
    console.error('Error running the command:', error)
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: 'Při zpracování příkazu došlo k chybě.',
      })
    } else {
      await interaction.reply({
        content: 'Při zpracování příkazu došlo k chybě.',
        flags: MessageFlags.Ephemeral,
      })
    }
  }
}
