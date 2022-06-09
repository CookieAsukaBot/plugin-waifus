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
        favourites: [{
            type: Schema.ObjectId
        }],
        order: {
            by: {
                type: String,
                default: 'claimedAt' // claimedAt, random
            },
            direction: {
                type: String,
                default: 'asc' // asc | desc
            }
        },
        color: {
            type: String,
            default: '#fb94ff'
        },
        title: {
            type: String,
            default: 'Mi harem'
        },
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
                type: Date
            },
            last: {
                type: Date
            },
            count: {
                type: Number,
                default: 0
            }
        },
        claims: {
            first: {
                type: Date
            },
            last: {
                type: Date
            },
            count: {
                type: Number,
                default: 0
            }
        },
        gifted: {
            first: {
                type: Date
            },
            last: {
                type: Date
            },
            count: {
                type: Number,
                default: 0
            }
        },
        received: {
            first: {
                type: Date
            },
            last: {
                type: Date
            },
            count: {
                type: Number,
                default: 0
            }
        },
        divorced: {
            first: {
                type: Date
            },
            last: {
                type: Date
            },
            count: {
                type: Number,
                default: 0
            }
        }
    }
}, {
    timestamps: true
});

module.exports = model('waifus_user', schema);
