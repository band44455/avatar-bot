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

// 👑 ضع هنا الآي دي (ID) حق حسابك الشخصي في ديسكورد لكي تكون أنت الوحيد الذي يستخدم أمر !دمج اليدوي
const OWNER_ID = '1516152000377520302'; 

// 🛑 ضع هنا آي دي (ID) الشنلات التي تريد من البوت أن ينظمها تلقائياً للأعضاء بدون أوامر
// يمكنك تغيير هذه الأرقام الافتراضية بآي دي الشنلات الحقيقية في سيرفرك (مثل شنل boy أو girl)
const AUTO_CHANNELS = [
    '1530724201819013131', 
    '1530724352243404941',
    '1530724806754963456'
];

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل (الخاص + التلقائي للشنلات) بنجاح: ${client.user.tag}`);
    
    // استقبال ضغطات الأزرار الدائمة 24 ساعة
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        // 1. التحقق من زر التنزيل
        if (interaction.customId.startsWith('download_')) {
            await interaction.deferReply({ ephemeral: true });

            const uniqueKey = interaction.customId.replace('download_', '');
            const data = linksStorage.get(uniqueKey);

            if (!data) {
                return interaction.editReply({ content: '❌ عذراً، تعذر العثور على روابط الصور الأصلية (قد يكون البوت قد أعاد التشغيل مؤخراً).' });
            }

            await interaction.editReply({
                content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما وجودتهما:**',
                files: [data.avatar, data.banner]
            });
        } 
        
        // 2. التحقق من زر الحذف
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

    // 🌟 القسم الأول: التنظيم التلقائي للشنلات بدون أوامر (متاح لكل الأعضاء)
    if (AUTO_CHANNELS.includes(message.channel.id)) {
        const attachments = Array.from(message.attachments.values());

        // إذا أرسل العضو أقل من صورتين، نتجاهل الرسالة تماماً
        if (attachments.length < 2) return;

        // حذف رسالة العضو الأصلية فوراً لتنظيف وتنسيق الشنل
        await message.delete().catch(() => {});

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
        return; // إنهاء دالة المعالجة هنا حتى لا يحدث تداخل مع الأوامر اليدوية
    }

    // 🌟 القسم الثاني: الأمر اليدوي (!دمج) - مقفل ومحصور على حسابك أنت فقط
    if (message.content.startsWith('!دمج')) {
        if (message.author.id !== OWNER_ID) {
            return message.reply('❌ عذراً، هذا الأمر مخصص حصرياً لصاحب البوت فقط ولا يمكنك استخدامه!');
        }

        const attachments = Array.from(message.attachments.values());

        if (attachments.length < 2) {
            return message.reply('❌ من فضلك أرسل صورتين مع الأمر (الصورة الأولى للافتار والثانية للبنر)!');
        }

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

            await message.reply({ embeds: [embed, avatarEmbed], components: [row] });
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ غير متوقع، تأكد من الملفات المرفوعة.');
        }
    }
});

// جلب التوكن السري من إعدادات موقع Render الآمنة
const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
