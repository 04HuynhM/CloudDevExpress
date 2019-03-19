const Sequelize = require('sequelize');
const db = require('../config/database');

const Group = db.define('Group', {
    group_id: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    groupName: {
        type: Sequelize.STRING,
    },
    members: {
        type:Sequelize.JSONB,
    }
}, {
    freezeTableName: true,
    timestamps: false,
});

module.exports = Group;