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
        }
    },
    metadata: {
        domain: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        type: {
            type: String, // ART, CHARACTER
            requiered: true
        },
        url: {
            type: String
        }
    },
    character: {
        name: {
            type: String
        },
        // gender: {
        //     type: Number // 0 female, 1 male, 2 non-binary
        // },
        gender: {
            type: String
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

module.exports = model('waifus_wish', schema);
