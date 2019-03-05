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