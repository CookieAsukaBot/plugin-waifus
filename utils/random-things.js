
const getRandomNumber = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomNumbers = (quantity, min, max) => {
    let list = [];

    for (let index = 0; index < quantity; index++) {
        list.push(Math.floor(Math.random() * (max - min)) + min);
    };

    return list;
};

const getRandomArrayItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

module.exports = {
    getRandomNumber,
    getRandomNumbers,
    getRandomArrayItem
};
