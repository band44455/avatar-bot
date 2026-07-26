const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// فتح بورت وهمي لإقناع موقع Render أن البوت عبارة عن موقع ويب شغال ولا يطفئه أبداً
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running online 24/7!\n');
}).listen(process.env.PORT || 3000);

// ذاكرة ذكية وثابتة لحفظ روابط الصور الأصلية بكفاءة عالية ومنع ضياعها
const linksStorage = new Map();

// 👑 الآي دي حق حسابك الشخصي لتكون الوحيد الذي يستخدم أمر !دمج اليدوي
const OWNER_ID = '919532578500259850'; 

// 🛑 آي دي الشنلات الحقيقية الخاصة بسيرفرك للتنظيم التلقائي
const AUTO_CHANNELS = [
    '1530724201819013131', 
    '1530724352243404941',
    '1530724806754963456'
];

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل الناجح: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // 1. زر التنزيل الأصلي والمضمون لعرض الصور كاملة ومكشوفة
    if (interaction.customId.startsWith('download_')) {
        await interaction.deferReply({ ephemeral: true });

        const uniqueKey = interaction.customId.replace('download_', '');
        const data = linksStorage.get(uniqueKey);

        if (!data) {
            return interaction.editReply({ content: '❌ عذراً، تعذر العثور على روابط الصور الأصلية (جرب ارفع صور جديدة بالشنل).' });
        }

        // إرسال الروابط الأصلية المباشرة كملفات لتظهر وتتحرك فوراً بالشات نفس النسخة الأولى بالضبط
        await interaction.editReply({
            content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما ودقتهما:**',
            files: [data.avatar, data.banner]
        }).catch(() => {});
    } 
    // 2. زر الحذف الذكي
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

    // 🌟 القسم الأول: التنظيم التلقائي للشنلات
    if (AUTO_CHANNELS.includes(message.channel.id)) {
        const attachments = Array.from(message.attachments.values());

        if (attachments.length < 2) return;

        setTimeout(async () => {
            await message.delete().catch(() => {});
        }, 1000);

        try {
            const avatarUrl = attachments[0].url;
            const bannerUrl = attachments[1].url;

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

            // حفظ الروابط بذاكرة السيرفر باستخدام مفتاح فريد
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

        } catch (error) { console.error(error); }
        return;
    }

    // 🌟 القسم الثاني: الأمر اليدوي (!دمج)
    if (message.content.startsWith('!دمج')) {
        if (message.author.id !== OWNER_ID) {
            return message.reply('❌ عذراً، هذا الأمر مخصص حصرياً لصاحب البوت فقط!');
        }

        const attachments = Array.from(message.attachments.values());

        if (attachments.length < 2) {
            return message.reply('❌ من فضلك أرسل صورتين مع الأمر!');
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
        } catch (error) { console.error(error); }
    }
});

const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
