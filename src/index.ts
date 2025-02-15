import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js'
import { connectToDatabase } from './utils/utils'
import { CommandKit } from 'commandkit'
import * as path from 'path'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

async function startApp(client: Client) {
  await connectToDatabase()

  new CommandKit({
    client,
    commandsPath: path.join(__dirname, 'commands'),
    eventsPath: path.join(__dirname, 'events'),
    bulkRegister: true,
    devGuildIds: ['1298805664654561340'],
    devUserIds: ['563799503056928768'],
  })

  await client.login(process.env.TOKEN)
}

startApp(client)
