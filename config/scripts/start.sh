#!/bin/bash
# Script de démarrage Neko 2.0

cd "$(dirname "$0")/../docker" || exit 1

# Lancer les conteneurs
docker-compose up -d

# Attendre un peu puis afficher les logs
echo "--"
sleep 2
docker-compose logs -f bot

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Installation requise."
    exit 1
fi

echo "✅ Docker détecté"
echo ""

# Se déplacer dans le dossier docker
cd "$(dirname "$0")/../docker" || exit 1

# Arrêter les containers existants
echo "🛑 Arrêt des containers existants..."
docker-compose down

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 5

# Vérifier le statut
echo ""
echo "📊 Statut des services:"
docker-compose ps

echo ""
echo "✅ Neko 2.0 est démarré!"
echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: cd config/docker && docker-compose logs -f bot"
echo "  - Arrêter: cd config/docker && docker-compose down"
echo "  - Redémarrer: cd config/docker && docker-compose restart"
echo "  - Prisma Studio: cd config/docker && docker-compose exec bot npx prisma studio"
echo ""
