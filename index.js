const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// فتح بورت وهمي ثابت لحماية البوت من الإغلاق في Render
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running online 24/7!\n');
}).listen(process.env.PORT || 3000);

const linksStorage = new Map();

client.once('ready', async () => {
    console.log(`🚀 تم تشغيل البوت بنظام الأمر المائل الذكي للتطبيقات: ${client.user.tag}`);
    
    // تسجيل الأمر المائل المباشر ليعمل كـ APP في السيرفر كاملاً
    await client.application.commands.set([
        {
            name: 'دمج',
            description: 'دمج الافتار والبنر المسموحين بالتنسيق الطولي الفخم',
            options: [
                {
                    name: 'الافتار',
                    description: 'ارفع صورة الافتار الشخصي الشخصي هنا',
                    type: ApplicationCommandOptionType.Attachment,
                    required: true
                },
                {
                    name: 'البنر',
                    description: 'ارفع صورة البنر المتحرك أو الثابت هنا',
                    type: ApplicationCommandOptionType.Attachment,
                    required: true
                }
            ]
        }
    ]).catch(console.error);
});

client.on('interactionCreate', async (interaction) => {
    // 1. تشغيل الأمر المائل المطور /دمج
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'دمج') {
            await interaction.deferReply({ ephemeral: false });

            const avatarAttachment = interaction.options.getAttachment('الافتار');
            const bannerAttachment = interaction.options.getAttachment('البنر');

            const avatarUrl = avatarAttachment.url;
            const bannerUrl = bannerAttachment.url;

            try {
                const avatarFile = new AttachmentBuilder(avatarUrl, { name: 'avatar.gif' });
                const bannerFile = new AttachmentBuilder(bannerUrl, { name: 'banner.gif' });

                const embed = new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({ name: `👤 الملف الشخصي لـ ${interaction.user.username}`, iconURL: 'attachment://avatar.gif' })
                    .setDescription(`\u200b\n**[\` البنر المتحرك \`]**\n`)
                    .setImage('attachment://banner.gif');

                const avatarEmbed = new EmbedBuilder()
                    .setColor('#111214')
                    .setDescription(`**[\` الافتار الشخصي \`]**`)
                    .setImage('attachment://avatar.gif');

                const uniqueKey = `${interaction.user.id}-${Date.now()}`;
                linksStorage.set(uniqueKey, { avatar: avatarUrl, banner: bannerUrl });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`download_${uniqueKey}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`delete_${interaction.user.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ 
                    embeds: [embed, avatarEmbed], 
                    files: [avatarFile, bannerFile],
                    components: [row] 
                });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ حدث خطأ برميجي أثناء دمج الملفات المرفقة.' });
            }
        }
    }

    // 2. أزرار التحميل والحذف الذكية للأبد
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('download_')) {
            await interaction.deferReply({ ephemeral: true });

            const uniqueKey = interaction.customId.replace('download_', '');
            const data = linksStorage.get(uniqueKey);

            if (!data) {
                return interaction.editReply({ content: '❌ عذراً، انتهت صلاحية روابط هذه الصور من خوادم ديسكورد.' });
            }

            try {
                const dlAvatar = new AttachmentBuilder(data.avatar, { name: 'avatar.gif' });
                const dlBanner = new AttachmentBuilder(data.banner, { name: 'banner.gif' });

                await interaction.editReply({
                    content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما ودقتهما التامة:**',
                    files: [dlAvatar, dlBanner]
                });
            } catch (error) {
                console.error(error);
                interaction.editReply({ content: '❌ حدث خطأ أثناء تحميل الصور.' });
            }
        } 
        else if (interaction.customId.startsWith('delete_')) {
            const ownerId = interaction.customId.replace('delete_', '');
            if (interaction.user.id === ownerId) {
                await interaction.message.delete().catch(() => {});
            } else {
                await interaction.reply({ content: '❌ لا يمكنك حذف هذه المعاينة لأنك لست صاحب الأمر!', ephemeral: true });
            }
        }
    }
});

const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
