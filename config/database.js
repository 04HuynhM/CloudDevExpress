const Sequelize = require('sequelize');

module.exports = new Sequelize(
    'clouddevdb',
    'master',
    'rootuser',
    {
        port: 5432,
        host: 'clouddevdb.cpvkbdcnilcb.eu-west-2.rds.amazonaws.com',
        dialect: 'postgres',
    },
);

const User = require('../models/user');
const Run = require('../models/run');
const Group = require('../models/group');

User.hasMany(Run, {foreignKey: 'user'});
Run.belongsTo(User, {foreignKey: 'user'});
User.hasMany(Group, {foreignKey: 'admin'});
Group.belongsTo(User, {foreignKey: 'admin'});
