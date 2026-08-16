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

// ===============================
// Discord Client
// ===============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ===============================
// Render Web Server
// ===============================
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running online 24/7!\n');
}).listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web server started successfully');
});

// ===============================
// Settings
// ===============================

// آيدي حسابك الشخصي
const OWNER_ID = '919532578500259850';

// آيديات الشنلات الخاصة بالتنظيم التلقائي
const AUTO_CHANNELS = [
    '1530724201819013131',
    '1530724352243404941',
    '1530724806754963456'
];

// ===============================
// Discord Ready
// ===============================
client.once('ready', () => {
    console.log('=================================');
    console.log(`🚀 BOT READY: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🏠 Servers: ${client.guilds.cache.size}`);
    console.log('=================================');
});

// ===============================
// Discord Error Diagnostics
// ===============================

client.on('error', (error) => {
    console.error('❌ DISCORD CLIENT ERROR:');
    console.error(error);
});

client.on('shardError', (error) => {
    console.error('❌ DISCORD SHARD ERROR:');
    console.error(error);
});

client.on('warn', (warning) => {
    console.warn('⚠️ DISCORD WARNING:');
    console.warn(warning);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ UNHANDLED REJECTION:');
    console.error(error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:');
    console.error(error);
});

// ===============================
// Buttons
// ===============================

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // ===============================
    // Download Button
    // ===============================
    if (interaction.customId.startsWith('dl_')) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const parts = interaction.customId.split('_');

            const channelId = parts[1];
            const messageId = parts[2];

            const targetChannel = await client.channels
                .fetch(channelId)
                .catch(() => null);

            if (!targetChannel) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على الشنل الأصلية.'
                });
            }

            const targetMessage = await targetChannel.messages
                .fetch(messageId)
                .catch(() => null);

            if (!targetMessage) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على الرسالة الأصلية.'
                });
            }

            let avatarUrl;
            let bannerUrl;

            if (targetMessage.embeds.length > 0) {
                const firstEmbed = targetMessage.embeds[0];
                const secondEmbed = targetMessage.embeds[1];

                avatarUrl = firstEmbed.author?.iconURL({
                    extension: 'gif',
                    forceStatic: false
                });

                bannerUrl = firstEmbed.image?.url;

                if (!avatarUrl && secondEmbed) {
                    avatarUrl = secondEmbed.image?.url;
                }
            }

            if (!avatarUrl || !bannerUrl) {
                return interaction.editReply({
                    content: '❌ تعذر العثور على الافتار والبنر الأصليين.'
                });
            }

            const dlAvatar = new AttachmentBuilder(avatarUrl, {
                name: 'avatar.gif'
            });

            const dlBanner = new AttachmentBuilder(bannerUrl, {
                name: 'banner.gif'
            });

            await interaction.editReply({
                content:
                    '**الافتار والبنر الأصليين جاهزان للتحميل:**',
                files: [dlAvatar, dlBanner]
            });

        } catch (error) {
            console.error('❌ DOWNLOAD BUTTON ERROR:');
            console.error(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء التحميل.',
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.editReply({
                    content: '❌ حدث خطأ أثناء التحميل.'
                }).catch(() => {});
            }
        }

        return;
    }

    // ===============================
    // Delete Button
    // ===============================
    if (interaction.customId.startsWith('delete_')) {
        const ownerId = interaction.customId.replace('delete_', '');

        if (interaction.user.id === ownerId) {
            await interaction.message.delete().catch(() => {});
        } else {
            await interaction.reply({
                content: '❌ لا يمكنك حذف هذه المعاينة لأنك لست صاحب الأمر!',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ===============================
// Messages
// ===============================

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;

        // ===============================
        // Automatic Avatar + Banner
        // ===============================

        if (AUTO_CHANNELS.includes(message.channel.id)) {
            const attachments = Array.from(
                message.attachments.values()
            );

            if (attachments.length < 2) return;

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            try {
                const avatarFile = new AttachmentBuilder(
                    avatarUrl,
                    { name: 'avatar.gif' }
                );

                const bannerFile = new AttachmentBuilder(
                    bannerUrl,
                    { name: 'banner.gif' }
                );

                const embed = new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({
                        name: `👤 الملف الشخصي لـ ${message.author.username}`,
                        iconURL: 'attachment://avatar.gif'
                    })
                    .setDescription(
                        '\u200b\n**[` البنر المتحرك `]**\n'
                    )
                    .setImage('attachment://banner.gif');

                const avatarEmbed = new EmbedBuilder()
                    .setColor('#111214')
                    .setDescription(
                        '**[` الافتار الشخصي `]**'
                    )
                    .setImage('attachment://avatar.gif');

                const sentMessage = await message.channel.send({
                    embeds: [embed, avatarEmbed],
                    files: [avatarFile, bannerFile]
                });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `dl_${message.channel.id}_${sentMessage.id}`
                            )
                            .setEmoji('📥')
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId(
                                `delete_${message.author.id}`
                            )
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await sentMessage.edit({
                    components: [row]
                });

                await message.delete().catch(() => {});

            } catch (error) {
                console.error('❌ AUTO CHANNEL ERROR:');
                console.error(error);
            }

            return;
        }

        // ===============================
        // Manual !دمج Command
        // ===============================

        if (message.content.startsWith('!دمج')) {

            console.log(
                `📩 !دمج used by ${message.author.tag} (${message.author.id})`
            );

            if (message.author.id !== OWNER_ID) {
                return message.reply(
                    '❌ عذراً، هذا الأمر مخصص حصرياً لصاحب البوت فقط!'
                );
            }

            const attachments = Array.from(
                message.attachments.values()
            );

            if (attachments.length < 2) {
                return message.reply(
                    '❌ من فضلك أرسل صورتين مع الأمر!'
                );
            }

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            try {
                const embed = new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({
                        name: `👤 الملف الشخصي لـ ${message.author.username}`,
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

                const sentMessage = await message.reply({
                    embeds: [embed, avatarEmbed]
                });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `dl_${message.channel.id}_${sentMessage.id}`
                            )
                            .setEmoji('📥')
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId(
                                `delete_${message.author.id}`
                            )
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await sentMessage.edit({
                    components: [row]
                });

            } catch (error) {
                console.error('❌ !دمج COMMAND ERROR:');
                console.error(error);
            }
        }

    } catch (error) {
        console.error('❌ MESSAGE HANDLER ERROR:');
        console.error(error);
    }
});

// ===============================
// Login
// ===============================

const TOKEN = process.env.TOKEN;

console.log('🔑 TOKEN موجود؟', !!TOKEN);

if (!TOKEN) {
    console.error(
        '❌ TOKEN غير موجود! تأكد أن TOKEN موجود في Render Environment Variables.'
    );
    process.exit(1);
}

console.log('🔌 جاري الاتصال بـ Discord...');

client.login(TOKEN)
    .then(() => {
        console.log('✅ Login request sent to Discord');
    })
    .catch((error) => {
        console.error('❌ LOGIN FAILED:');
        console.error(error);
    });
