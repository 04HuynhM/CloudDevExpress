const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const app = express();
const groupRouter = require('./routes/group');
const runRouter = require('./routes/run');
const userRouter = require('./routes/user');
const db = require('./config/database');

require('./config/passport')(passport);
app.use(passport.initialize());

app.use(morgan('dev'));

app.use('/group', groupRouter);
app.use('/run', runRouter);
// app.use('/auth/user', passport.authenticate('jwt', {session: false}), userAuthRouter);
app.use('/user', userRouter);

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