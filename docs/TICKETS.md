# 🎫 Système de Tickets

## Installation

Le système de tickets est déjà intégré au bot. Il suffit de le configurer.

## Configuration

### 1. Configurer le système

Utilisez la commande `/setup` avec le type `tickets` :

```
/setup type:Tickets salon:#tickets categorie:Support role_support:@Support logs:#ticket-logs
```

**Paramètres :**
- `type` : Sélectionner "Tickets"
- `salon` : Salon où le panel sera affiché
- `categorie` : Catégorie où les tickets seront créés (REQUIS pour tickets)
- `role_support` (optionnel) : Rôle du support qui sera mentionné
- `logs` (optionnel) : Salon des logs de tickets

Cette commande va :
- Enregistrer la configuration dans la base de données
- Envoyer un panel stylisé avec un menu de sélection

### 2. Utilisation

**Pour les utilisateurs :**
1. Cliquer sur le menu déroulant "📩 Ouvrir un ticket"
2. Sélectionner la raison du ticket :
   - ⚠️ Signaler le comportement de quelqu'un
   - 😰 Quelqu'un me met mal à l'aise
   - 🤔 Je suis confus sur le fonctionnement du serveur
   - ⚙️ Je souhaite signaler un bug
   - 🤝 Je souhaite rejoindre l'équipe
   - 💬 Autre raison
3. Un salon privé est créé automatiquement
4. Le support est notifié
5. L'utilisateur peut expliquer son problème

**Pour le staff :**
- `/ticket add @membre` : Ajouter un membre au ticket
- `/ticket remove @membre` : Retirer un membre du ticket
- Bouton "🔒 Fermer" : Fermer le ticket (avec confirmation)
- Bouton "🗑️ Supprimer" : Supprimer définitivement le ticket
- Bouton "🔓 Réouvrir" : Réouvrir un ticket fermé

## Design V1.0

Le système utilise maintenant le design de la version 1.0 :

### Panel
- **Titre :** ・HELP SUPPORT
- **Description :** "Comment pouvons-nous vous aider ?"
- **Image :** Banner personnalisé
- **Menu :** SelectMenu avec 6 options différentes

### Ticket
- **Titre :** 📨 TICKET | [username]
- **Description :** Affiche la raison sélectionnée
- **Boutons :** 3 boutons (Fermer, Réouvrir, Supprimer)

## Fonctionnalités

### Création de ticket
- Vérification de la limite (1 ticket par utilisateur par défaut)
- Création d'un salon privé dans la catégorie configurée
- Permissions automatiques (créateur + support + bot)
- Mention du rôle support
- Embed d'accueil avec instructions

### Fermeture de ticket
- Demande de confirmation
- Génération d'un transcript (100 derniers messages)
- Masquage du salon pour le créateur
- Notification par DM au créateur
- Log dans le salon de logs avec transcript
- Possibilité de réouverture par le staff

### Suppression de ticket
- Disponible uniquement pour les tickets fermés
- Demande de confirmation
- Sauvegarde du transcript dans les logs
- Suppression du salon après 5 secondes
- Action irréversible

### Réouverture de ticket
- Disponible uniquement pour le staff
- Restaure les permissions du créateur
- Renomme le salon (retire "closed-")
- Notification par DM au créateur
- Log de réouverture

## Permissions requises

Le bot nécessite ces permissions :
- `ManageChannels` : Créer/supprimer des salons
- `ManageRoles` : Gérer les permissions des salons
- `ViewChannel`, `SendMessages` : Communiquer dans les tickets
- `AttachFiles` : Envoyer les transcripts

## Limites

- 1 ticket ouvert par utilisateur (configurable dans `bot.config.js`)
- Transcripts limités aux 100 derniers messages
- Les tickets doivent être fermés avant d'être supprimés

## Base de données

### Guild
```prisma
ticketEnabled     Boolean
ticketChannel     String?  // ID du salon du panel
ticketCategory    String?  // ID de la catégorie
ticketRoleSupport String?  // ID du rôle support
ticketLogs        String?  // ID du salon de logs
```

### User
```prisma
hasTicket        Boolean
ticketMessageId  String?  // ID du message du ticket
```

## Modification de la limite

Dans `config/bot.config.js` :

```javascript
tickets: {
    enabled: true,
    maxOpenTickets: 1,  // Modifier ici
},
```

## Logs

Toutes les actions sont enregistrées :
- ✅ Création : utilisateur, timestamp
- 🔒 Fermeture : qui a fermé, transcript
- 🔓 Réouverture : qui a rouvert
- 🗑️ Suppression : qui a supprimé, transcript final

## Notifications

Les utilisateurs reçoivent des DM pour :
- Fermeture de leur ticket
- Réouverture de leur ticket

Note : Si les DMs sont désactivés, l'action s'effectue quand même.
