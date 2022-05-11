
/**
 * Obtiene un número aleatorio personalizable con un máximo y un mínimo.
 * 
 * @param {Int} min valor mínimo.
 * @param {Int} max valor máximo.
 * @returns retorna un Int aleatorio.
 */
const getRandomNumber = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Obtiene multiples números aleatorios personalizable con número mínimo y máximo.
 * 
 * @param {Int} quantity cantidad de números aleatorios.
 * @param {Int} min valor minímo.
 * @param {Int} max valor máximo.
 * @returns retorna un Array con números aleatorios.
 */
const getRandomNumbers = (quantity, min, max) => {
    let list = [];

    for (let index = 0; index < quantity; index++) {
        list.push(Math.floor(Math.random() * (max - min)) + min);
    };

    return list;
};

/**
 * Retorna un elemento aleatorio dentro del Array.
 * 
 * @param {Array} array con elementos para funcionar.
 */
const getRandomArrayItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Obtiene un emoji aleatorio de una lista predeterminada.
 * 
 * @returns retorna un String con el emoji aleatorio.
 */
const getRandomHeart = () => {
    let hearts = [
        '🧡', '💛', '💚', '💙', '💜', '🤎', '🤍',
        '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
        '💟', '👫', '💑', '💏', '💋', '😍', '😘', '😻',
        '🏩', '💒', '💌'
    ];
    return getRandomArrayItem(hearts);
};

module.exports = {
    getRandomNumber,
    getRandomNumbers,
    getRandomArrayItem,
    getRandomHeart,
};
