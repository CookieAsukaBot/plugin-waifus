const { nanoid } = require('nanoid');
const status = require('../helpers/status');
const User = require('../models/user');
const Claim = require('../models/claim');

/**
 * Comprueba la existencia del usuario, si no se encuentra lo crea.
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
            user = await new User(data);
            await user.save();
        };
        return status.success("SUCCESS", user);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    };
};

/**
 * Necesita un sistema de orden funcional con desc y asc.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar.
 * @param {String} order Elegir el orden a devolver (SIGUE WIP).
 * @returns {Array} retorna todas las reclamaciones encontradas.
 */
const getHarem = async (guild, userID, order) => {
    try {
        let harem = await Claim.find({ guild, "user.id": userID })
            // .sort(order || { updatedAt: -1 });
        return status.success("SUCCESS", harem);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    };
};

/**
 * Se comprueba la existencia del usuario, después se cambia el estado de reclamación a falso, se crea el módelo a guardar, se comprueban campos extras y guarda el módelo.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar y guardar.
 * @param {Object} data objeto.
 * @returns retorna un mensaje de éxito.
 */
const claim = async (guild, userID, data) => {
    let { anime, name, gender } = data;

    try {
        let user = (await getUser(guild, userID)).data;
        if (user.fun.canClaim == false) return status.failed(`<@${userID}>, ya has reclamado!\nEl reinicio es en [cooldown here].`);

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

        if (anime) claimed.character.anime = anime;
        if (name) claimed.character.name = name;
        if (gender) { // wip:? Aquí puede que haya personajes en null, y por culpa de ello no tengan género
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
};

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
    };
};

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
    };
};

module.exports = {
    getUser,
    getHarem,
    claim,
    findClaim,
    divorce,
    gift,
    changeHaremTitle,
    changeHaremColor
};
