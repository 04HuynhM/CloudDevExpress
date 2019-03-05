const Sequelize = require('sequelize');
const db = require('../config/database');

const Group = db.define('group', {
    freezeTableName: true,
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

Group.associate = models => {
    Group.belongsTo(models.User)
};

module.exports = Group;