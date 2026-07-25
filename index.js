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

client.once('ready', () => {
    console.log(`🚀 تم تشغيل بوت الذاكرة الذكية والأزرار الدائمة بنجاح: ${client.user.tag}`);
    
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

    if (message.content.startsWith('!دمج')) {
        const attachments = Array.from(message.attachments.values());

        if (attachments.length < 2) {
            return message.reply('❌ من فضلك أرسل صورتين مع الأمر (الصورة الأولى للافتار والثانية للبنر)!');
        }

        // قراءة الصور بشكل منفصل وصحيح وثابت 100%
        const avatarUrl = attachments[0].url;
        const bannerUrl = attachments[1].url;

        try {
            // تصميم الإمبيد الطولي الفخم لدمج البنر والافتار المتحركين سوا
            const embed = new EmbedBuilder()
                .setColor('#111214') // لون ثيم ديسكورد الأسود الجديد لإخفاء الحواف
                .setAuthor({ 
                    name: `👤 الملف الشخصي لـ ${message.author.username}`, 
                    iconURL: avatarUrl 
                })
                .setDescription(`\u200b\n**[\` البنر المتحرك \`]**\n`)
                .setImage(bannerUrl);

            const avatarEmbed = new EmbedBuilder()
                .setColor('#111214')
                .setDescription(`**[\` الافتار الشخصي \`]**`)
                .setImage(avatarUrl);

            // توليد مفتاح قصير وفريد للزر (أقل من 100 حرف لمنع الأخطاء)
            const uniqueKey = `${message.author.id}-${Date.now()}`;
            
            // حفظ الروابط بالذاكرة
            linksStorage.set(uniqueKey, { avatar: avatarUrl, banner: bannerUrl });

            // ربط المفتاح القصير بالأزرار الدائمة (هنا تم التصحيح بالملي)
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`download_${uniqueKey}`)
                    .setEmoji('📥')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`delete_${message.author.id}`)
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.reply({
                embeds: [embed, avatarEmbed],
                components: [row]
            });

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ غير متوقع، تأكد من الملفات المرفوعة.');
        }
    }
});

// ضع توكن البوت اضع_توكن_البوت_هنالخاص بك هنا بالأسفل بالكامل لتشغيل المشروع
const TOKEN = process.env.TOKEN; 
client.login(TOKEN);