const Sequelize = require('sequelize');
const db = require('../config/database');

const Run = db.define('Run', {
    run_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    },
    locations: {
        type: Sequelize.JSONB,
    },
    startTime: {
        type: Sequelize.DATE,
    },
    timeInSeconds: {
        type: Sequelize.INTEGER,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Run;
