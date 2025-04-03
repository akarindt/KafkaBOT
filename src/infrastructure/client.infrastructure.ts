import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';
import { glob } from 'glob';
import path from 'path';
import url from 'url';
import { ImportFile } from '@helper/util.helper';
import { database } from '@helper/datasource.helper';
import { DiscordCommand, DiscordCustomCommand } from '@/interface';
import { DiscordRestApiBody } from '@/type';
import Job from '@/job';

export class BotClient extends Client {
    private readonly commands = new Collection<string, DiscordCommand>();
    private readonly customs = new Collection<string, DiscordCustomCommand>();
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

        // Register slash/context commands
        this.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
                await this.Assign(interaction);
            }
            return;
        });

        // Register custom commands
        this.on('messageCreate', async (message) => await this.AssignCustom(message));

        this.once('ready', (client) => {
            if (!client) return;
            console.log(`[INFO] Ready! logged in as ${client.user.tag}`);
        });

        this.login(this.clientToken!);
    }

    public async RegisterCommands() {
        const files = await glob(`${path.resolve(__dirname, '../command')}/*/*{.ts,.js}`, {
            windowsPathsNoEscape: true,
        });

        const body: DiscordRestApiBody[] = [];

        await Promise.all(
            files.map(async (filePath) => {
                const imported = await ImportFile(url.pathToFileURL(filePath).href);
                const command: DiscordCommand[] | DiscordCommand | DiscordCustomCommand | DiscordCustomCommand[] =
                    'default' in imported ? imported.default : imported;

                if (Array.isArray(command)) {
                    command.forEach((item) => this.Add(item, body, filePath));
                    return;
                }

                this.Add(command, body, filePath);
                return;
            })
        );

        const rest = new REST({ version: '10' }).setToken(this.clientToken!);
        await rest.put(Routes.applicationCommands(this.clientId!), { body });

        console.log(`[INFO] Started refreshing ${this.commands.size} (/) commands.`);
        console.log(`[INFO] Started refreshing ${this.customs.size} custom (${process.env.COMMAND_PREFIX}) commands.`);
    }

    public async RegisterCronJob() {
        return await new Job(this).Initialize();
    }

    public InitDB() {
        database.InitializeDB();
        return;
    }

    private Add(command: DiscordCommand | DiscordCustomCommand, body: DiscordRestApiBody[], filePath: string) {
        if ('data' in command && 'execute' in command) {
            this.commands.set(command.data.name, command);
            body.push(command.data.toJSON());
            return;
        }

        if ('name' in command && 'execute' in command) {
            this.customs.set(command.name, command);
            return;
        }

        console.log(`[WARNING] The command at ${filePath} is missing required properties.`);
        return;
    }

    private async Assign(interaction: CommandInteraction) {
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
            console.log(`[ERROR] ${error}`);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error while executing this command!');
                return;
            }
            await interaction.reply('There was an error while executing this command!');
            return;
        }
    }

    private async AssignCustom(message: Message) {
        if (!message.guild) return;

        let content: string | undefined = message.content;

        if (!content.startsWith(this.COMMAND_PREFIX!)) return;

        // remove prefix from string
        content = content.replace(new RegExp(this.COMMAND_PREFIX!), '');

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

        const parameters = new Collection<string, string | undefined>(); // Initialize parameters collection
        const contentArr = content.split(' '); // Copy array

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
        } catch {
            await message.reply('[ERROR] There was an error while executing this command!');
            return;
        }
    }
}
