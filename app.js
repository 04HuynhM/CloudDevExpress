const express = require('express');
const app = express();

const passport = require('passport');
const morgan = require('morgan');

const groupRouter = require('./routes/group');
const runRouter = require('./routes/run');
const userRouter = require('./routes/user');

const db = require('./config/database');

app.use(morgan('dev'));

app.use('/group', groupRouter);
app.use('/run', runRouter);
app.use('/user', userRouter);

require('./config/passport')(passport);
app.use(passport.initialize);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});

db.authenticate()
    .then(() => {
        console.log('Connection to database has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });