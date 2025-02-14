import mongoose from 'mongoose'
import GuildConfiguration from '../models/GuildConfiguration'
import {
  ChatInputCommandInteraction,
  CacheType,
  MessageFlags,
} from 'discord.js'
import User from '../models/User'

export const connectToDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined')
    mongoose.set('strictQuery', false)
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to the database')
  } catch (error) {
    console.error('Error connecting to the database:', error)
  }
}

type ChannelType =
  | 'casinoChannelIds'
  | 'adminChannelIds'
  | 'predictionChannelIds'

export const checkChannelConfiguration = async (
  interaction: ChatInputCommandInteraction<CacheType>,
  channelType: ChannelType,
  messages: {
    notSet: string
    notAllowed: string
  }
): Promise<boolean> => {
  try {
    let guildConfiguration = await GuildConfiguration.findOne({
      guildId: interaction.guildId,
    })

    if (!guildConfiguration) {
      guildConfiguration = new GuildConfiguration({
        guildId: interaction.guildId,
      })
    }

    if (!guildConfiguration[channelType].length) {
      await interaction.reply({
        content: messages.notSet,
        flags: MessageFlags.Ephemeral,
      })
      return true
    }

    if (!guildConfiguration[channelType].includes(interaction.channelId)) {
      await interaction.reply({
        content: `${messages.notAllowed} ${guildConfiguration[channelType]
          .map((id) => `<#${id}>`)
          .join(', ')}.`,
        flags: MessageFlags.Ephemeral,
      })
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking channel configuration:', error)
    await interaction.reply({
      content: 'Došlo k chybě při kontrole nastavení kanálu.',
      flags: MessageFlags.Ephemeral,
    })
    return true
  }
}

export const checkUserRegistration = async (userId: string) => {
  return await User.findOne({ userId })
}

export const formatNumberToReadableString = (number: number): string => {
  const absNumber = Math.abs(number)

  let formatted: string
  if (absNumber >= 1_000_000_000) {
    formatted =
      (absNumber / 1_000_000_000).toFixed(
        absNumber % 1_000_000_000 === 0 ? 0 : 2
      ) + 'B'
  } else if (absNumber >= 1_000_000) {
    formatted =
      (absNumber / 1_000_000).toFixed(absNumber % 1_000_000 === 0 ? 0 : 2) + 'M'
  } else if (absNumber >= 1_000) {
    formatted =
      (absNumber / 1_000).toFixed(absNumber % 1_000 === 0 ? 0 : 2) + 'k'
  } else {
    formatted = absNumber.toString()
  }

  return number < 0 ? `-${formatted}` : formatted
}

export const parseReadableStringToNumber = (readableString: string): number => {
  const normalizedString = readableString.toUpperCase()

  if (normalizedString.endsWith('B')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000_000_000
  } else if (normalizedString.endsWith('M')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000_000
  } else if (normalizedString.endsWith('K')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000
  } else if (/[^0-9\.]/.test(normalizedString)) {
    return NaN
  } else {
    return parseFloat(normalizedString)
  }
}
