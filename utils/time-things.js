const moment = require('moment');
moment.locale('es');

const getCountdownTime = (time) => {
    const eventTime = moment(time).unix();
    const currentTime = moment().unix();
    const diffTime = eventTime - currentTime;
    const duration = moment.duration(diffTime * 1000, 'milliseconds');

    let timeLeft = `en `;

    if (duration.minutes() == 1) timeLeft += `**${duration.minutes()}** minuto `;
    if (duration.minutes() > 1) timeLeft += `**${duration.minutes()}** minutos `;
    if (duration.seconds() > 1) timeLeft += `**${duration.seconds()}** segundos`;
    if (duration.seconds() == 1) timeLeft += `**${duration.seconds()}** segundo`;
    if (duration.minutes() <= 0 && duration.seconds() <= 0) timeLeft = `**ahora mismo**`;

    return timeLeft.trim();
};

module.exports = {
    getCountdownTime
};
