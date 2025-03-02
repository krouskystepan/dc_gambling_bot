import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { SLOT_MULTIPLIERS, SYMBOL_WEIGHTS } from '../../utils/casinoConfig'
import { createBetEmbed } from '../../utils/createEmbed'
import { spinSlot, calculateRTP } from '../../utils/slotsHelpers'
import {
  parseReadableStringToNumber,
  formatNumberToReadableString,
  formatNumberWithSpaces,
} from '../../utils/utils'

export const data: CommandData = {
  name: 'simulate-slots',
  description: 'Simulace X spinů na slot machine. !POZOR: Může trvat dlouho!',
  options: [
    {
      name: 'spins',
      description: 'Počet spinů, které chceš simulovat.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'bet',
      description: 'Vlož sázku (např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'details',
      description: 'Zobrazí detaily výher.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: 'wins-losses-count',
      description: 'Zobrazí počet výher a proher.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: 'win-losses-series',
      description: 'Zobrazí nejdelší výherní a proherní sérii.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: 'multipliers',
      description: 'Zobrazí multiplikátory.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: 'weights',
      description: 'Zobrazí váhy symbolů.',
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],
  contexts: [0],
}

export const options: CommandOptions = {
  userPermissions: ['Administrator'],
  botPermissions: ['Administrator'],
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    await interaction.deferReply()

    let totalBet = 0
    let totalWinnings = 0
    let wins = 0
    let losses = 0
    let winCounts: Record<string, number> = {}

    let currentWinningStreak = 0
    let biggestWinningStreak = 0
    let currentLosingStreak = 0
    let biggestLosingStreak = 0

    const spins = parseReadableStringToNumber(
      interaction.options.getString('spins', true)
    )

    const MAX_SPINS = 50_000_000

    if (spins > MAX_SPINS) {
      return interaction.editReply({
        content: `Maximální počet spinů je ${formatNumberToReadableString(
          MAX_SPINS
        )}.`,
      })
    }

    const bet = parseReadableStringToNumber(
      interaction.options.getString('bet', true)
    )

    const details = interaction.options.getBoolean('details')
    const winsLosses = interaction.options.getBoolean('wins-losses-count')
    const winLossesSeries = interaction.options.getBoolean('win-losses-series')
    const multipliers = interaction.options.getBoolean('multipliers')
    const weights = interaction.options.getBoolean('weights')

    await interaction.editReply(
      `Simuluji **${formatNumberToReadableString(
        spins
      )}** spinů se sázkou **$${formatNumberToReadableString(
        bet
      )}**. Čekej prosím...`
    )

    const startTime = performance.now()

    for (let i = 1; i <= spins; i++) {
      totalBet += bet
      const resultString = spinSlot()
      let winnings = 0

      if (SLOT_MULTIPLIERS[resultString]) {
        winnings = bet * SLOT_MULTIPLIERS[resultString]
        wins++
        winCounts[resultString] = (winCounts[resultString] || 0) + 1

        currentLosingStreak = 0
        currentWinningStreak++
        if (currentWinningStreak > biggestWinningStreak) {
          biggestWinningStreak = currentWinningStreak
        }
      } else {
        losses++

        currentWinningStreak = 0
        currentLosingStreak++
        if (currentLosingStreak > biggestLosingStreak) {
          biggestLosingStreak = currentLosingStreak
        }
      }

      totalWinnings += winnings
    }
    const endTime = performance.now()

    await interaction.editReply(`Simulace dokončena. Generuji výsledky...`)

    const profitOrLoss = totalWinnings - totalBet
    const profitOrLossPercentage = (profitOrLoss / totalBet) * 100
    const rtp = calculateRTP(spins)

    const winLossesDetails =
      `🎉 Výhry: **${formatNumberWithSpaces(wins)}**\n` +
      `❌ Prohry: **${formatNumberWithSpaces(losses)}**`

    const winLossesSeriesDetails =
      `🔥 Nejdelší výherní série: **${biggestWinningStreak}**\n` +
      `💀 Nejdelší proherní série: **${biggestLosingStreak}**`

    const winDetails = Object.entries(winCounts)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([symbol, count]) => `${symbol}: **${formatNumberWithSpaces(count)}**x`
      )
      .join('\n')

    const multipliersDetails = Object.entries(SLOT_MULTIPLIERS)
      .map(([symbol, multiplier]) => `${symbol}: **${multiplier}**x`)
      .join('\n')

    const symbolWeightsDetails = Object.entries(SYMBOL_WEIGHTS)
      .map(([symbol, weight]) => `${symbol}: **${weight}**`)
      .join('\n')

    const totalTime = ((endTime - startTime) / 1000).toFixed(2)

    const embed = createBetEmbed(
      `🎰 Simulace Slotů - ${formatNumberToReadableString(spins)} spinů`,
      profitOrLoss >= 0 ? 'Green' : 'Red',
      `Celková sázka: **$${formatNumberToReadableString(totalBet)}**\n` +
        `Celkové výhry: **$${formatNumberToReadableString(totalWinnings)}**\n` +
        `Profit/Ztráta: **$${formatNumberToReadableString(profitOrLoss)}**\n` +
        `Procento profit/ztráta: **${profitOrLossPercentage.toFixed(2)}%**\n` +
        `📊 RTP: **${rtp.toFixed(2)}%**\n\n` +
        (winsLosses ? `${winLossesDetails}\n\n` : '') +
        (winLossesSeries ? `${winLossesSeriesDetails}\n\n` : '') +
        (details ? `Detail výher:\n${winDetails || 'Žádné výhry'}\n\n` : '') +
        (multipliers ? `Multiplikátory:\n${multipliersDetails}\n\n` : '') +
        (weights ? `Váhy symbolů:\n${symbolWeightsDetails}\n\n` : '') +
        `Všechny spiny trvaly: **${totalTime}s**`
    )

    await interaction.editReply({
      content: `Simulace dokončena.`,
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
