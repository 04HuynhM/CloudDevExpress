const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cors = require('cors');
const app = express();

const db = require('./config/database');

const groupRouter = require('./routes/group');
const runRouter = require('./routes/run');
const userRouter = require('./routes/user');

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(morgan('dev'));
app.use(cors());

app.use('/group', passport.authenticate('jwt', { session: false }), groupRouter);
app.use('/run', passport.authenticate('jwt', { session: false }), runRouter);
app.use('/user', userRouter);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
    db.sync({force: false}).then(() => {
        console.log('Database is synced')
    }).catch(err => {
        console.log(err)
    })
});