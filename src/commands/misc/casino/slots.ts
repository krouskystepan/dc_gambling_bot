import { CommandData, CommandOptions, SlashCommandProps } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../../utils/createEmbed'
import { spinSlot, calculateWinnings } from '../../../utils/slotsHelpers'
import {
  checkChannelConfiguration,
  parseReadableStringToNumber,
  formatNumberToReadableString,
  checkUserRegistration,
} from '../../../utils/utils'

export const data: CommandData = {
  name: 'slots',
  description: 'Zatoč si na slot machine a vyhraj!',
  options: [
    {
      name: 'bet',
      description: 'Vlož sázku (předvolenou nebo např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'spins',
      description: 'Počet spinů (výchozí: 1, max: 20).',
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
  contexts: [0],
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
    const user = await checkUserRegistration(interaction.user.id)

    if (!user) {
      return interaction.reply({
        content: 'Nemáš účet. Pro vytvoření účtu napiš `/register`.',
        flags: MessageFlags.Ephemeral,
      })
    }

    const configReply = await checkChannelConfiguration(
      interaction,
      'casinoChannelIds',
      {
        notSet:
          'Tento server nebyl ještě nastaven pro používání sázkových příkazů. Nastav ho pomocí `/setup-casino`.',
        notAllowed: `Tento kanál není nastaven pro používání sázkových příkazů. Zkus jiný.`,
      }
    )

    if (configReply) return

    const spins = interaction.options.getInteger('spins') || 1

    const betAmount = interaction.options.getString('bet', true)
    const parsedBetAmount = parseReadableStringToNumber(betAmount)

    if (isNaN(parsedBetAmount)) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatná částka',
            'Red',
            'Sázka musí být reálné číslo.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (parsedBetAmount < 1) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatná sázka',
            'Red',
            'Sázka musí být větší než 0.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (spins < 1 || spins > 20) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatný počet spinů',
            'Red',
            'Počet otoček musí být mezi 1 a 20.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (!user) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Uživatel nenalezen',
            'Red',
            'Uživatel nebyl nalezen.'
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    const totalBet = parsedBetAmount * spins
    if (user.balance < totalBet) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Nedostatek peněz',
            'Red',
            `Nemáš dostatek peněz na ${spins} spinů (potřebuješ **$${formatNumberToReadableString(
              totalBet
            )}**).`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    let totalWinnings = 0
    let results: string[] = []

    for (let i = 0; i < spins; i++) {
      const resultString = spinSlot()
      const winnings = calculateWinnings(resultString, parsedBetAmount)
      const isWin = winnings > 0

      results.push(
        `**${resultString}** | ${isWin ? '🎉' : '❌'} | ${
          isWin
            ? `**+$${formatNumberToReadableString(winnings)}**`
            : `**-$${betAmount}**`
        }`
      )

      totalWinnings += winnings - parsedBetAmount
    }

    user.balance += totalWinnings
    await user.save()

    const isWin = totalWinnings > 0
    const isLoss = totalWinnings < 0

    return interaction.reply({
      embeds: [
        createBetEmbed(
          isWin
            ? '🎰 **Výhra!** 🎉'
            : isLoss
            ? '🎰 **Smůla...** ❌'
            : '🎰 **Nic moc...** 👀',
          isWin ? 'Green' : isLoss ? 'Red' : 'Yellow',

          `**💵 Celková vsazená částka: $${formatNumberToReadableString(
            totalBet
          )}**\n\n` +
            `🕹 **Výsledky spinů:**\n${results.join('\n')}\n\n` +
            `💰 **Celkový výsledek:** ${
              isWin ? '🟢' : isLoss ? '🔴' : '🟡'
            } **$${formatNumberToReadableString(totalWinnings)}**\n`
        ),
      ],
    })
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      embeds: [
        createBetEmbed(
          '❌ Chyba',
          'Red',
          'Při zpracování příkazu došlo k chybě.'
        ),
      ],
      flags: MessageFlags.Ephemeral,
    })
  }
}
