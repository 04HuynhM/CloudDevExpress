const Sequelize = require('sequelize');
const db = require('../config/database');

const Run = db.define('run', {
    run_id: {
        type: Sequelize.INTEGER,
        unique: true,
    },
    locations: {
        type: Sequelize.JSONB,
    },
    startTime: {
        type: Sequelize.DATE,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

Run.associate = models => {
    Run.belongsTo(models.User)
};

module.exports = Run;
