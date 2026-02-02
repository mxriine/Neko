#!/bin/bash
# Script de restauration de la base de données PostgreSQL

echo "🔄 Restauration de la base de données Neko..."

# Vérifier l'argument
if [ -z "$1" ]; then
    echo "❌ Usage: ./restore-db.sh <fichier_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lh backups/neko_backup_*.sql.gz 2>/dev/null || echo "  Aucun backup trouvé"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier non trouvé: $BACKUP_FILE"
    exit 1
fi

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

DB_USER=${DB_USER:-neko}
DB_NAME=${DB_NAME:-neko_db}

# Confirmation
echo "⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données actuelles!"
echo "Base de données: $DB_NAME"
echo "Backup: $BACKUP_FILE"
read -p "Êtes-vous sûr? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

# Se déplacer dans le dossier docker
cd "$(dirname "$0")/../docker" || exit 1

# Décompresser si nécessaire
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Décompression du backup..."
    TEMP_FILE="/tmp/neko_restore_temp.sql"
    gunzip -c "../$BACKUP_FILE" > "$TEMP_FILE"
else
    TEMP_FILE="../$BACKUP_FILE"
fi

# Restaurer
echo "🔄 Restauration en cours..."
docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restauration terminée avec succès!"
    
    # Nettoyer le fichier temporaire
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm "$TEMP_FILE"
    fi
else
    echo "❌ Erreur lors de la restauration"
    exit 1
fi
