#!/bin/bash
# Script pour démarrage en mode développement avec pgAdmin

echo "🐱 Démarrage de Neko 2.0 (Mode Développement)..."
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant!"
    echo "📝 Copie de .env.example vers .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer avant de continuer."
    echo ""
    exit 1
fi

# Se déplacer dans le dossier docker
cd "$(dirname "$0")/../docker" || exit 1

# Arrêter les containers existants
echo "🛑 Arrêt des containers existants..."
docker-compose -f docker-compose.dev.yml down

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.dev.yml build

# Démarrer les services
echo "🚀 Démarrage des services (mode dev)..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier le statut
echo ""
echo "📊 Statut des services:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Neko 2.0 (DEV) est démarré!"
echo ""
echo "🌐 Interfaces Web:"
echo "  - pgAdmin: http://localhost:5050"
echo "    Email: admin@neko.local"
echo "    Password: admin"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: cd config/docker && docker-compose -f docker-compose.dev.yml logs -f bot"
echo "  - Arrêter: cd config/docker && docker-compose -f docker-compose.dev.yml down"
echo "  - Prisma Studio: cd config/docker && docker-compose -f docker-compose.dev.yml exec bot npx prisma studio"
echo ""
