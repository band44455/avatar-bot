const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ApplicationCommandType } = require('discord.js');
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
    console.log(`🚀 تم تشغيل البوت بنظام دمج التطبيقات الذكي: ${client.user.tag}`);
    
    // تسجيل أمر سياق الرسائل غصب عن أنظمة الحجب في ديسكورد لتشتغل الميزة فوراً كـ APP
    await client.application.commands.set([
        {
            name: 'دمج الصور الفخم',
            type: ApplicationCommandType.Message
        }
    ]).catch(console.error);
});

client.on('interactionCreate', async (interaction) => {
    // 1. تشغيل أمر الدمج الذكي من الماوس (Context Menu)
    if (interaction.isMessageContextMenuCommand()) {
        if (interaction.commandName === 'دمج الصور الفخم') {
            await interaction.deferReply({ ephemeral: false });

            const targetMessage = interaction.targetMessage;
            const attachments = Array.from(targetMessage.attachments.values());

            if (attachments.length < 2) {
                return interaction.editReply({ content: '❌ خطأ: هذه الرسالة لا تحتوي على صورتين معاً (الافتار والبنر)!' });
            }

            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

            try {
                const avatarFile = new AttachmentBuilder(avatarUrl, { name: 'avatar.gif' });
                const bannerFile = new AttachmentBuilder(bannerUrl, { name: 'banner.gif' });

                const embed = new EmbedBuilder()
                    .setColor('#111214')
                    .setAuthor({ name: `👤 الملف الشخصي لـ ${targetMessage.author.username}`, iconURL: 'attachment://avatar.gif' })
                    .setDescription(`\u200b\n**[\` البنر المتحرك \`]**\n`)
                    .setImage('attachment://banner.gif');

                const avatarEmbed = new EmbedBuilder()
                    .setColor('#111214')
                    .setDescription(`**[\` الافتار الشخصي \`]**`)
                    .setImage('attachment://avatar.gif');

                const uniqueKey = `${targetMessage.author.id}-${Date.now()}`;
                linksStorage.set(uniqueKey, { avatar: avatarUrl, banner: bannerUrl });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`download_${uniqueKey}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`delete_${targetMessage.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ 
                    embeds: [embed, avatarEmbed], 
                    files: [avatarFile, bannerFile],
                    components: [row] 
                });

                // مسح رسالة الصور القديمة لتنظيف الشنل الفخم
                await targetMessage.delete().catch(() => {});

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ حدث خطأ برميجي أثناء دمج الملفات المرفقة.' });
            }
        }
    }

    // 2. أزرار التحميل والحذف الذكية
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
