import { Schema, model, Document } from 'mongoose'

export type GuildConfiguration = Document & {
  guildId: string
  adminChannelIds: string[]
  casinoChannelIds: string[]
  predictionChannelIds: [string]
}

const guildConfigurationSchema = new Schema<GuildConfiguration>({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  adminChannelIds: {
    type: [String],
    default: [],
  },
  casinoChannelIds: {
    type: [String],
    default: [],
  },
  predictionChannelIds: {
    type: [String],
    default: [],
  },
})

export default model<GuildConfiguration>(
  'GuildConfiguration',
  guildConfigurationSchema
)
