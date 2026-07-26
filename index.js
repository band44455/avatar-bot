const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ذاكرة ذكية ومؤقتة لحفظ الروابط بشكل آمن لمنع أخطاء ديسكورد
const linksStorage = new Map();

// 🛑 آي دي الشنلات الحقيقية الخاصة بسيرفرك للتنظيم التلقائي الفوري بدون أوامر
const AUTO_CHANNELS = [
    '1530724201819013131', 
    '1530724352243404941',
    '1530724806754963456'
];

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل بنجاح: ${client.user.tag}`);
    
    // استقبال ضغطات الأزرار الدائمة 24 ساعة
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('download_')) {
            await interaction.deferReply({ ephemeral: true });

            const uniqueKey = interaction.customId.replace('download_', '');
            const data = linksStorage.get(uniqueKey);

            if (!data) {
                return interaction.editReply({ content: '❌ عذراً، تعذر العثور على روابط الصور الأصلية.' });
            }

            await interaction.editReply({
                content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما وجودتهما:**',
                files: [data.avatar, data.banner]
            });
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
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // 🌟 الميزة التلقائية: إذا أرسل العضو أي صور داخل الشنلات الثلاثة المحددة
    if (AUTO_CHANNELS.includes(message.channel.id)) {
        const attachments = Array.from(message.attachments.values());

        // إذا أرسل العضو أقل من صورتين، نتجاهل الرسالة تماماً
        if (attachments.length < 2) return;

        // حذف رسالة العضو الأصلية فوراً لتنظيف وتنسيق الشنل
        await message.delete().catch(() => {});

        // التعديل السليم 100% لقراءة الصور بالترتيب للـ GIF والصور العادية
        const avatarUrl = attachments[0].url;
        const bannerUrl = attachments[1].url;

        try {
            const embed = new EmbedBuilder()
                .setColor('#111214')
                .setAuthor({ name: `👤 الملف الشخصي لـ ${message.author.username}`, iconURL: avatarUrl })
                .setDescription(`\u200b\n**[\` البنر المتحرك \`]**\n`)
                .setImage(bannerUrl);

            const avatarEmbed = new EmbedBuilder()
                .setColor('#111214')
                .setDescription(`**[\` الافتار الشخصي \`]**`)
                .setImage(avatarUrl);

            const uniqueKey = `${message.author.id}-${Date.now()}`;
            linksStorage.set(uniqueKey, { avatar: avatarUrl, banner: bannerUrl });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`download_${uniqueKey}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`delete_${message.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ embeds: [embed, avatarEmbed], components: [row] });
        } catch (error) { console.error(error); }
    }
});

const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
