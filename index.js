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
// Settings
// =========================

const OWNER_ID = '919532578500259850';

const AUTO_CHANNELS = [
    '1530724201819013131',
    '1530724352243404941',
    '1530724806754963456'
];

const TOKEN = process.env.TOKEN;

// =========================
// Render Web Server
// =========================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    res.end('Discord Bot is running!\n');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server started successfully on port ${PORT}`);
});

// =========================
// Discord Debug
// =========================

client.on('debug', (info) => {
    // لا نطبع معلومات حساسة كاملة
    if (
        info.includes('Provided token') ||
        info.includes('Authorization')
    ) {
        console.log('🔐 Discord Debug: Token provided');
        return;
    }

    console.log(`🔎 Discord Debug: ${info}`);
});

client.on('warn', (info) => {
    console.log(`⚠️ Discord Warning: ${info}`);
});

client.on('error', (error) => {
    console.error('❌ Discord Client Error:');
    console.error(error);
});

client.on('shardError', (error) => {
    console.error('❌ Discord Gateway Error:');
    console.error(error);
});

client.on('shardDisconnect', (event, shardId) => {
    console.log(`🔌 Discord disconnected. Shard: ${shardId}`);
    console.log(event);
});

client.on('shardReconnecting', (shardId) => {
    console.log(`🔄 Discord reconnecting... Shard: ${shardId}`);
});

client.on('shardReady', (shardId) => {
    console.log(`✅ Discord shard ${shardId} is ready!`);
});

// =========================
// Bot Ready
// =========================

client.once('ready', () => {
    console.log('====================================');
    console.log('🤖 DISCORD BOT CONNECTED SUCCESSFULLY');
    console.log(`👤 Bot: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);
    console.log('====================================');
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

            if (parts.length < 3) {
                return interaction.editReply({
                    content: '❌ بيانات زر التحميل غير صحيحة.'
                });
            }

            const channelId = parts[1];
            const messageId = parts[2];

            const targetChannel = await client.channels
                .fetch(channelId)
                .catch(() => null);

            if (!targetChannel) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على الشنل.'
                });
            }

            if (!targetChannel.isTextBased()) {
                return interaction.editReply({
                    content: '❌ هذه الشنل ليست نصية.'
                });
            }

            const targetMessage = await targetChannel.messages
                .fetch(messageId)
                .catch(() => null);

            if (!targetMessage) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على رسالة المعاينة.'
                });
            }

            const attachments = Array.from(
                targetMessage.attachments.values()
            );

            if (attachments.length < 2) {

                return interaction.editReply({
                    content:
                        '❌ لم أجد الافتار والبنر الأصليين في الرسالة.'
                });
            }

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            const avatarResponse = await fetch(avatarUrl);
            const bannerResponse = await fetch(bannerUrl);

            if (!avatarResponse.ok || !bannerResponse.ok) {
                return interaction.editReply({
                    content:
                        '❌ تعذر تحميل الملفات الأصلية من Discord.'
                });
            }

            const avatarBuffer = Buffer.from(
                await avatarResponse.arrayBuffer()
            );

            const bannerBuffer = Buffer.from(
                await bannerResponse.arrayBuffer()
            );

            const avatarFile = new AttachmentBuilder(
                avatarBuffer,
                {
                    name: 'avatar.gif'
                }
            );

            const bannerFile = new AttachmentBuilder(
                bannerBuffer,
                {
                    name: 'banner.gif'
                }
            );

            await interaction.editReply({
                content:
                    '📥 **الافتار والبنر جاهزان للتحميل:**',
                files: [
                    avatarFile,
                    bannerFile
                ]
            });

        } catch (error) {

            console.error('❌ Download Error:', error);

            if (interaction.deferred) {
                await interaction.editReply({
                    content:
                        '❌ حدث خطأ أثناء تحميل الملفات.'
                }).catch(() => {});
            }
        }

        return;
    }

    // =========================
    // Delete Button
    // =========================

    if (interaction.customId.startsWith('delete_')) {

        const ownerId =
            interaction.customId.replace('delete_', '');

        if (interaction.user.id === ownerId) {

            await interaction.message
                .delete()
                .catch(() => {});

        } else {

            await interaction.reply({
                content:
                    '❌ لا يمكنك حذف هذه المعاينة لأنك لست صاحب الأمر!',
                ephemeral: true
            }).catch(() => {});
        }

        return;
    }
});

// =========================
// Message Create
// =========================

client.on('messageCreate', async (message) => {

    try {

        if (message.author.bot) return;

        // =========================
        // Automatic Channels
        // =========================

        if (AUTO_CHANNELS.includes(message.channel.id)) {

            const attachments =
                Array.from(message.attachments.values());

            if (attachments.length < 2) return;

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            const avatarResponse = await fetch(avatarUrl);
            const bannerResponse = await fetch(bannerUrl);

            if (!avatarResponse.ok || !bannerResponse.ok) {

                console.error(
                    '❌ Failed to download Discord attachments.'
                );

                return;
            }

            const avatarBuffer = Buffer.from(
                await avatarResponse.arrayBuffer()
            );

            const bannerBuffer = Buffer.from(
                await bannerResponse.arrayBuffer()
            );

            const avatarFile = new AttachmentBuilder(
                avatarBuffer,
                {
                    name: 'avatar.gif'
                }
            );

            const bannerFile = new AttachmentBuilder(
                bannerBuffer,
                {
                    name: 'banner.gif'
                }
            );

            const embed = new EmbedBuilder()
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

            const avatarEmbed = new EmbedBuilder()
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
                new ActionRowBuilder().addComponents(

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

            console.log(
                `✅ Auto merge completed for ${message.author.tag}`
            );

            return;
        }

        // =========================
        // Manual !دمج
        // =========================

        if (message.content.startsWith('!دمج')) {

            if (message.author.id !== OWNER_ID) {

                await message.reply({
                    content:
                        '❌ هذا الأمر مخصص لصاحب البوت فقط!'
                });

                return;
            }

            const attachments =
                Array.from(message.attachments.values());

            if (attachments.length < 2) {

                await message.reply({
                    content:
                        '❌ من فضلك أرسل صورتين مع الأمر!'
                });

                return;
            }

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            const embed = new EmbedBuilder()
                .setColor('#111214')
                .setAuthor({
                    name:
                        `👤 الملف الشخصي لـ ${message.author.username}`,
                    iconURL: avatarUrl
                })
                .setDescription(
                    '\u200b\n**[` البنر المتحرك `]**\n'
                )
                .setImage(bannerUrl);

            const avatarEmbed = new EmbedBuilder()
                .setColor('#111214')
                .setDescription(
                    '**[` الافتار الشخصي `]**'
                )
                .setImage(avatarUrl);

            const sentMessage =
                await message.reply({
                    embeds: [
                        embed,
                        avatarEmbed
                    ]
                });

            const row =
                new ActionRowBuilder().addComponents(

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

            console.log(
                `✅ !دمج executed by ${message.author.tag}`
            );
        }

    } catch (error) {

        console.error(
            '❌ Message Handler Error:',
            error
        );
    }
});

// =========================
// Login
// =========================

if (!TOKEN) {

    console.error(
        '❌ ERROR: TOKEN غير موجود في Environment Variables في Render.'
    );

    process.exit(1);
}

console.log('🔑 TOKEN موجود: true');
console.log('🔌 جاري الاتصال بـ Discord...');

client.login(TOKEN)
    .then(() => {

        console.log(
            '📡 Login request sent successfully.'
        );

    })
    .catch((error) => {

        console.error(
            '❌ فشل تسجيل الدخول إلى Discord:'
        );

        console.error(error);

        process.exit(1);
    });
