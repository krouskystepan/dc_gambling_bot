import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../../utils/createEmbed'
import { COINFLIP_WIN_MULTIPLIER } from '../../../utils/multiplayers'
import {
  checkChannelConfiguration,
  parseReadableStringToNumber,
  formatNumberToReadableString,
  checkUserRegistration,
} from '../../../utils/utils'
import { BET_CHOICES } from '../../../utils/slotsHelpers'

export const data: CommandData = {
  name: 'coin-flip',
  description: 'Hoď si mincí a zkus štěstí!',
  options: [
    {
      name: 'bet',
      description: 'Vlož sázku (předvolenou nebo např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: BET_CHOICES.map((choice) => ({
        name: choice.label,
        value: choice.value.toString(),
      })),
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
      return interaction.editReply(
        'Nemáš účet. Pro vytvoření účtu napiš `/register`.'
      )
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

    const bet = parseReadableStringToNumber(
      interaction.options.getString('bet', true)
    )
    const side = interaction.options.getString('side', true)

    if (bet < 1) {
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

    if (user.balance < bet) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Nedostatek peněz',
            'Red',
            'Nemáš dostatek peněz na sázku.'
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
      winnings = bet * COINFLIP_WIN_MULTIPLIER
      user.balance += winnings
    } else {
      user.balance -= bet
    }
    await user.save()

    return interaction.reply({
      embeds: [
        createBetEmbed(
          win ? '🎉 Výhra!' : '😢 Prohra',
          color,
          `🎲 Padlo: **${resultText}**\n\n${win ? '🎉 Výhra!' : '😔 Prohra.'} ${
            win
              ? `Získal jsi **$${formatNumberToReadableString(winnings)}**!`
              : `Ztratil jsi **$${formatNumberToReadableString(bet)}**.`
          }`
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
