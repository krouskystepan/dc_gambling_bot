import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../../utils/createEmbed'
import {
  COINFLIP_MAX_BET,
  COINFLIP_WIN_MULTIPLIER,
} from '../../../utils/casinoConfig'
import {
  checkChannelConfiguration,
  parseReadableStringToNumber,
  formatNumberToReadableString,
  checkUserRegistration,
} from '../../../utils/utils'

export const data: CommandData = {
  name: 'coin-flip',
  description: 'Hoď si mincí a zkus štěstí!',
  options: [
    {
      name: 'bet',
      description: 'Vlož sázku (např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'side',
      description: 'Vyber stranu mince.',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Panna (Heads)', value: 'heads' },
        { name: 'Orel (Tails)', value: 'tails' },
      ],
    },
    {
      name: 'show-balance',
      description: 'Zobrazí aktuální zůstatek (POZOR VIDÍ VŠICHNI)!',
      type: ApplicationCommandOptionType.Boolean,
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
        notAllowed: `Tento kanál není nastaven pro používání sázkových příkazů. Zkuste jeden z těchto kanálů:`,
      }
    )

    if (configReply) return

    const side = interaction.options.getString('side', true)

    const betAmount = interaction.options.getString('bet', true)
    const parsedBetAmount = parseReadableStringToNumber(betAmount)

    const showBalance = interaction.options.getBoolean('show-balance')

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

    if (parsedBetAmount > COINFLIP_MAX_BET) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatná sázka',
            'Red',
            `Maximální sázka je $${formatNumberToReadableString(
              COINFLIP_MAX_BET
            )}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (user.balance < parsedBetAmount) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Nedostatek peněz',
            'Red',
            `Nemáš dostatek peněz na sázku.\nTvůj aktuální zůstatek je **$${formatNumberToReadableString(
              user.balance
            )}**.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    const win = side === flipResult
    const color = win ? 'Green' : 'Red'
    const resultText =
      flipResult === 'heads' ? '🟡 Panna (Heads)' : '⚪ Orel (Tails)'

    let winnings = 0
    if (win) {
      winnings = parsedBetAmount * COINFLIP_WIN_MULTIPLIER
      user.balance += winnings
    } else {
      user.balance -= parsedBetAmount
    }
    await user.save()

    return interaction.reply({
      embeds: [
        createBetEmbed(
          win ? '🎉 Výhra!' : '😢 Prohra',
          color,
          `🎲 Padlo: **${resultText}**\n\n` +
            `${
              win
                ? `🎉 Vyhrál jsi **$${formatNumberToReadableString(
                    winnings
                  )}**!\n`
                : `❌ Prohrál jsi **$${betAmount}**!\n`
            }` +
            (showBalance
              ? `🏦 Aktuální zůstatek: **$${formatNumberToReadableString(
                  user.balance
                )}**`
              : '')
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
