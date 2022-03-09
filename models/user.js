const { Schema, model } = require('mongoose');

const schema = new Schema({
    guild: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    harem: {
        // waifu: [{
        //     type: populate
        // }],
        // art: [{
        //     type: populate
        // }],
        order: {
            type: String,
            default: "updatedAt1" // updatedAt significa sorted by, 0/1 desc/asc
        },
        color: {
            type: String,
            default: '#fb94ff'
        },
        title: {
            type: String,
            default: 'Mi harem'
        },
        count: {
            type: Number,
            default: 0
        }
    },
    fun: {
        canClaim: {
            type: Boolean,
            default: true
        },
        freeClaim: {
            type: Number,
            default: 5
        },
        rolls: {
            type: Number,
            default: 10
        },
        extraRolls: {
            type: Number,
            default: 0
        },
    },
    stats: {
        rolls: {
            first: {
                type: Number
            },
            last: {
                type: Number
            },
            count: {
                type: Number,
                default: 0
            }
        },
        claims: {
            first: {
                type: Number
            },
            last: {
                type: Number
            },
            count: {
                type: Number,
                default: 0
            }
        },
        gifted: {
            first: {
                type: Number
            },
            last: {
                type: Number
            },
            count: {
                type: Number,
                default: 0
            }
        },
        received: {
            first: {
                type: Number
            },
            last: {
                type: Number
            },
            count: {
                type: Number,
                default: 0
            }
        },
        divorced: {
            first: {
                type: Number
            },
            last: {
                type: Number
            },
            count: {
                type: Number,
                default: 0
            }
        }
    },
}, {
    timestamps: true
});

module.exports = model('waifus_user', schema);
