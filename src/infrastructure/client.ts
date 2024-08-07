import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import url from 'url';

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
        if (!this.clientId && !this.clientToken) {
            console.log('[ERR] Please provide CLIENT_ID and CLIENT_TOKEN');
            return;
        }

        this.on('interactionCreate', async (interaction) => {
            if (!interaction.isContextMenuCommand()) return;

            if (!interaction.guild) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp('You cannot use this command in DM!');
                    return;
                }
                await interaction.reply('You cannot use this command in DM!');
                return;
            }

            const client = interaction.client as BotClient;
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.log(`[ERR] No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.log(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp('There was an error while executing this command!');
                    return;
                }
                await interaction.reply('There was an error while executing this command!');
                return;
            }
        });

        // Register slash/custom commands
        this.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            if (!interaction.guild) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp('You cannot use slash commands in DM!');
                    return;
                }
                await interaction.reply('You cannot use slash commands in DM!');
                return;
            }

            const client = interaction.client as BotClient;
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.log(`[ERR] No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.log(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp('There was an error while executing this command!');
                    return;
                }
                await interaction.reply('There was an error while executing this command!');
                return;
            }
        });

        this.once('ready', (client) => {
            if (!client) return;
            console.log(`[INFO] Ready! logged in as ${client.user.tag}`);
        });

        this.login(this.clientToken!!);
    }

    public async RegisterCommands() {
        const files = await glob(`${path.resolve(__dirname, '../command')}/*/*{.ts,.js}`, {
            windowsPathsNoEscape: true,
        });

        const body: any = [];

        await Promise.all(
            files.map(async (filePath) => {
                const imported = await this.importFile(url.pathToFileURL(filePath).href);
                let command = (process.env.NODE_ENV == 'development' && imported) || imported.default;

                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                    body.push(command.default ? command.default.data.toJSON() : command.data.toJSON())
                } else if ('name' in command && 'execute' in command) {
                    this.customs.set(command.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing required properties.`);
                }
            })
        );

        const rest = new REST({ version: '10' }).setToken(this.clientToken!!);
        await rest.put(Routes.applicationCommands(this.clientId!!), {
            body: body,
        });

        console.log(`[INFO] Started refreshing ${this.commands.size} (/) commands.`);
        console.log(`[INFO] Started refreshing ${this.customs.size} custom (/) commands.`);
    }

    private async importFile(filePath: string) {
        return (await import(filePath))?.default;
    }
}
