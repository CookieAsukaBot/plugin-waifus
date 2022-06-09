const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const schema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    guild: {
        type: String,
        required: true
    },
    user: {
        id: {
            type: String,
            required: true
        },
        tags: [{
            type: String
        }],
        claimedAt: {
            type: Date,
            default: Date.now
        },
    },
    metadata: {
        domain: {
            type: String
        },
        id: {
            type: String
        },
        type: {
            type: String, // ART, CHARACTER
            required: true
        },
        url: {
            type: String
        }
    },
    character: {
        name: {
            type: String
        },
        gender: {
            type: Number // 0 female, 1 male, 2 non-binary
        },
        media: {
            id: {
                type: String,
            },
            title: {
                type: String
            }
        }
    }
}, {
    timestamps: true
});

module.exports = model('waifus_claim', schema);
