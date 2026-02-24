require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "genkey") return;

  // 🔐 Checagem de cargo
  if (!interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID)) {
    return interaction.reply({
      content: "❌ Without permission.",
      ephemeral: true
    });
  }

  const days = interaction.options.getInteger("days");

  await interaction.deferReply({ ephemeral: true });

  try {
    // ✅ URL CORRETA (GET + QUERY STRING)
const url =
  `https://keyauth.win/api/seller/` +
  `?sellerkey=${process.env.KEYAUTH_SELLER_KEY}` +
  `&type=add` +
  `&expiry=${days}` +
  `&level=1` +
  `&amount=1` +
  `&format=text`;

    const response = await axios.get(url);

    console.log("🔴 KEYAUTH RESPONSE 🔴", response.data);

    // ❌ Se não vier uma key válida
    if (typeof response.data !== "string" || response.data.length < 10) {
      return interaction.editReply("❌ Erro ao gerar key.");
    }

    const key = response.data.trim();

    // 🔑 Resposta privada
    await interaction.editReply({
      content: `🔑 **Generated key (${days} days):**\n\`\`\`${key}\`\`\``
    });

    // 📜 Log embed
    const embed = new EmbedBuilder()
      .setTitle("🔐 New Key Generated")
      .setColor(0x2f3136)
      .addFields(
        { name: "Admin", value: interaction.user.tag, inline: true },
        { name: "Duration", value: `${days} dias`, inline: true },
        { name: "Key", value: `\`${key}\`` }
      )
      .setTimestamp();

    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      logChannel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error("❌ ERRO API:", err.response?.data || err.message);
    interaction.editReply("❌ Erro in API.");
  }
});

client.login(process.env.DISCORD_TOKEN);