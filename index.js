const TOKEN = process.env.TOKEN;

console.log(`🔑 TOKEN موجود؟ ${!!TOKEN}`);

if (!TOKEN) {
    console.error('❌ TOKEN غير موجود في Environment Variables');
    process.exit(1);
}

client.on('error', (error) => {
    console.error('❌ Discord Client Error:', error);
});

client.on('shardError', (error) => {
    console.error('❌ Discord Shard Error:', error);
});

client.on('debug', (info) => {
    console.log('🔍 Discord Debug:', info);
});

client.on('ready', () => {
    console.log(`✅ اتصل البوت بديسكورد بنجاح: ${client.user.tag}`);
});

console.log('🔌 جاري الاتصال بـ Discord...');

client.login(TOKEN).catch((error) => {
    console.error('❌ فشل تسجيل الدخول إلى Discord:');
    console.error(error);
});
