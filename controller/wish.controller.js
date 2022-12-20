const { nanoid } = require('nanoid');
const status = require('../helpers/status');
const Wish = require('../models/wish');
const {getUser,findClaim} = require('../controller/user.controller');

/**
 * Obtiene la lista de deseos de un usuario.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 * @returns retorna la lista o un mensaje de error.
 */
const find = async (guild, userID) => {
    try {
        let WishList = await Wish.find({ guild, "user.id": userID })
            .sort({ createdAt: 1 });
        
        // Comprobar
        if (!WishList || WishList.length <= 0) return status.failed("aún no has deseado nada");

        return status.success("SUCCESS", WishList);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Agregar a la lista de deseos.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 * @param {Object} media Objeto del personaje o arte a desear.
 * @returns 
 */
const add = async (guild, userID, media) => {
    try {
        let userWishes = await Wish.countDocuments({ guild, "user.id": userID });
        let user = (await getUser(guild, userID)).data;

        if (userWishes >= user.fun.wishes) {
            return status.failed("has superado el límite de deseos");
        }

        if (await Wish.findOne({
            guild,
            "user.id": userID,
            "metadata.domain": media.metadata.domain,
            "metadata.id": media.metadata.id
        })) {
            return status.failed("ya se encuentra en tu lista de deseos");
        }

        let wish = new Wish({
            id: nanoid(12),
            guild,
            user: {
                id: userID
            },
            metadata: media.metadata
        });

        if (media.character) wish.character = media.character;

        await wish.save();
        return status.success("SUCCESS", wish);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Elimina un deseo.
 * 
 * @param {String} guild ID del servidor.
 * @param {String} userID ID del usuario.
 * @param {String} wishID ID del deseo a eliminar.
 * @returns retorna un mensaje por si ocurrió un error o se eliminó correctamente.
 */
const remove = async (guild, userID, wishID) => {
    try {
        let wish = await Wish.findOne({
            id: wishID,
            guild,
            "user.id": userID
        });

        if (!wish) {
            return status.failed("este deseo ya no existe");
        } else {
            await Wish.deleteOne({
                id: wishID,
                guild,
                "user.id": userID,
            });
            return status.success(`**${wish?.character?.name ? wish.character.name : wish.metadata.id}** se eliminó de tu lista de deseos`);
        }
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

/**
 * Obtiene un deseo aleatorio.
 * 
 * @param {String} guild ID del servidor.
 * @returns 
 */
const getRandomWish = async (guild) => {
    try {
        let wish = await Wish.aggregate([{
                $match: {guild}
            }, {
                $sample: {size: 1}
            }]
        );
        
        // Comprobar
        if (!wish || wish.length <= 0) return status.failed("WISHES_NOT_FOUND");
        wish = wish[0];

        // Buscar usuarios que han deseado lo mismo
        let ids = [];
        let getUsers = await Wish.find({
            "guild": wish.guild,
            "metadata.domain": wish.metadata.domain,
            "metadata.id": wish.metadata.id,
        });

        // todo: en un futuro debería de haber un límite, no es necesario que sea aquí mismo.
        // if (ids.length <= 20)
        getUsers.forEach(ping => 
            ids.push(ping.user.id));

        let model = {
            domain: wish.metadata.domain,
            id: wish.metadata.id,
            url: wish.metadata.url,
            description: '',
            type: wish.metadata.type,
            owner: false,
            wish: {
                ids
            }
        }

        if (wish.character) {
            model.name = wish.character?.name,
            model.gender = wish.character?.gender,
            model.media = {
                id: wish?.character?.media?.id,
                title: wish?.character?.media?.title
            }
            model.description += `**${model.name}**`;
        } else {
            model.description += `${model.domain} | ${model.id}`;
        }

        if (model.media?.title) model.description += `\n${model.media.title}`;

        let isClaimed = await findClaim(guild, model.domain, model.id);
        if (isClaimed.message == "FOUND") model.owner = isClaimed.data.user.id;

        return status.success("SUCCESS", model);
    } catch (error) {
        console.error(error);
        return status.failed("DB_ERROR");
    }
}

module.exports = {
    find,
    add,
    remove,
    getRandomWish,
}
