const mongoose = require('mongoose');

require('dotenv').config()

const guildSchema = mongoose.Schema({
    id: String,
    name : String,
    prefix: { 'type': String, 'default': process.env.PREFIX },
    logs : { 'type': Boolean, 'default': false },
    logsChannel: { 'type': String, 'default': null },
    announce : { 'type': Boolean, 'default': false },
    announceChannel: { 'type': String, 'default': null },    
});

module.exports = mongoose.model('Guild', guildSchema);