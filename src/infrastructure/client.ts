import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';

export interface Command {
    data: any;
    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CustomCommand {
    name: string;
    execute(message: Message, parameters: string[]): Promise<void> | void;
}

export class BotClient extends Client {
    private readonly commands = new Collection<string, Command>();
    private readonly customs = new Collection<string, CustomCommand>();
    private readonly clientToken = process.env.CLIENT_TOKEN;
    private readonly clientId = process.env.CLIENT_ID;
    private readonly clientSecret = process.env.CLIENT_SECRET;


    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
            ],
        });
    }

    public async StartBot() {
        if(!this.clientId && !this.clientToken) {
            console.log("[ERR] Please provide CLIENT_ID and CLIENT_TOKEN")
            return;
        }

    
        console.log(`[INFO] Started refreshing ${this.commands.size} (/) commands.`);
        console.log(`[INFO] Started refreshing ${this.customs.size} custom (/) commands.`);


        const rest = new REST({ version: '10'}).setToken(this.clientToken!!);
        await rest.put(Routes.applicationCommands(this.clientId!!), {
            body: this.commands
        })

        this.once('ready', (client) => {
            if (!client) return;
            console.log(`Ready! logged in as ${client.user.tag}`);
        });

        this.login(this.clientToken!!)
    }
}
