const { nanoid } = require('nanoid');
const status = require('../helpers/status');
const User = require('../models/user');
const Claim = require('../models/claim');
const {getCooldowns} = require('../controller/guild.controller');

/**
 * Comprueba la existencia del usuario, sino se encuentra lo crea.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a crear.
 * @returns {Object} retorna el usuario creado o encontrado.
 */
const getUser = async (guild, userID) => {
    let data = { guild, id: userID };
    try {
        let user = await User.findOne(data);
        if (!user) {
            user = new User(data);
            await user.save();
        };
        return status.success("SUCCESS", user);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * todo: Necesita un sistema de orden funcional con desc y asc.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar.
 * @param {String} order Elegir el orden a devolver (SIGUE WIP).
 * @returns {Array} retorna todas las reclamaciones encontradas.
 */
const getHarem = async (guild, userID, order) => {
    try {
        let harem = await Claim.find({ guild, "user.id": userID })
            .sort({ "user.claimedAt": 1 });
        return status.success("SUCCESS", harem);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Contador de artes y personajes reclamados del usuario en especifico.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar.
 * @returns {Object} retorna la cantidad de characters y arts.
 */
 const getHaremCount = async (guild, userID) => {
    try {
        return status.success("SUCCESS", {
            characters: await Claim.countDocuments({ guild, "user.id": userID, "metadata.type": "CHARACTER" }),
            arts: await Claim.countDocuments({ guild, "user.id": userID, "metadata.type": "ART" })
        });
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Se comprueba la existencia del usuario, después se cambia el estado de reclamación a falso, se crea el módelo a guardar, se comprueban campos extras y guarda el módelo.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar y guardar.
 * @param {String} username nombre del usuario.
 * @param {Object} data objeto.
 * @returns retorna un mensaje de éxito.
 */
const claim = async (guild, userID, username, data) => {
    let { media, name, gender } = data;

    try {
        let user = (await getUser(guild, userID)).data;
        if (user.fun.canClaim == false) {
            let cooldowns = (await getCooldowns(guild)).data;
            return status.failed(`¡**${username}**, ya has reclamado!\nEl reinicio es **__${cooldowns.claims.replaceAll("*", "")}__**.`);
        };

        await User.updateOne({ id: userID }, {
            "fun.canClaim": false,
            $inc: {
                "harem.count": 1,
                "stats.claims.count": 1
            }
        });

        let claimed = new Claim({
            id: nanoid(12),
            guild,
            user: {
                id: userID
            },
            metadata: {
                domain: data.domain,
                id: data.id,
                type: data.type,
                url: data.url
            }
        });

        if (media) {
            claimed.character.media.id = media.id;
            claimed.character.media.title = media.title;
        };
        if (name) claimed.character.name = name;
        if (gender) {
            switch (gender) {
                case "Male":
                    claimed.character.gender = 1;
                    break;
                case "Non-binary":
                    claimed.character.gender = 2;

                default:
                    claimed.character.gender = 0;
                    break;
            };
        };

        await claimed.save();
        return status.success("SUCCESS", claimed);
    } catch (error) {
        console.error(error);
        return status.failed(`DB_ERROR`);
    };
};

/**
 * 
 * @param {String} guild ID del servidor.
 * @param {String} domain dominio a buscar.
 * @param {String} id ID dentro del dominio.
 * @returns si existe retorna un mensaje FOUND.
 */
const findClaim = async (guild, domain, id) => {
    try {
        let claim = await Claim.findOne({
            guild,
            "metadata.domain": domain,
            "metadata.id": id
        });

        if (claim) {
            return status.success("FOUND", claim);
        } else {
            return status.success("NOT_FOUND", claim);
        };
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR")
    };
};

/**
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario que regalará.
 * @param {String} claimID ID del claim a regalar.
 * @param {String} newUserID ID del usuario a regalar.
 */
const gift = async (guild, userID, claimID, newUserID) => {
    let newUser = (await getUser(guild, newUserID)).data;

    await Claim.updateOne({
        id: claimID,
        guild,
        "user.id": userID
    }, {
        "user.id": newUser.id,
        "user.tags": [],
        "user.claimedAt": Date.now()
    }).then(async () => {
        await User.updateOne({ guild, id: userID }, {
            $inc: {
                "stats.gifted.count": 1
            }
        });
        await User.updateOne({ guild, id: newUser.id }, {
            $inc: {
                "stats.received.count": 1
            }
        });
        return status.success("SUCCESS");
    }).catch((error) => {
        console.error(error);
        return status.failed("DB_ERROR");
    });
};

/**
 * @param {String} guild ID del servidor.
 * @param {String} userId ID del usuario a eliminar.
 * @param {String} claimId ID del claim (nanoid).
 */
const divorce = async (guild, userID, claimID) => {
    await Claim.deleteOne({
        id: claimID,
        guild,
        "user.id": userID,
    }).then(async () => {
        await User.updateOne({ guild, id: userID }, {
            "stats.divorced.count": 1
        });
        return status.success("SUCCESS");
    }).catch((error) => {
        console.error(error);
        return status.failed("DB_ERROR");
    });
}

/**
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario para hacer el cambio.
 * @param {String} newData Título nuevo/actualizado a mostrar.
 */
const changeHaremTitle = async (guild, userID, newData) => {
    try {
        await User.updateOne({ guild, userID}, {
            "harem.title": newData
        });
        return status.success("SUCCESS");
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario para hacer el cambio.
 * @param {String} newData Color nuevo/actualizado a mostrar.
 */
const changeHaremColor = async (guild, userID, newData) => {
    try {
        await User.updateOne({ guild, userID}, {
            "harem.color": newData
        });
        return status.success("SUCCESS");
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

module.exports = {
    getUser,
    getHarem,
    getHaremCount,
    claim,
    findClaim,
    divorce,
    gift,
    changeHaremTitle,
    changeHaremColor,
}
