const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const schema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    cooldowns: {
        rolls: {
            type: Number,
            default: 1
        },
        claims: {
            type: Number,
            default: 1
        },
        gifts: {
            type: Number,
            default: 1
        }
    },
    limits: {
        rolls: {
            type: Number,
            default: 7
        },
        characters: {
            type: Number,
            default: 0
        },
        arts: {
            type: Number,
            default: 0
        }
    },
    banned: {
        channel: [{
            type: String
        }],
        api: [{
            domain: {
                type: String
            }
        }],
        user: [{
            id: {
                type: String
            },
            expires: {
                type: Number
            },
            reason: [{
                text: {
                    type: String
                },
                date: {
                    type: Number
                },
            }]
        }],
        role: [{
            id: {
                type: String
            }
        }]
    }
}, {
    timestamps: true
});

module.exports = model('waifus_guild', schema);
