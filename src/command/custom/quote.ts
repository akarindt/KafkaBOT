import Quote from '@/entity/quote';
import { AppDataSource } from '@/helper/datasource';
import { CustomOptions } from '@/infrastructure/client';
import { Message } from 'discord.js';

export default [
    {
        name: '%',
        description: 'Save quote',
        async execute(message: Message, options: CustomOptions) {
            
        },
    },
    {
        name: '%%',
        description: 'Get quote',
        async execute(message: Message, options: CustomOptions) {},
    },
];
