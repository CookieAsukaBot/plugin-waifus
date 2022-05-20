/**
 * Da formato al type (metadata) del model/claim.
 * 
 * @param {String} input funciona con CHARACTER y ART.
 * @param {Boolean} inLowerCase por defecto se mantiene en false.
 * @returns un string con el texto leíble.
 */
const formatedClaimType = (claimType, gender, inLowerCase) => {
    let output = "";
    if (claimType == "ART") {
        output = "Arte";
    } else {
        switch (gender) {
            case 'Male':
                output = "Husbando";
                break;
            case 'Non-binary':
                output = "Non-binary"
                break;
            default:
                output = "Waifu";
                break;
        };
    };
    if (inLowerCase) output = output.toLowerCase();
    return output;
};

/**
 * work in progress (no debería de pedir tantos datos?)
 * @param {Object} data 
 * @returns retorna un {String} descripción para el embed
 */
 const haremDescriptionType = data => {
    let { id, type, domain, name, anime, gender } = data;
    if (type == "CHARACTER") {
        return `**${name}**${getGenderEmoji(gender)}\n${anime}`; // agregar género (getGenderEmoji)
    } else {
        return `${domain} | ${id}`;
    };
};

/**
 * Retorna emoji a base del género
 * @param {String} gender Male, Non-binary
 */
const getGenderEmoji = (gender) => {
    let output = "";
    switch (gender) {
        case 1:
            output = " ♂️";
            break;
        case 2:
            output = " ♂️ ♀️";
            break;
        default:
            output = " ♀️";
            break;
    };
    return output;
};

module.exports = {
    formatedClaimType,
    haremDescriptionType,
    getGenderEmoji,
};
