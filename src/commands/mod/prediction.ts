import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import {
  ApplicationCommandOptionType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  TextChannel,
  EmbedBuilder,
  Message,
} from 'discord.js'
import Prediction from '../../models/Prediction'
import { createBetEmbed } from '../../utils/createEmbed'
import User from '../../models/User'
import {
  checkChannelConfiguration,
  formatNumberToReadableString,
} from '../../utils/utils'

export const data: CommandData = {
  name: 'prediction',
  description: 'Vytvoř novou predikci pro sázení.',
  options: [
    {
      name: 'create',
      description: 'Vytvoř novou predikci.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'title',
          description: 'Název predikce.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'choice1',
          description: 'První možnost sázení.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'odds1',
          description: 'Kurz pro první možnost.',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'choice2',
          description: 'Druhá možnost sázení.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'odds2',
          description: 'Kurz pro druhou možnost.',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'choice3',
          description: 'Třetí možnost sázení (volitelné).',
          type: ApplicationCommandOptionType.String,
          required: false,
        },
        {
          name: 'odds3',
          description: 'Kurz pro třetí možnost (volitelné).',
          type: ApplicationCommandOptionType.Number,
          required: false,
        },
      ],
    },
    {
      name: 'end',
      description: 'Ukonči aktivní predikci.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'prediction',
          description: 'Predikce, kterou chceš ukončit.',
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: 'payout',
      description: 'Vyplati sázky na predikci.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'prediction',
          description: 'Predikce, kterou chceš vyplatit.',
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
        {
          name: 'pick-winner',
          description: 'Vítězná možnost.',
          type: ApplicationCommandOptionType.String,
          required: true,
          autocomplete: true,
        },
      ],
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
    const configReply = await checkChannelConfiguration(
      interaction,
      'predictionChannelIds',
      {
        notSet:
          'Tento server nebyl ještě nastaven pro používání sázkových příkazů. Nastav ho pomocí `/setup-prediction`.',
        notAllowed: `Tento kanál není nastaven pro používání sázkových příkazů. Zkuste jeden z těchto kanálů:`,
      }
    )

    if (configReply) return

    const options = interaction.options as CommandInteractionOptionResolver

    const subcommand = options.getSubcommand()

    if (subcommand === 'create') {
      const title = interaction.options.getString('title', true)

      const choice1 = interaction.options.getString('choice1', true)
      const odds1 = interaction.options.getNumber('odds1', true)

      const choice2 = interaction.options.getString('choice2', true)
      const odds2 = interaction.options.getNumber('odds2', true)

      const choice3 = interaction.options.getString('choice3') || null
      const odds3 = interaction.options.getNumber('odds3') || null

      if (choice1 === choice2 || choice1 === choice3 || choice2 === choice3) {
        return interaction.reply({
          content: 'Možnosti sázek se nesmí opakovat.',
          flags: MessageFlags.Ephemeral,
        })
      }

      const choices = [
        { choiceName: choice1, odds: odds1, bets: [] },
        { choiceName: choice2, odds: odds2, bets: [] },
      ]

      if (choice3 && odds3) {
        choices.push({ choiceName: choice3, odds: odds3, bets: [] })
      }

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
      })

      let predictionMessage: Message<true>

      try {
        predictionMessage = await (interaction.channel as TextChannel).send(
          'Vytvaření návrhu, prosím čekejte...'
        )
      } catch (error) {
        return await interaction.editReply('Návrh se nepodařilo vytvořit.')
      }

      const newPrediction = await Prediction.create({
        title,
        predictionId: predictionMessage.id,
        channelId: interaction.channelId,
        creatorId: interaction.user.id,
        choices,
      })

      const betButtons = choices.map((choice) => {
        return new ButtonBuilder()
          .setLabel(`💵 Vsadit na ${choice.choiceName} 💵`)
          .setStyle(ButtonStyle.Success)
          .setCustomId(
            `prediction.${newPrediction.predictionId}.${choice.choiceName}.${choice.odds}`
          )
      })

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        betButtons
      )

      predictionMessage.edit({
        content: '',
        embeds: [
          createBetEmbed(
            '📢 Nová predikce! 🔵',
            'Blue',
            `**${title}**
        
        📌 **${choice1}** - Kurz: ${odds1}
        📌 **${choice2}** - Kurz: ${odds2}
        ${choice3 ? `📌 **${choice3}** - Kurz: ${odds3}` : ''}
        `
          ),
        ],
        components: [row],
      })

      return interaction.editReply('Nová predikce byla vytvořena.')
    }

    if (subcommand === 'end') {
      const predictionId = options.getString('prediction', true)

      const targetPrediction = await Prediction.findOne({
        predictionId,
      })

      if (!targetPrediction) {
        return interaction.reply('Predikce nebyla nalezena.')
      }

      if (targetPrediction.status === 'ended') {
        return interaction.reply('Tato predikce již byla ukončena.')
      }

      await Prediction.findOneAndUpdate({ predictionId }, { status: 'ended' })

      const messageId = targetPrediction.predictionId
      const channel = (await interaction.guild?.channels.fetch(
        targetPrediction.channelId
      )) as TextChannel
      if (!channel || !messageId) {
        return interaction.reply('Chyba při získávání kanálu nebo zprávy.')
      }

      try {
        const message = await channel.messages.fetch(messageId)
        const embed = message.embeds[0]

        if (embed) {
          const updatedEmbed = new EmbedBuilder(embed.data)
            .setTitle(`Predikce byla ukončena a čeká se na vyplacení! 🟡`)
            .setColor('Yellow')

          await message.edit({ embeds: [updatedEmbed], components: [] })
        }
      } catch (error) {
        console.error('Chyba při aktualizaci zprávy:', error)
        return interaction.reply('Došlo k chybě při aktualizaci embed zprávy.')
      }

      return interaction.reply({
        content: 'Predikce byla úspěšně ukončena.',
        flags: MessageFlags.Ephemeral,
      })
    }

    if (subcommand === 'payout') {
      const predictionId = options.getString('prediction', true)
      const winner = options.getString('pick-winner', true)

      const targetPrediction = await Prediction.findOne({
        predictionId,
      })

      if (!targetPrediction) {
        return interaction.reply('Predikce nebyla nalezena.')
      }

      if (targetPrediction.status === 'active') {
        return interaction.reply(
          'Tato predikce je stále aktivní. Nelze vyplatit.'
        )
      }

      if (targetPrediction.status === 'paid') {
        return interaction.reply('Tato predikce již byla vyplacena.')
      }

      if (targetPrediction.status === 'cancelled') {
        return interaction.reply(
          'Tato predikce byla zrušena a nelze ji vyplatit.'
        )
      }

      const winningChoice = targetPrediction.choices.find(
        (choice) => choice.choiceName === winner
      )

      if (!winningChoice) {
        return interaction.reply('Vítězná možnost nebyla nalezena.')
      }

      const payoutDetails: string[] = []
      const payoutPromises = targetPrediction.choices.map(async (choice) => {
        if (choice.choiceName === winner) {
          const payouts = choice.bets.map(async (bet) => {
            const payoutAmount = bet.amount * choice.odds

            const user = await User.findOne({ userId: bet.userId })
            if (user) {
              user.balance += payoutAmount
              await user.save()
            }

            payoutDetails.push(
              `Uživatel <@${
                bet.userId
              }> obdržel **$${formatNumberToReadableString(payoutAmount)}**.`
            )
          })

          await Promise.all(payouts)
        }
      })

      await Promise.all(payoutPromises)

      await Prediction.findOneAndUpdate(
        { predictionId },
        { status: 'paid', winner: winningChoice.choiceName }
      )

      const messageId = targetPrediction.predictionId
      const channel = (await interaction.guild?.channels.fetch(
        targetPrediction.channelId
      )) as TextChannel
      if (!channel || !messageId) {
        return interaction.reply('Chyba při získávání kanálu nebo zprávy.')
      }

      try {
        const message = await channel.messages.fetch(messageId)
        const embed = message.embeds[0]

        if (embed) {
          const updatedEmbed = new EmbedBuilder(embed.data)
            .setTitle(`Predikce byla vyplacena! 🔴`)
            .setColor('Red')

          await message.edit({ embeds: [updatedEmbed], components: [] })
        }
      } catch (error) {
        console.error('Chyba při aktualizaci zprávy:', error)
        return interaction.reply('Došlo k chybě při aktualizaci embed zprávy.')
      }

      return interaction.reply({
        content: `Sázky na predikci ${predictionId} byly úspěšně vyplaceny na vítěznou možnost ${winner}.\n\n${payoutDetails.join(
          '\n'
        )}`,
        flags: MessageFlags.Ephemeral,
      })
    }
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
