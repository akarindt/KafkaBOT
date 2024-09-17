import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import url from 'url';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { Utils } from '@/helper/util';

export type CustomOptions = {
    parameters: Collection<string, string | undefined>;
    content: string | undefined;
};

export interface Command {
    data: any;
    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CustomCommand {
    name: string;
    description: string;
    parameters: string[];
    execute(message: Message, options: CustomOptions): Promise<void> | void;
}

export class BotClient extends Client {
    private readonly commands = new Collection<string, Command>();
    private readonly customs = new Collection<string, CustomCommand>();
    private readonly clientToken = process.env.CLIENT_TOKEN;
    private readonly clientId = process.env.CLIENT_ID;
    private readonly COMMAND_PREFIX = process.env.COMMAND_PREFIX;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessagePolls,
                GatewayIntentBits.GuildPresences,
            ],
        });
    }

    public async StartBot() {
        if (!this.clientId && !this.clientToken) {
            console.log('[ERROR] Please provide CLIENT_ID and CLIENT_TOKEN');
            return;
        }

        // Register slash/context/custom commands
        this.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
                await this.assign(interaction);
            }
            return;
        });

        this.on('messageCreate', async (message) => {
            await this.assignCustom(message);
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
                const imported = await Utils.importFile(url.pathToFileURL(filePath).href);
                let command: any = (process.env.NODE_ENV == 'development' && imported) || imported.default;

                if (Array.isArray(command) || Array.isArray(command.default)) {
                    if ('default' in command) {
                        for (let item of command.default) {
                            this.add(item, body, filePath);
                        }
                    } else {
                        for (let item of command) {
                            this.add(item, body, filePath);
                        }
                    }
                } else {
                    if ('default' in command) {
                        this.add(command.default, body, filePath);
                    } else {
                        this.add(command, body, filePath);
                    }
                }
            })
        );

        const rest = new REST({ version: '10' }).setToken(this.clientToken!!);
        await rest.put(Routes.applicationCommands(this.clientId!!), {
            body: body,
        });

        console.log(`[INFO] Started refreshing ${this.commands.size} (/) commands.`);
        console.log(`[INFO] Started refreshing ${this.customs.size} custom (${process.env.COMMAND_PREFIX}) commands.`);
    }

    public async RegisterPlayer() {
        const player = new Player(this);
        await player.extractors.register(YoutubeiExtractor, {});

        player.events.on('playerStart', (queue, track) => {
            queue.metadata.channel.send(`🎶 Started playing: **[${track.title}](${track.url})** in **${queue.channel?.name}**!`);
        });

        player.events.on('disconnect', (queue) => {
            queue.metadata.channel.send(`❌ I was manually disconnected from the voice channel, clearing queue!`);
        });

        player.events.on('emptyChannel', (queue) => {
            queue.metadata.channel.send('❌ Nobody is in the voice channel, leaving...');
        });

        player.events.on('emptyQueue', (queue) => {
            queue.metadata.channel.send('✅ Queue finished!');
        });
    }

    private add(command: any, body: any[], filePath: string) {
        if ('data' in command && 'execute' in command) {
            this.commands.set(command.data.name, command);
            body.push(command.data.toJSON());
        } else if ('name' in command && 'execute' in command) {
            this.customs.set(command.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing required properties.`);
        }
    }

    private async assign(interaction: CommandInteraction) {
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
            console.log(`[ERROR] No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
            return;
        } catch (error) {
            console.log(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error while executing this command!');
                return;
            }
            await interaction.reply('There was an error while executing this command!');
            return;
        }
    }

    private async assignCustom(message: Message) {
        if (!message.guild) return;
        let content: string | undefined = message.content;
        if (!content.startsWith(this.COMMAND_PREFIX!!)) return;

        // remove prefix from string
        content = content.replace(new RegExp(this.COMMAND_PREFIX!!), '');

        // get command name
        const commandName = content.split(' ').length ? content.split(' ')[0] : undefined;
        if (!commandName) return;

        // remove command name from current array
        content = content.replace(new RegExp(commandName), '').trim();

        const client = message.client as BotClient;
        const command = client.customs.get(commandName);
        if (!command) {
            console.error(`[ERROR] No command matching ${commandName} was found.`);
            return;
        }

        const parameters = new Collection<string, any>(); // Initialize parameters collection
        let contentArr = content.split(' '); // Copy array

        for (let i = 0; i < command.parameters.length; i++) {
            const paramValue = contentArr[i] || undefined; // Assign parameter's value based on index
            parameters.set(command.parameters[i], paramValue); // Set parameter's value
            if (content && paramValue) {
                content = content.replace(new RegExp(paramValue), '').trim(); // remove parameter from message content
            }
        }

        content = content || undefined; // Just a step to assign content to undefined

        try {
            await command.execute(message, { parameters, content });
            return;
        } catch (error) {
            await message.reply('[ERROR] There was an error while executing this command!');
            return;
        }
    }
}
