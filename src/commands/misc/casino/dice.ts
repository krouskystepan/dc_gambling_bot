import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import User from '../../../models/User'
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js'
import { createBetEmbed } from '../../../utils/createEmbed'
import { DICE_WIN_MULTIPLIER } from '../../../utils/multiplayers'
import {
  checkChannelConfiguration,
  parseReadableStringToNumber,
  formatNumberToReadableString,
} from '../../../utils/utils'

export const data: CommandData = {
  name: 'dice',
  description: 'Zahraj si kostku se 6 stranami.',
  options: [
    {
      name: 'bet',
      description: 'Vlož sázku (Můžeš psát i 2k, 4.5k).',
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
  ],
  contexts: [0],
}

export const options: CommandOptions = {
  deleted: false,
}

export async function run({ interaction }: SlashCommandProps) {
  try {
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
    const side = interaction.options.getInteger('side', true)

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

    const user = await User.findOne({ userId: interaction.user.id })

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

    const dice = Math.floor(Math.random() * 6) + 1

    if (dice === side) {
      const winnings = Math.floor(bet * DICE_WIN_MULTIPLIER)
      user.balance += winnings
      await user.save()

      return interaction.reply({
        embeds: [
          createBetEmbed(
            '🎉 Výhra!',
            'Green',
            `🎲 Padlo **${dice}**!\nVyhrál jsi **$${formatNumberToReadableString(
              winnings
            )}**! 💰`
          ),
        ],
      })
    } else {
      user.balance -= bet
      await user.save()

      return interaction.reply({
        embeds: [
          createBetEmbed(
            '😢 Prohra',
            'Red',
            `🎲 Padlo **${dice}**.\nZtratil jsi **$${formatNumberToReadableString(
              bet
            )}**. Zkus to znovu!`
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
