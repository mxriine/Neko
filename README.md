# Neko 2.0 - Bot Discord

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.x-white)

Bot Discord multifonctionnel avec système de niveaux, modération, tickets et plus encore.

## Nouvelles Fonctionnalités v2.0

- ✅ **PostgreSQL** au lieu de MongoDB
- ✅ **Prisma ORM** pour la gestion de base de données
- ✅ **Docker** et Docker Compose pour un déploiement facile
- ✅ **Architecture améliorée** et moderne
- ✅ **Graceful shutdown** pour éviter la perte de données
- ✅ **Health checks** intégrés
- ✅ **Type-safe** avec Prisma

## Prérequis

- **Node.js** 20.x ou supérieur
- **Docker** et **Docker Compose** (pour le déploiement Docker)
- **PostgreSQL** 16 (si installation sans Docker)
- Un **Bot Discord** avec token


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

## Sécurité

- ✅ Ne jamais commit le fichier `.env`
- ✅ Utiliser des mots de passe forts pour PostgreSQL
- ✅ Restreindre les accès au réseau Docker
- ✅ Mettre à jour régulièrement les dépendances

## Licence

ISC

## Auteur

**Ma'**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

---

**Bon développement avec Neko 2.0!**
