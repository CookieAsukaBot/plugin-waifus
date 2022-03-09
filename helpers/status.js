const success = (message, data) => {
    return {
        status: true,
        message,
        data
    }
};

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
