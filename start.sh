#!/bin/bash
# Script de démarrage Neko 2.0

cd "$(dirname "$0")/config/docker" || exit 1

# Lancer les conteneurs
docker-compose up -d

# Attendre puis afficher les logs
echo "--"
sleep 2
docker-compose logs -f bot
