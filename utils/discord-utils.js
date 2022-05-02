/**
 * Obtiene el avatarURL de un usuario por ID.
 * 
 * @param {Object} user módelo del usuario.
 * @returns retorna el avatar URL.
 */
const getAvatarURL = (user) => {
    let avatar = `https://cdn.discordapp.com/avatars/${user.id}`;

    if (user.avatar.split("_")[0] == "a") {
        avatar += `/${user.avatar}.gif`;
        return avatar;
    } else {
        avatar += `/${user.avatar}.png`;
        return avatar;
    };
};

/**
 * Buscar un usuario por ID dentro del servidor.
 * 
 * @param {Object} bot requiere el módelo del bot.
 * @param {String} id ID de usuario a buscar
 * @returns retorna el módelo del usuario.
 */
const fetchUserByID = async (bot, id) => {
    return await bot.users.fetch(id);
};

module.exports = {
    getAvatarURL,
    fetchUserByID
};
