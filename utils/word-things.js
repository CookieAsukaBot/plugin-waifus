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
 * Retorna emoji a base del género
 * @param {String} gender Male, Non-binary
 */
const getGenderEmoji = (gender) => {
    let output = "";
    switch (gender) {
        case 'Male':
            output = " <:male:973582946927800330>";
            break;
        case 'Non-binary':
            output = " <:female:973582946957152286> <:male:973582946927800330>";
            break;
        default:
            output = " <:female:973582946957152286>";
            break;
    };
    return output;
};

module.exports = {
    formatedClaimType,
    getGenderEmoji,
};
