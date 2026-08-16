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

// 👑 الآي دي حق حسابك الشخصي لتكون الوحيد الذي يستخدم أمر !دمج اليدوي
const OWNER_ID = '919532578500259850'; 

// 🛑 آي دي الشنلات الحقيقية الخاصة بسيرفرك للتنظيم التلقائي
const AUTO_CHANNELS = [
    '1530724201819013131', 
    '1530724352243404941',
    '1530724806754963456'
];

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل والمقاوم لروابط ديسكورد المؤقتة بنجاح: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // 1. زر التنزيل المطور المقاوم للانتهاء بعد 3 أيام
    if (interaction.customId.startsWith('dl_')) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // تفكيك المعرفات المخزنة بالزر لتوليد روابط جديدة وصازجة بالكامل
            const [_, channelId, messageId] = interaction.customId.split('_');
            
            const targetChannel = await client.channels.fetch(channelId).catch(() => null);
            if (!targetChannel) return interaction.editReply({ content: '❌ تعذر العثور على الشنل الأصلية.' });

            // حيلة ذكية: جلب الرسالة الأصلية من أرشيف الشنل لتحديث روابط المرفقات المنتهية
            const targetMessage = await targetChannel.messages.fetch(messageId).catch(() => null);
            
            let avatarUrl, bannerUrl;
            
            if (targetMessage && targetMessage.embeds.length > 0) {
                // جلب الروابط المتجددة المباشرة الحية من الإمبيد المحفوظ
                avatarUrl = targetMessage.embeds[0].author.iconURL;
                bannerUrl = targetMessage.embeds[0].image.url;
            }

            if (!avatarUrl || !bannerUrl) {
                return interaction.editReply({ content: '❌ عذراً، حُذفت الأصول نهائياً من خوادم ديسكورد ولا يمكن استرجاعها.' });
            }

            const dlAvatar = new AttachmentBuilder(avatarUrl, { name: 'avatar.gif' });
            const dlBanner = new AttachmentBuilder(bannerUrl, { name: 'banner.gif' });

            await interaction.editReply({
                content: '**الافتار والبنر الأصليين جاهزان للتحميل بكامل حركتهما ودقتهما (روابط متجددة):**',
                files: [dlAvatar, dlBanner]
            });
        } catch (error) {
            console.error(error);
            interaction.editReply({ content: '❌ حدث خطأ أثناء محاولة تجديد روابط الصور المنتهية.' });
        }
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

        // تعديل هام: نترك الرسالة الأصلية مخفية في أرشيف البوت ولا نحذفها فوراً لنحافظ على ديمومة الروابط وتجددها تلقائياً
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

            // إرسال التنسيق وحفظ آي دي الشنل والرسالة بالزر لتجديد الروابط للأبد
            const sentMessage = await message.channel.send({ 
                embeds: [embed, avatarEmbed], 
                files: [avatarFile, bannerFile]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`dl_${message.channel.id}_${sentMessage.id}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`delete_${message.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            await sentMessage.edit({ components: [row] });
            await message.delete().catch(() => {});

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

            const sentMessage = await message.reply({ embeds: [embed, avatarEmbed] });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`dl_${message.channel.id}_${sentMessage.id}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`delete_${message.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            await sentMessage.edit({ components: [row] });
        } catch (error) { console.error(error); }
    }
});

const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
