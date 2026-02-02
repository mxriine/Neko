-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "logsChannel" TEXT,
    "logsMessages" BOOLEAN NOT NULL DEFAULT false,
    "logsModeration" BOOLEAN NOT NULL DEFAULT false,
    "logsJoins" BOOLEAN NOT NULL DEFAULT false,
    "logsLeaves" BOOLEAN NOT NULL DEFAULT false,
    "logsRoles" BOOLEAN NOT NULL DEFAULT false,
    "logsChannels" BOOLEAN NOT NULL DEFAULT false,
    "logsBans" BOOLEAN NOT NULL DEFAULT false,
    "logsBoosts" BOOLEAN NOT NULL DEFAULT false,
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeChannel" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Bienvenue {user} 👋',
    "welcomeImage" TEXT,
    "byeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "byeChannel" TEXT,
    "byeMessage" TEXT NOT NULL DEFAULT '{user} nous a quitté… 😢',
    "byeImage" TEXT,
    "announcesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcesChannel" TEXT,
    "ticketEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ticketChannel" TEXT,
    "ticketCategory" TEXT,
    "ticketMessage" TEXT,
    "ticketRoleSupport" TEXT,
    "ticketLogs" TEXT,
    "levelEnabled" BOOLEAN NOT NULL DEFAULT false,
    "levelChannel" TEXT,
    "levelMessage" TEXT NOT NULL DEFAULT '🎉 Bravo {user} ! Tu passes au niveau {level} !',
    "levelMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "modEnabled" BOOLEAN NOT NULL DEFAULT false,
    "modRole" TEXT,
    "modLogChannel" TEXT,
    "autoModEnabled" BOOLEAN NOT NULL DEFAULT false,
    "antiSpam" BOOLEAN NOT NULL DEFAULT false,
    "antiLink" BOOLEAN NOT NULL DEFAULT false,
    "autoRoleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRoleId" TEXT,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthday" TEXT,
    "hasTicket" BOOLEAN NOT NULL DEFAULT false,
    "ticketMessageId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "nextLevel" INTEGER NOT NULL DEFAULT 300,
    "rank" TEXT,
    "inGuild" BOOLEAN NOT NULL DEFAULT true,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "moderator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_guildId_idx" ON "users"("guildId");

-- CreateIndex
CREATE INDEX "users_discordId_idx" ON "users"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "users_discordId_guildId_key" ON "users"("discordId", "guildId");

-- CreateIndex
CREATE INDEX "warnings_userId_idx" ON "warnings"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
