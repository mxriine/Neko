-- AlterTable
ALTER TABLE "guilds" ADD COLUMN     "birthdayChannel" TEXT,
ADD COLUMN     "birthdayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "birthdayMessage" TEXT NOT NULL DEFAULT '🎉 Joyeux anniversaire {user} ! Tu as maintenant {age} ans ! 🎂';
