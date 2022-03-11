/**
 * Se usa para mostrar que la acción tuvo éxito.
 * 
 * @param {String} message mensaje a mostrar.
 * @param {*} data puede ser cualquier cosa, desde un String a un Objeto.
 * @returns retorna un objeto con el status en true (de éxito), un mensaje y los datos.
 */
const success = (message, data) => {
    return {
        status: true,
        message,
        data
    }
};

/**
 * Se usa para mostrar que la acción no tuvo éxito.
 * 
 * @param {String} message mensaje a mostrar.
 * @returns retorna un objeto con el status en false (por el error) y un mensaje.
 */
const failed = (message) => {
    return {
        status: false,
        message
    }
};

module.exports = {
    success,
    failed
};
