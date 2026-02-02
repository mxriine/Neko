const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes API
app.get('/api/guilds', async (req, res) => {
  try {
    const guilds = await prisma.guild.findMany({
      include: {
        users: {
          take: 5,
          orderBy: { level: 'desc' }
        }
      }
    });
    res.json(guilds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        warnings: true
      },
      orderBy: { level: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalGuilds = await prisma.guild.count();
    const totalUsers = await prisma.user.count();
    const totalWarnings = await prisma.warning.count();
    
    res.json({
      totalGuilds,
      totalUsers,
      totalWarnings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update guild
app.put('/api/guilds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const guild = await prisma.guild.update({
      where: { id },
      data
    });
    
    res.json(guild);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete guild
app.delete('/api/guilds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.guild.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:discordId/:guildId', async (req, res) => {
  try {
    const { discordId, guildId } = req.params;
    const data = req.body;
    
    const user = await prisma.user.update({
      where: { 
        discordId_guildId: {
          discordId,
          guildId
        }
      },
      data
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:discordId/:guildId', async (req, res) => {
  try {
    const { discordId, guildId } = req.params;
    
    await prisma.user.delete({
      where: { 
        discordId_guildId: {
          discordId,
          guildId
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌸 Interface DB disponible sur http://localhost:${PORT}`);
});
