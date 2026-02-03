#!/bin/bash
# Script de démarrage Neko 2.0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Lancer les conteneurs Docker
cd "$SCRIPT_DIR/config/docker" || exit 1
echo "Démarrage du bot..."
docker-compose up -d --remove-orphans

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 3

# Lancer le web-viewer en arrière-plan
cd "$SCRIPT_DIR/web-viewer" || exit 1
echo ""
echo "🌸 Démarrage de l'interface web..."
echo "Accessible sur http://localhost:3000"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances du web-viewer..."
    npm install
fi

# Démarrer le serveur web en arrière-plan
npm start > ../logs/web-viewer.log 2>&1 &
WEB_PID=$!
echo "Interface web démarrée (PID: $WEB_PID)"

# Retour au dossier docker pour les logs du bot
cd "$SCRIPT_DIR/config/docker" || exit 1
echo ""
echo "✅ Tous les services sont démarrés !"
echo ""
echo " Lancement du bot:"
echo "════════════════════════════════════════"

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $WEB_PID 2>/dev/null
    docker-compose down
    exit 0
}

trap cleanup INT TERM

# Afficher tous les logs disponibles puis suivre les nouveaux
docker-compose logs -f --tail=all bot
