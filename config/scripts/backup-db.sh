#!/bin/bash
# Script de backup de la base de données PostgreSQL

echo "💾 Backup de la base de données Neko..."

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER=${DB_USER:-neko}
DB_NAME=${DB_NAME:-neko_db}
BACKUP_FILE="${BACKUP_DIR}/neko_backup_${DATE}.sql"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Se déplacer dans le dossier docker
cd "$(dirname "$0")/../docker" || exit 1

# Effectuer le backup
echo "📦 Création du backup: $BACKUP_FILE"
docker-compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "../${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    # Compresser le backup
    gzip "../${BACKUP_FILE}"
    echo "✅ Backup créé avec succès: ${BACKUP_FILE}.gz"
    
    # Afficher la taille
    SIZE=$(du -h "../${BACKUP_FILE}.gz" | cut -f1)
    echo "📊 Taille: $SIZE"
    
    # Nettoyer les anciens backups (garder seulement les 7 derniers)
    echo "🧹 Nettoyage des anciens backups..."
    cd "../${BACKUP_DIR}" || exit 1
    ls -t neko_backup_*.sql.gz | tail -n +8 | xargs -r rm
    
    echo "✅ Backup terminé!"
else
    echo "❌ Erreur lors du backup"
    exit 1
fi
