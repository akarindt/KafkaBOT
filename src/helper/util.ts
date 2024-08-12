import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import { AppDataSource } from './datasource';
import NsfwKeyword from '@/entity/nsfwKeyword';
import Command from '@/entity/command';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
export class Utils {
    public static GetUrlPath = (url: string): string => {
        return url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/, '');
    };

    public static ButtonPagination = async (interaction: CommandInteraction, pages: any[], time = 30 * 1000) => {
        if (!interaction || !pages || !pages.length) throw new Error('Invalid arguments');
        await interaction.deferReply();

        if (pages.length === 1) {
            await interaction.editReply({
                embeds: pages,
                components: [],
            });
            return;
        }

        const prev = new ButtonBuilder().setCustomId('prev').setEmoji('◀️').setStyle(ButtonStyle.Primary).setDisabled(true);

        const next = new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Primary);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([prev, next]);

        let index = 0;

        const msg = await interaction.editReply({
            embeds: [pages[index]],
            components: [buttons],
        });

        const mc = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time,
        });

        mc.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: '❌ You are not allowed to do this!', ephemeral: true });
                return;
            }

            await i.deferUpdate();

            if (i.customId === 'prev') {
                if (index > 0) {
                    index--;
                }
            }

            if (i.customId === 'next') {
                if (index < pages.length - 1) {
                    index++;
                }
            }

            if (index === 0) {
                prev.setDisabled(true);
            } else {
                prev.setDisabled(false);
            }

            if (index === pages.length - 1) {
                next.setDisabled(true);
            } else {
                next.setDisabled(false);
            }

            await msg.edit({
                embeds: [pages[index]],
                components: [buttons],
            });

            mc.resetTimer();
        });

        mc.on('end', async () => {
            await msg.edit({
                embeds: [pages[index]],
                components: [],
            });
        });

        return msg;
    };

    public static ChunkArray = (array: any[], n: number) => {
        const chunkedArray = [];
        for (let i = 0; i < array.length; i += n) {
            chunkedArray.push(array.slice(i, i + n));
        }
        return chunkedArray;
    };

    public static importFile = async (filePath: string) => {
        return (await import(filePath))?.default;
    }
}
