const Sequelize = require('sequelize');
const db = require('../config/database');

const User = db.define('User', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    isAdmin: {
        type: Sequelize.BOOLEAN,
    },
    currentWeight: {
        type: Sequelize.INTEGER,
    },
    weightGoal: {
        type: Sequelize.INTEGER,
    },
    dailyStepGoal: {
        type: Sequelize.INTEGER,
    },
    groups: {
        type: Sequelize.JSONB,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

// User.associate = models => {
//     User.hasMany(models.Group, {as: 'Groups'});
//     User.hasMany(models.Run, {as: 'Runs'});
// };

module.exports = User;