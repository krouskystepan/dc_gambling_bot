import { ColorResolvable, EmbedBuilder } from 'discord.js'

export const createBetEmbed = (
  title: string,
  color: ColorResolvable,
  description: string
) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(description)
    .setTimestamp()
}
