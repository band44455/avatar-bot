const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder
} = require('discord.js');

const http = require('http');

// =========================
// Discord Client
// =========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// =========================
// Render Web Server
// =========================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('Bot is running!\n');
}).listen(PORT, () => {
    console.log(`🌐 Web server started successfully on port ${PORT}`);
});

// =========================
// Settings
// =========================

const OWNER_ID = '919532578500259850';

const AUTO_CHANNELS = [
    '1530724201819013131',
    '1530724352243404941',
    '1530724806754963456'
];

// =========================
// Discord Connection Logs
// =========================

client.once('ready', () => {
    console.log('======================================');
    console.log('✅ اتصل البوت بديسكورد بنجاح!');
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🌐 Servers: ${client.guilds.cache.size}`);
    console.log('======================================');
});

client.on('error', (error) => {
    console.error('❌ Discord Client Error:');
    console.error(error);
});

client.on('shardError', (error) => {
    console.error('❌ Discord Shard Error:');
    console.error(error);
});

client.on('warn', (info) => {
    console.warn('⚠️ Discord Warning:');
    console.warn(info);
});

client.on('debug', (info) => {
    console.log('🔍 Discord Debug:', info);
});

// =========================
// Buttons
// =========================

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // =========================
    // Download Button
    // =========================

    if (interaction.customId.startsWith('dl_')) {
        await interaction.deferReply({
            ephemeral: true
        });

        try {
            const parts = interaction.customId.split('_');

            const channelId = parts[1];
            const messageId = parts[2];

            const targetChannel =
                await client.channels.fetch(channelId).catch(() => null);

            if (!targetChannel) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على الشنل الأصلية.'
                });
            }

            const targetMessage =
                await targetChannel.messages.fetch(messageId).catch(() => null);

            let avatarUrl;
            let bannerUrl;

            if (
                targetMessage &&
                targetMessage.embeds.length > 0
            ) {
                avatarUrl =
                    targetMessage.embeds[0].author?.iconURL();

                bannerUrl =
                    targetMessage.embeds[0].image?.url;
            }

            if (!avatarUrl || !bannerUrl) {
                return interaction.editReply({
                    content:
                        '❌ عذراً، لم أستطع العثور على الافتار والبنر.'
                });
            }

            const dlAvatar = new AttachmentBuilder(
                avatarUrl,
                {
                    name: 'avatar.gif'
                }
            );

            const dlBanner = new AttachmentBuilder(
                bannerUrl,
                {
                    name: 'banner.gif'
                }
            );

            await interaction.editReply({
                content:
                    '**الافتار والبنر جاهزان للتحميل:**',
                files: [
                    dlAvatar,
                    dlBanner
                ]
            });

        } catch (error) {
            console.error(
                '❌ Download Error:',
                error
            );

            await interaction.editReply({
                content:
                    '❌ حدث خطأ أثناء تجهيز الملفات.'
            }).catch(() => {});
        }

        return;
    }

    // =========================
    // Delete Button
    // =========================

    if (interaction.customId.startsWith('delete_')) {
        const ownerId =
            interaction.customId.replace(
                'delete_',
                ''
            );

        if (interaction.user.id === ownerId) {
            await interaction.message
                .delete()
                .catch(() => {});
        } else {
            await interaction.reply({
                content:
                    '❌ لا يمكنك حذف هذه المعاينة لأنك لست صاحب الأمر!',
                ephemeral: true
            });
        }
    }
});

// =========================
// Message Create
// =========================

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // =========================
    // Auto Channels
    // =========================

    if (AUTO_CHANNELS.includes(message.channel.id)) {
        const attachments =
            Array.from(
                message.attachments.values()
            );

        if (attachments.length < 2) return;

        const avatarUrl =
            attachments[0].url;

        const bannerUrl =
            attachments[1].url;

        try {
            const avatarFile =
                new AttachmentBuilder(
                    avatarUrl,
                    {
                        name: 'avatar.gif'
                    }
                );

            const bannerFile =
                new AttachmentBuilder(
                    bannerUrl,
                    {
                        name: 'banner.gif'
                    }
                );

            const embed =
                new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({
                        name:
                            `👤 الملف الشخصي لـ ${message.author.username}`,
                        iconURL:
                            'attachment://avatar.gif'
                    })
                    .setDescription(
                        '\u200b\n**[` البنر المتحرك `]**\n'
                    )
                    .setImage(
                        'attachment://banner.gif'
                    );

            const avatarEmbed =
                new EmbedBuilder()
                    .setColor('#111214')
                    .setDescription(
                        '**[` الافتار الشخصي `]**'
                    )
                    .setImage(
                        'attachment://avatar.gif'
                    );

            const sentMessage =
                await message.channel.send({
                    embeds: [
                        embed,
                        avatarEmbed
                    ],
                    files: [
                        avatarFile,
                        bannerFile
                    ]
                });

            const row =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                `dl_${message.channel.id}_${sentMessage.id}`
                            )
                            .setEmoji('📥')
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `delete_${message.author.id}`
                            )
                            .setEmoji('🗑️')
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    );

            await sentMessage.edit({
                components: [row]
            });

            await message.delete()
                .catch(() => {});

        } catch (error) {
            console.error(
                '❌ Auto Channel Error:',
                error
            );
        }

        return;
    }

    // =========================
    // Manual Command !دمج
    // =========================

    if (message.content.startsWith('!دمج')) {

        if (message.author.id !== OWNER_ID) {
            return message.reply(
                '❌ عذراً، هذا الأمر مخصص حصرياً لصاحب البوت فقط!'
            );
        }

        const attachments =
            Array.from(
                message.attachments.values()
            );

        if (attachments.length < 2) {
            return message.reply(
                '❌ من فضلك أرسل صورتين مع الأمر!'
            );
        }

        const avatarUrl =
            attachments[0].url;

        const bannerUrl =
            attachments[1].url;

        try {
            const embed =
                new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({
                        name:
                            `👤 الملف الشخصي لـ ${message.author.username}`,
                        iconURL:
                            avatarUrl
                    })
                    .setDescription(
                        '\u200b\n**[` البنر المتحرك `]**\n'
                    )
                    .setImage(
                        bannerUrl
                    );

            const avatarEmbed =
                new EmbedBuilder()
                    .setColor('#111214')
                    .setDescription(
                        '**[` الافتار الشخصي `]**'
                    )
                    .setImage(
                        avatarUrl
                    );

            const sentMessage =
                await message.reply({
                    embeds: [
                        embed,
                        avatarEmbed
                    ]
                });

            const row =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                `dl_${message.channel.id}_${sentMessage.id}`
                            )
                            .setEmoji('📥')
                            .setStyle(
                                ButtonStyle.Secondary
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                `delete_${message.author.id}`
                            )
                            .setEmoji('🗑️')
                            .setStyle(
                                ButtonStyle.Secondary
                            )
                    );

            await sentMessage.edit({
                components: [row]
            });

        } catch (error) {
            console.error(
                '❌ Manual Command Error:',
                error
            );
        }
    }
});

// =========================
// Login
// =========================

const TOKEN = process.env.TOKEN;

console.log(
    `🔑 TOKEN موجود؟ ${!!TOKEN}`
);

if (!TOKEN) {
    console.error(
        '❌ TOKEN غير موجود في Environment Variables'
    );

    process.exit(1);
}

console.log(
    '🔌 جاري الاتصال بـ Discord...'
);

client.login(TOKEN)
    .then(() => {
        console.log(
            '⏳ تم إرسال طلب تسجيل الدخول إلى Discord، بانتظار الاتصال...'
        );
    })
    .catch((error) => {
        console.error(
            '❌ فشل تسجيل الدخول إلى Discord:'
        );

        console.error(error);
    });
