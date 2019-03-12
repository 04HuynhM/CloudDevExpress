const Sequelize = require('sequelize');
const db = require('../config/database');

const Group = db.define('group', {
    group_id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true,
    },
    members: {
        type:Sequelize.JSONB,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Group;