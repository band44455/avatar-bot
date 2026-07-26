const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const linksStorage = new Map();

// 🛑 آي دي الشنلات الحقيقية الخاصة بسيرفرك للتنظيم التلقائي
const AUTO_CHANNELS = [
    '1530724201819013131', 
    '1530724352243404941',
    '1530724806754963456'
];

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الدمج الشامل المصلح بنجاح: ${client.user.tag}`);
    
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

    if (AUTO_CHANNELS.includes(message.channel.id)) {
        const attachments = Array.from(message.attachments.values());

        if (attachments.length < 2) return;

        // تأجيل الحذف ثانية واحدة لضمان قراءة الملفات بامتياز
        setTimeout(async () => {
            await message.delete().catch(() => {});
        }, 1000);

        try {
            // حل المشكلة: جلب وتحضير الملفات المرفوعة كـ Attachments حقيقية داخل ديسكورد
            const avatarFile = new AttachmentBuilder(attachments[0].url, { name: 'avatar.gif' });
            const bannerFile = new AttachmentBuilder(attachments[1].url, { name: 'banner.gif' });

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
            linksStorage.set(uniqueKey, { avatar: attachments[0].url, banner: attachments[1].url });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`download_${uniqueKey}`).setEmoji('📥').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`delete_${message.author.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
            );

            // إرسال الإمبيد مدمجاً معه الملفات المرفوعة مباشرة لتظهر وتتحرك فوراً
            await message.channel.send({ 
                embeds: [embed, avatarEmbed], 
                files: [avatarFile, bannerFile],
                components: [row] 
            });

        } catch (error) { 
            console.error(error); 
        }
    }
});

const TOKEN = process.env.TOKEN; 
client.login(TOKEN);
