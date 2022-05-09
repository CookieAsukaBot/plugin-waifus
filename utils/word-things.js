/**
 * Da formato al type (metadata) del model/claim.
 * 
 * @param {String} input funciona con CHARACTER y ART.
 * @param {Boolean} inLowerCase por defecto se mantiene en false.
 * @returns un string con el texto leíble.
 */
const formatedClaimType = (input, inLowerCase) => {
    let output = "";
    switch (input) {
        case "CHARACTER":
            output = "Personaje";
            break;
        case "ART":
            output = "Arte";
        default:
            break;
    };
    if (inLowerCase) output = output.toLowerCase();
    return output;
};

module.exports = {
    formatedClaimType
};
