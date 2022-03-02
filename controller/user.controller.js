const User = require('../models/user');
const Claim = require('../models/claim');

/**
 * Comprueba la existencia del usuario, si no se encuentra lo crea.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a crear.
 * @returns {Object} retorna el usuario creado o encontrado.
 */
const getUser = (guild, userID) => {
    let data = { guild, id: userID };
    try {
        let user = await User.find(data);
        if (!user) user = await new User(data);
        return user;
    } catch (error) {
        console.log(error);
        return false;
    };
};

/**
 * Necesita un sistema de orden funcional con desc y asc.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario a encontrar.
 * @param {String} order Elegir el orden a devolver (SIGUE WIP).
 * @returns {Array}? retorna todas las reclamaciones encontradas.
 */
const getHarem = (guild, userID, order) => {
    try {
        let harem = await Claim.find({ guild, "user.id": userID })
            .sort(order || { updatedAt: -1 });
        return harem;
    } catch (error) {
        console.log(error);
        return false;
    };
};

/**
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario para hacer el cambio.
 * @param {String} newData Título nuevo/actualizado a mostrar.
 */
const changeHaremTitle = (guild, userID, newData) => {
    try {
        await User.updateOne({ guild, userID}, {
            "harem.title": newData
        });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    };
};

/**
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario para hacer el cambio.
 * @param {String} newData Color nuevo/actualizado a mostrar.
 */
 const changeHaremColor = (guild, userID, newData) => {
    try {
        await User.updateOne({ guild, userID}, {
            "harem.color": newData
        });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    };
};

module.exports = {
    getUser,
    getHarem,
    changeHaremTitle,
    changeHaremColor
};
