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
        let user = await User.find(data);
        if (!user) user = await new User(data);
        return user;
    } catch (error) {
        console.log(error);
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
            .sort(order || { updatedAt: -1 });
        return harem;
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    };
};

/**
 * Se comprueba la existencia del usuario, después se cambia el estado de reclamación a falso, se crea el módelo a guardar, se comprueban campos extras y guarda el módelo.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar y guardar.
 * @param {Object} data objeto
 * @returns retorna un mensaje de éxito.
 */
const claim = async (guild, userID, data) => {
    let { anime, name, gender } = data.image;

    try {
        let user = await getUser(guild, userID);
        if (user.fun.canClaim == false) return status.failed(`USER_CANT_CLAIM`);

        await User.updateOne({ id: userID }, {
            "fun.canClaim": false
        });

        let claimed = new Claim({
            id: nanoid(12),
            guild,
            user: {
                id: userID,
                position: user.stats.count || 1
            },
            metadata: {
                domain: data.image.domain,
                id: data.image.id,
                type: data.image.type,
                url: data.image.url
            }
        });

        if (anime) claimed.character.anime = anime;
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
        console.log(error);
        return status.failed(`DB_ERROR`);
    };
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
        return true;
    } catch (error) {
        console.log(error);
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
        return true;
    } catch (error) {
        console.log(error);
        return status.failed("DB_ERROR");
    };
};

module.exports = {
    getUser,
    getHarem,
    claim,
    changeHaremTitle,
    changeHaremColor
};
