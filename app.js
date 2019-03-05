const express = require('express');
const path = require('path');
const Sequelize = require('sequelize');
const groupRouter = require('./routes/group');
const runRouter = require('./routes/run');
const userRouter = require('./routes/user');
const db = require('./config/database');

const app = express();

app.use('/group', groupRouter);
app.use('/run', runRouter);
app.use('/user', userRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});

db.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

app.get('/', (req, res) => res.send('INDEX'));

