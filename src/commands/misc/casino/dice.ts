import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../../utils/createEmbed'
import { DICE_MAX_BET, DICE_WIN_MULTIPLIER } from '../../../utils/casinoConfig'
import {
  checkChannelConfiguration,
  parseReadableStringToNumber,
  formatNumberToReadableString,
  checkUserRegistration,
} from '../../../utils/utils'

export const data: CommandData = {
  name: 'dice',
  description: 'Zahraj si kostku!',
  options: [
    {
      name: 'bet',
      description: 'Vlož sázku (např. 2k, 4.5k).',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'side',
      description: 'Zvol stranu kostky (1–6).',
      type: ApplicationCommandOptionType.Integer,
      required: true,
      choices: Array.from({ length: 6 }, (_, i) => ({
        name: (i + 1).toString(),
        value: i + 1,
      })),
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

    const side = interaction.options.getInteger('side', true)

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

    if (parsedBetAmount > DICE_MAX_BET) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatná sázka',
            'Red',
            `Maximální sázka je $${formatNumberToReadableString(DICE_MAX_BET)}.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (side < 1 || side > 6) {
      return interaction.reply({
        embeds: [
          createBetEmbed(
            '❌ Neplatná strana',
            'Red',
            'Strana kostky musí být mezi 1 a 6.'
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

    const dice = Math.floor(Math.random() * 6) + 1

    if (dice === side) {
      const winnings = Math.floor(parsedBetAmount * DICE_WIN_MULTIPLIER)
      user.balance += winnings
      await user.save()

      return interaction.reply({
        embeds: [
          createBetEmbed(
            '🎉 Výhra!',
            'Green',
            `🎲 Padlo **${dice}**!\n` +
              `💰 Vyhrál jsi **$${formatNumberToReadableString(
                winnings
              )}**!\n` +
              (showBalance
                ? `🏦 Zůstatek: **$${formatNumberToReadableString(
                    user.balance
                  )}**`
                : '')
          ),
        ],
      })
    } else {
      user.balance -= parsedBetAmount
      await user.save()

      return interaction.reply({
        embeds: [
          createBetEmbed(
            '😢 Prohra',
            'Red',
            `🎲 Padlo **${dice}**!\n` +
              `❌ Prohrál jsi **$${betAmount}**. Zkus to znovu!\n` +
              (showBalance
                ? `🏦 Aktuální zůstatek: **$${formatNumberToReadableString(
                    user.balance
                  )}**`
                : '')
          ),
        ],
      })
    }
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
