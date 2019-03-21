require('dotenv').config();
const Sequelize = require('sequelize');

module.exports = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        port: process.env.DATABASE_PORT,
        host: process.env.DATABASE_HOST,
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
