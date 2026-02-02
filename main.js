// main.js - Neko 2.0
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const config = require("./config/bot.config");
const { createPrismaClient, testConnection, disconnectPrisma } = require("./config/database");
const Logger = require("./src/Loaders/Logger");
const registerDbFunctions = require("./src/Loaders/Functions");
const loadEvents = require("./src/Loaders/loadEvents");
const loadCommands = require("./src/Loaders/loadCommands");
const loadButtons = require("./src/Loaders/loadButtons");
const loadSelects = require("./src/Loaders/loadSelects");

// ——————————— Client Discord ———————————

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.User,
  ],
});

// ——————————— Prisma Client ———————————

const prisma = createPrismaClient();

// Attacher Prisma et config au client Discord
client.prisma = prisma;
client.config = config;

// Collections pour handlers
client.commands = new Collection();
client.buttons = new Collection();
client.selects = new Collection();

// Injecte getGuild / createGuild / getUser / etc. avec Prisma
registerDbFunctions(client);

// ——————————— Démarrage ———————————

async function start() {
  try {
    // 1) Connexion PostgreSQL via Prisma
    if (!config.database.url) {
      throw new Error("DATABASE_URL manquant dans le .env");
    }

    const connected = await testConnection(prisma);
    if (!connected) {
      throw new Error("Impossible de se connecter à PostgreSQL");
    }

    // 2) Loaders
    await loadEvents(client);
    await loadCommands(client);
    await loadButtons(client);
    await loadSelects(client);

    // 3) Login Discord
    if (!config.bot.token) {
      throw new Error("TOKEN manquant dans le .env");
    }

    await client.login(config.bot.token);
  } catch (err) {
    Logger.error(`Échec au démarrage: ${err.stack || err.message || err}`);
    await disconnectPrisma(prisma);
    process.exit(1);
  }
}

// ——————————— Gestion erreurs globales ———————————

process.on("unhandledRejection", (reason) => {
  Logger.error(`unhandledRejection: ${reason?.stack || reason}`);
});

process.on("uncaughtException", (err) => {
  Logger.error(`uncaughtException: ${err?.stack || err}`);
});

process.on("warning", (warning) => {
  Logger.warn(`warning: ${warning?.stack || warning}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  Logger.warn("SIGINT reçu, fermeture gracieuse...");
  await disconnectPrisma(prisma);
  process.exit(0);
});

process.on("SIGTERM", async () => {
  Logger.warn("SIGTERM reçu, fermeture gracieuse...");
  await disconnectPrisma(prisma);
  process.exit(0);
});

// Lancer
start();
