const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// فتح بورت وهمي ثابت لحماية البوت من الإغلاق في Render ليبقى صاحي 24 ساعة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running online 24/7!\n');
}).listen(process.env.PORT || 3000);

const linksStorage = new Map();

// 👑 الآي دي (ID) حق حسابك الشخصي الحقيقي
const OWNER_ID = '919532578500259850'; 

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل بنجاح بأعلى كفاءة استقرار: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

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
                content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما ودقتهما:**',
                files: [dlAvatar, dlBanner]
            });
        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ حدث خطأ أثناء جلب الصور من السيرفر.' });
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
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // لقط المرفقات تلقائياً من أي شات بالسيرفر غصب عن نظام التقييد 🛡️
    const attachments = Array.from(message.attachments.values());

    if (attachments.length >= 2) {
        const avatarUrl = attachments[0].url;
        const bannerUrl = attachments[1].url;

        try {
            const avatarFile = new AttachmentBuilder(avatarUrl, { name: 'avatar.gif' });
            const bannerFile = new AttachmentBuilder(bannerUrl, { name: 'banner.gif' });

            const embed = new EmbedBuilder()
                .setColor('#111214')
                .setAuthor({ name: `👤 الملف الشخصي لـ ${message.author.username}`, iconURL: 'attachment://avatar.gif' })
                .setDescription(`\u200b\n**[\` البنر المتحرك \`]**\n`)
                .setImage('attachment://banner.gif');

            const avatarEmbed = new EmbedBuilder()
                .setColor('#111214')
                .setDescription(`**[\` الافتار الشخصي \`]**`)
                .setImage('attachment://avatar.gif');

            const uniqueKey = `${message.author.id}-${Date.now()}`;
            linksStorage.set(uniqueKey, { avatar: avatarUrl, banner: bannerUrl });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`download_${uniqueKey}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`delete_${message.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ 
                embeds: [embed, avatarEmbed], 
                files: [avatarFile, bannerFile],
                components: [row] 
            });

            await message.delete().catch(() => {});

        } catch (error) { console.error(error); }
    }
});

// 🔒 حماية أبدية ضد الحرق: الكود يسحب التوكن من متغيرات البيئة المخفية في Render
client.login(process.env.TOKEN);
