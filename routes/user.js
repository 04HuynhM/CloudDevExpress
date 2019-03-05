const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const app = express();

app.use(bodyParser.json);

router.get('/', (req, res) => {
    User.findAll()
        .then(appUser => {
            return res.status(200).json(appUser);
        })
        .catch(err => console.log(err));
});

router.get('/:id', (req, res) => {
    User.findOne({
        where: {username: req.params.id}
    })
    .then(appUser => {
        return res.status(200).json(appUser);
    })
    .catch(err => console.log(err))
});

module.exports = router;