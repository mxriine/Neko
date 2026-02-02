# 🐱 Neko 2.0 - Bot Discord

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.x-white)

Bot Discord multifonctionnel avec système de niveaux, modération, tickets et plus encore.

## 🚀 Nouvelles Fonctionnalités v2.0

- ✅ **PostgreSQL** au lieu de MongoDB
- ✅ **Prisma ORM** pour la gestion de base de données
- ✅ **Docker** et Docker Compose pour un déploiement facile
- ✅ **Architecture améliorée** et moderne
- ✅ **Graceful shutdown** pour éviter la perte de données
- ✅ **Health checks** intégrés
- ✅ **Type-safe** avec Prisma

## 📋 Prérequis

- **Node.js** 20.x ou supérieur
- **Docker** et **Docker Compose** (pour le déploiement Docker)
- **PostgreSQL** 16 (si installation sans Docker)
- Un **Bot Discord** avec token

## 🛠️ Installation

### Option 1: Avec Docker (Recommandé) 🐳

1. **Cloner le repository**
```bash
cd Neko2.0
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env` et remplir:
```env
TOKEN=votre_token_discord
PREFIX=!
DB_USER=neko
DB_PASSWORD=votre_mot_de_passe_securise
DB_NAME=neko_db
```

3. **Démarrer avec Docker Compose**
```bash
# Méthode 1: Utiliser le script
chmod +x config/scripts/start.sh
./config/scripts/start.sh

# Méthode 2: Commandes directes
cd config/docker
docker-compose up -d

# Voir les logs
docker-compose logs -f bot

# Arrêter les containers
docker-compose down
```

4. **Appliquer les migrations Prisma**
```bash
# Les migrations sont appliquées automatiquement au démarrage
# Mais vous pouvez les lancer manuellement:
cd config/docker
docker-compose exec bot npx prisma migrate deploy --schema=./config/prisma/schema.prisma
```

### Option 2: Installation Locale 💻

1. **Cloner et installer les dépendances**
```bash
cd Neko2.0
npm install
```

2. **Configurer PostgreSQL**
```bash
# Créer la base de données
createdb neko_db

# Ou avec psql:
psql -U postgres
CREATE DATABASE neko_db;
\q
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env`:
```env
TOKEN=votre_token_discord
PREFIX=!
DATABASE_URL=postgresql://user:password@localhost:5432/neko_db?schema=public
```

4. **Générer le client Prisma et migrer**
```bash
npx prisma generate --schema=./config/prisma/schema.prisma
npx prisma migrate dev --name init --schema=./config/prisma/schema.prisma
```

5. **Démarrer le bot**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📦 Scripts NPM

```bash
npm start                 # Démarrer le bot
npm run dev               # Mode développement avec nodemon

# Prisma
npm run prisma:generate   # Générer le client Prisma
npm run prisma:migrate    # Créer une nouvelle migration
npm run prisma:deploy     # Appliquer les migrations
npm run prisma:studio     # Interface graphique Prisma

# Docker (Production)
npm run docker:build      # Construire l'image Docker
npm run docker:up         # Démarrer les containers
npm run docker:down       # Arrêter les containers
npm run docker:logs       # Voir les logs du bot
npm run docker:restart    # Redémarrer le bot

# Docker (Développement)
npm run docker:dev        # Démarrer en mode dev avec pgAdmin
npm run docker:dev-down   # Arrêter le mode dev
```

## 🔧 Scripts Bash

```bash
# Production
./config/scripts/start.sh        # Démarrer Neko en production

# Développement
./config/scripts/dev.sh          # Démarrer avec pgAdmin

# Base de données
./config/scripts/backup-db.sh    # Créer un backup
./config/scripts/restore-db.sh <fichier>  # Restaurer un backup
```

## 🗄️ Structure de la Base de Données

### Modèles Prisma

**Guild** - Configuration par serveur
- Configuration des logs
- Messages de bienvenue/départ
- Système de tickets
- Système de niveaux
- Modération

**User** - Données utilisateur par serveur
- Système XP et niveaux
- Warnings
- Tickets
- Statistiques

**Warning** - Avertissements
- Raison
- Modérateur
- Date

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `TOKEN` | Token du bot Discord | - |
| `PREFIX` | Préfixe des commandes | `!` |
| `DATABASE_URL` | URL PostgreSQL | - |
| `NODE_ENV` | Environnement | `development` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `DB_USER` | Utilisateur PostgreSQL | `neko` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | - |
| `DB_NAME` | Nom de la base | `neko_db` |

## 📊 Interface Prisma Studio

Pour visualiser et modifier les données:

```bash
# Localement
npm run prisma:studio

# Avec Docker
cd config/docker
docker-compose exec bot npx prisma studio
```

Ouvre automatiquement: `http://localhost:5555`

## 🔄 Migration depuis Neko 1.0

### Script de migration (à venir)

Un script de migration MongoDB → PostgreSQL sera fourni pour migrer vos données existantes.

### Principales différences

| Aspect | Neko 1.0 | Neko 2.0 |
|--------|----------|----------|
| BDD | MongoDB | PostgreSQL |
| ORM | Mongoose | Prisma |
| Déploiement | Manuel | Docker |
| Types | Faible | Fort (Prisma) |
| Migrations | Manuelles | Automatiques |

## 🐛 Dépannage

### Le bot ne se connecte pas
```bash
# Vérifier les logs
cd config/docker
docker-compose logs bot

# Vérifier la base de données
docker-compose exec postgres psql -U neko -d neko_db
```

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL est démarré
cd config/docker
docker-compose ps

# Redémarrer les services
docker-compose restart
```

### Réinitialiser la base de données
```bash
# ATTENTION: Supprime toutes les données!
cd config/docker
docker-compose down -v
docker-compose up -d
```

## 📁 Structure du Projet

```
Neko2.0/
├── config/                    # 📁 TOUTE LA CONFIGURATION
│   ├── bot.config.js         # Configuration du bot
│   ├── database.js           # Configuration PostgreSQL
│   │
│   ├── prisma/               # 🗄️ Base de données
│   │   ├── schema.prisma     # Schéma
│   │   └── migrations/       # Migrations SQL
│   │
│   ├── docker/               # 🐳 Docker
│   │   ├── Dockerfile        # Image du bot
│   │   ├── docker-compose.yml      # Production
│   │   └── docker-compose.dev.yml  # Développement
│   │
│   └── scripts/              # 🛠️ Scripts utilitaires
│       ├── start.sh          # Démarrage production
│       ├── dev.sh            # Démarrage développement
│       ├── migrate.js        # Migration MongoDB → PostgreSQL
│       ├── backup-db.sh      # Backup base de données
│       └── restore-db.sh     # Restauration backup
│
├── src/                      # 💻 CODE SOURCE
│   ├── Commands/             # Commandes du bot
│   ├── Events/               # Événements Discord
│   ├── Buttons/              # Boutons interactifs
│   ├── Selects/              # Menus sélection
│   ├── Assets/               # Assets (images, GIFs, etc.)
│   └── Loaders/              # Chargeurs de modules
│
├── main.js                   # Point d'entrée
├── package.json              # Dépendances
└── .env                      # Variables d'environnement
```

## 🔐 Sécurité

- ✅ Ne jamais commit le fichier `.env`
- ✅ Utiliser des mots de passe forts pour PostgreSQL
- ✅ Restreindre les accès au réseau Docker
- ✅ Mettre à jour régulièrement les dépendances

## 📝 Licence

ISC

## 👤 Auteur

**Ma'**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

---

**Bon développement avec Neko 2.0! 🐱**
