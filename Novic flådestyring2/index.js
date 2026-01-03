{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const \{ Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle \} = require("discord.js");\
const express = require("express");\
const db = require("./db");\
const config = require("./config.json");\
\
const client = new Client(\{ intents: [GatewayIntentBits.Guilds] \});\
const app = express();\
app.use(express.json());\
\
let fleetMessageId;\
\
client.once("ready", async () => \{\
  console.log("FleetBot online");\
\
  const channel = await client.channels.fetch(config.channelId);\
  const msg = await channel.send(\{\
    embeds: [new EmbedBuilder().setTitle("\uc0\u55357 \u56980  Novic Politiets Fl\'e5destyring")],\
    components: [buttons()]\
  \});\
  fleetMessageId = msg.id;\
\});\
\
function buttons() \{\
  return new ActionRowBuilder().addComponents(\
    new ButtonBuilder().setCustomId("start").setLabel("Start patrulje").setStyle(ButtonStyle.Success),\
    new ButtonBuilder().setCustomId("stop").setLabel("Slut patrulje").setStyle(ButtonStyle.Danger),\
    new ButtonBuilder().setCustomId("active").setLabel("Aktiv").setStyle(ButtonStyle.Primary),\
    new ButtonBuilder().setCustomId("busy").setLabel("Optaget").setStyle(ButtonStyle.Secondary)\
  );\
\}\
\
client.on("interactionCreate", async i => \{\
  if (!i.isButton()) return;\
  if (!i.member.roles.cache.has(config.policeRoleId))\
    return i.reply(\{ content: "\uc0\u10060  Kun politi", ephemeral: true \});\
\
  if (i.customId === "start") \{\
    db.run(`INSERT OR REPLACE INTO patrols VALUES (?, ?)`, [`Patrulje`, i.user.id]);\
    db.run(`INSERT OR REPLACE INTO members VALUES (?, ?, ?)`, [i.user.id, "Patrulje", "ACTIVE"]);\
  \}\
\
  if (i.customId === "stop") \{\
    db.run(`DELETE FROM members WHERE discord = ?`, [i.user.id]);\
  \}\
\
  if (i.customId === "active")\
    db.run(`UPDATE members SET status = 'ACTIVE' WHERE discord = ?`, [i.user.id]);\
\
  if (i.customId === "busy")\
    db.run(`UPDATE members SET status = 'BUSY' WHERE discord = ?`, [i.user.id]);\
\
  await updateEmbed();\
  await i.reply(\{ content: "\uc0\u9989  Opdateret", ephemeral: true \});\
\});\
\
async function updateEmbed() \{\
  const embed = new EmbedBuilder().setTitle("\uc0\u55357 \u56980  Novic Politiets Fl\'e5destyring");\
\
  db.all(`SELECT * FROM members`, (err, rows) => \{\
    if (!rows.length) embed.setDescription("Ingen aktive patruljer");\
\
    rows.forEach(m => \{\
      const status = m.status === "ACTIVE" ? "\uc0\u55357 \u57314  Aktiv" : m.status === "BUSY" ? "\u55357 \u57313  Optaget" : "\u55357 \u56628  Offline";\
      embed.addFields(\{ name: `<@$\{m.discord\}>`, value: status \});\
    \});\
\
    client.channels.fetch(config.channelId).then(c =>\
      c.messages.fetch(fleetMessageId).then(m =>\
        m.edit(\{ embeds: [embed], components: [buttons()] \})\
      )\
    );\
  \});\
\}\
\
app.post("/fivem/leave", (req, res) => \{\
  db.run(`UPDATE members SET status = 'OFFLINE' WHERE discord = ?`, [req.body.discord]);\
  updateEmbed();\
  res.sendStatus(200);\
\});\
\
app.listen(config.port);\
client.login(config.token);}