import { Client, Collection, EmbedBuilder, GatewayIntentBits, REST, Routes } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import url from 'url';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { Misc } from '@/helper/constant';
import { Utils } from '@/helper/util';

export interface Command {
    data: any;
    execute(interaction: CommandInteraction): Promise<void>;
}

export interface CustomCommand {
    name: string;
    description: string;
    execute(message: Message, parameters: string[]): Promise<void> | void;
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
                GatewayIntentBits.GuildMessagePolls
            ],
        });
    }

    public async StartBot() {
        if (!this.clientId && !this.clientToken) {
            console.log('[ERR] Please provide CLIENT_ID and CLIENT_TOKEN');
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

                if (Array.isArray(command)) {
                    for (let item of command) {
                        this.add(item, body, filePath);
                    }
                } else {
                    this.add(command, body, filePath);
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

    public async RegisterPlayer() {
        const player = new Player(this);
        await player.extractors.register(YoutubeiExtractor, {});

        const embed = (message: string) => {
            return new EmbedBuilder()
                .setColor(Misc.PRIMARY_EMBED_COLOR)
                .setAuthor({
                    name: `${this.user?.displayName} - ${this.user?.tag}`,
                    iconURL: this.user?.avatarURL() || '',
                })
                .setTitle(message)
                .setTimestamp()
                .setFooter({ text: 'SauceNAO', iconURL: this.user?.tag });
        };

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
            body.push(command.default ? command.default.data.toJSON() : command.data.toJSON());
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
            console.log(`[ERR] No command matching ${interaction.commandName} was found.`);
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
        const content = message.content;
        if (!content.startsWith(this.COMMAND_PREFIX!!)) return;

        // remove prefix from string
        const removedPrefixContent = content.slice(1);

        // split content to array
        const contentArray = removedPrefixContent.split(' ');

        // get first word as command name after remove prefix, to prevent multiple words in message
        const commandName = contentArray[0] || null;

        // remove command name from current array
        contentArray.splice(0, 1);

        // assign remain items to parameter array
        const parameters = contentArray;

        if (!commandName) return;
        if (!parameters) return;

        const client = message.client as BotClient;
        const command = client.customs.get(commandName);
        if (!command) {
            console.error(`[ERR] No command matching ${commandName} was found.`);
            return;
        }

        try {
            await command.execute(message, parameters);
            return;
        } catch (error) {
            await message.reply('[ERR] There was an error while executing this command!');
            return;
        }
    }
}
