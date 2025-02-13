import type { CommandData, SlashCommandProps, CommandOptions } from 'commandkit'
import User from '../../models/User'
import {
  checkChannelConfiguration,
  formatNumberToReadableString,
  parseReadableStringToNumber,
} from '../../utils/utils'
import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from 'discord.js'

export const data: CommandData = {
  name: 'manage-balance',
  description: 'Spravuj peníze uživatelů.',
  options: [
    {
      name: 'deposit',
      description: 'Přidej peníze uživateli.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Uživatel, kterému chceš přidat peníze.',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: 'amount',
          description:
            'Částka, kterou chceš přidat. (Můžeš zadat i 5k, 2.5k, 2M).',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'withdraw',
      description: 'Odeber peníze uživateli.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Uživatel, kterému chceš odebrat peníze.',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: 'amount',
          description:
            'Částka, kterou chceš odebrat. (Můžeš zadat i 5k, 2.5k, 2M).',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'check',
      description: 'Zjisti zůstatek uživatele.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Uživatel, jehož zůstatek chceš zjistit.',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: 'list',
      description: 'Zjisti zůstatek všech uživatelů.',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'reset',
      description: 'Resetuj zůstatek uživatele.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Uživatel, jehož zůstatek chceš resetovat.',
          type: ApplicationCommandOptionType.User,
          required: true,
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
      'adminChannelIds',
      {
        notSet:
          'Tento server nebyl ještě nastaven pro používání sázkových příkazů. Nastav ho pomocí `/setup-manage`.',
        notAllowed: `Tento kanál není nastaven pro používání sázkových příkazů. Zkuste jeden z těchto kanálů:`,
      }
    )

    if (configReply) return

    const options = interaction.options as CommandInteractionOptionResolver

    const subcommand = options.getSubcommand()

    if (subcommand === 'deposit') {
      const user = interaction.options.getUser('user', true)

      if (user.bot) {
        return interaction.reply('Nemůžeš přidat peníze botovi.')
      }

      const amount = interaction.options.getString('amount', true)

      const parsedAmount = parseReadableStringToNumber(amount)

      if (parsedAmount < 0) {
        return interaction.reply('Částka nemůže být záporná.')
      }

      const userDocument = await User.findOne({ userId: user.id })
      if (!userDocument) {
        await User.create({ userId: user.id, balance: parsedAmount })
      } else {
        userDocument.balance += parsedAmount
        await userDocument.save()
      }

      return interaction.reply(
        `Přidal jsi **$${formatNumberToReadableString(
          parsedAmount
        )}** uživateli <@${
          user.id
        }> \nAktuální stav účtu: **$${formatNumberToReadableString(
          userDocument?.balance!
        )}**.`
      )
    }

    if (subcommand === 'withdraw') {
      const user = interaction.options.getUser('user', true)

      if (user.bot) {
        return interaction.reply('Nemůžeš odebrat peníze botovi.')
      }

      const amount = interaction.options.getString('amount', true)

      const parsedAmount = parseReadableStringToNumber(amount)

      if (parsedAmount < 0) {
        return interaction.reply('Částka nemůže být záporná.')
      }

      const userDocument = await User.findOne({ userId: user.id })

      if (userDocument?.balance! < parsedAmount) {
        return interaction.reply(
          `Uživatel <@${user.id}> nemá dostatečný zůstatek na účtu.`
        )
      }

      if (!userDocument) {
        await User.create({ userId: user.id, balance: -parsedAmount })
      } else {
        userDocument.balance -= parsedAmount
        await userDocument.save()
      }

      return interaction.reply(
        `Odebral jsi **$${formatNumberToReadableString(
          parsedAmount
        )}** uživateli <@${
          user.id
        }> \nAktuální stav účtu: **$${formatNumberToReadableString(
          userDocument?.balance!
        )}**.`
      )
    }

    if (subcommand === 'reset') {
      const user = interaction.options.getUser('user', true)

      const userDocument = await User.findOne({ userId: user.id })

      if (!userDocument) {
        return interaction.reply({
          content: 'Tohoto uživatele neznáme.',
          flags: MessageFlags.Ephemeral,
        })
      }

      userDocument.balance = 0

      await userDocument.save()

      return interaction.reply(
        `Zůstatek uživatele <@${user.id}> byl resetován.`
      )
    }

    if (subcommand === 'check') {
      const user = interaction.options.getUser('user', true)

      const userDocument = await User.findOne({ userId: user.id })

      if (!userDocument) {
        return interaction.reply({
          content: 'Tohoto uživatele neznáme.',
          flags: MessageFlags.Ephemeral,
        })
      }

      return interaction.reply(
        `Uživatel <@${user.id}> má na účtu **$${formatNumberToReadableString(
          userDocument.balance
        )}**.`
      )
    }

    if (subcommand === 'list') {
      const users = await User.find()

      const usersString = users
        .map(
          (user) =>
            `<@${user.userId}>: **$${formatNumberToReadableString(
              user.balance
            )}**`
        )
        .join('\n')

      return interaction.reply(`Zůstatek všech uživatelů:\n${usersString}`)
    }

    return interaction.reply('Příkaz nebyl nalezen.')
  } catch (error) {
    console.error('Error running the command:', error)
    return interaction.reply({
      content: 'Při zpracování příkazu došlo k chybě.',
      flags: MessageFlags.Ephemeral,
    })
  }
}
