const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/main');
const jsonParser = bodyParser.json();
const upload = require('../config/cloudStorage');
const singleUpload = upload.single('image');

// Get all users
router.get('/', (req, res) => {
    User.findAll({
        attributes: [
            'username',
            'email',
            'name',
            'isAdmin',
            'currentWeight',
            'weightGoal',
            'dailyStepGoal',
            'joinedGroups',
            'groupInvitations',
            'profilePicture'
        ]
    })
    .then(allUsers => {
        return res.status(200).json(allUsers);
    })
    .catch(err => console.log(err));
});

// Get single user
router.get('/:id', (req, res) => {
    User.findOne({
        where: {username: req.params.id},
        attributes: ['username',
                     'email',
                     'name',
                     'isAdmin',
                     'currentWeight',
                     'weightGoal',
                     'dailyStepGoal',
                     'joinedGroups',
                     'profilePicture']
    })
    .then(appUser => {
        return res.status(200).json(appUser);
    })
    .catch(err => console.log(err))
});

// Login user
/*
    Takes JSON body of:
     usernameOrEmail: string
     password: string

     ========================
     Returns:
     success: boolean
     token: string
 */
router.post('/login', jsonParser, (req, res) => {
    User.findOne( {
       where: {
           $or: [
               { username: { $eq: req.body.usernameOrEmail }},
               { email: { $eq: req.body.usernameOrEmail }}
           ]
       }
    }).then(user => {
       if(!user) {
           res.status(404).json({
               message: 'A user with the specified username or email does not exist.'
           })
       }
       console.log(user.password);
       let isAuthorised = bcrypt.compareSync(req.body.password, user.password);
       if (isAuthorised) {
            let token = jwt.sign({ username: user.username,
                                   email: user.email,
                                   isAdmin: user.isAdmin }, config.secretKey, {
                expiresIn: 1814400
            });
            res.status(200).json({
                success: true,
                token: token
            })
       } else {
            return res.status(403).json({
                message: 'Unauthorized.'
            })
       }
    }).catch(error => {
       res.status(500).json({
           message: 'Something went wrong.',
           error: error
       })
    })
});

// Create User
/* Takes json body of minimum:
    username: string,
    email: string,
    name: string,
    password: string,
    isAdmin: boolean

    optional fields:
    currentWeight: int,
    weightGoal: int,
    dailyStepGoal: int,
    groups: jsonB

   ========================
   Returns User json object
 */
router.post('/', jsonParser, (req, res) => {
    const data = req.body;

    if (!data.username ||
        !data.email ||
        !data.password ||
        !data.name ||
        !data.hasOwnProperty('isAdmin')) {

        return res.status(404).json({
            message: 'Incomplete data. Please ensure all required fields are filled:' +
                'username (string), email (string), name (string), password (string) and isAdmin (boolean).',
            receivedData: data
        })
    } else {

        let weightGoal = data.weightGoal || 0;
        let dailyStepGoal = data.dailyStepGoal || 0;
        let currentWeight = data.currentWeight || 0;

        User.findOrCreate({
            where: {
                $or: [
                    { username: { $eq: data.username }},
                    { email: { $eq: data.email }}
                ]},
            defaults: {
                username: data.username,
                email: data.email,
                name: data.name,
                password: hashPassword(data.password),
                isAdmin: data.isAdmin,
                currentWeight: currentWeight,
                weightGoal: weightGoal,
                dailyStepGoal: dailyStepGoal,
                joinedGroups: [],
                groupInvitations: [],
                profilePicture: '',
            }
        }).then(result => {
            let user = result[0],
                created = result[1];

            if (!created) {
                return res.status(400).json({
                    message: 'Username or email already associated with another account.',
                })
            }
            return res.status(200).json(user);
        }).catch(error => {
            return res.status(500).json({
                message: 'An unknown error occured',
                error: error
            })
        })
    }
});

// Update User
/* Takes json body of:
    updatedType: string
        options =
            name: string,
            isAdmin: boolean,
            currentWeight: int,
            weightGoal: int,
            dailyStepGoal: int,
            groups: JSONB
    newValue: string, int, boolean or JSONB depending on type
    ============
    REQUIRES Authorization header with bearer token
    ============
    Returns: User json object
 */
router.put('/:id', jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
    let data = req.body;
    if (!data.updatedType ||
        !data.newValue) {
        return res.status(204).json({
            message: 'Body must contain updatedType and newValue key values.' +
                'Accepted types: currentWeight (int), weightGoal (int), ' +
                'dailyStepGoal (int), joinedGroups (json), name (string), isAdmin (boolean)'
        })
    }

    let updatedType = data.updatedType;

    if (updatedType === 'username' ||
        updatedType === 'email' ||
        updatedType === 'password') {
        return res.status(400).json({
            message: 'Username cannot be changed. ' +
                'To change your email or password, call the relevant endpoints'
        })
    }

    let values = {[updatedType] : data.newValue};
    let selector = {where: { username: req.params.id }};

    User.update(values, selector)
    .then(updatedUser => {
        res.status(200).json(updatedUser)
    }).catch(error => {
        return res.status(500).json({
            message: 'There was an error when updating this user.'
        });
    })
});

// Upload profile picture
router.post('/:id/image-upload', passport.authenticate('jwt', { session: false }), (req, res) => {
    singleUpload(req, res, (err => {
        if (err) {
            return res.status(422).json({
                message: 'Could not upload image',
                error: err
            })
        }
        let values = {profilePicture: req.file.location};
        let selector = {where: {username: req.params.id}};
        User.update(values, selector).then(result => {
            if (result == 1) {
                return res.status(200).json({
                    url: req.file.location
                })
            } else {
                return res.status(500).json({
                    message: 'An error occured, profile picture was not uploaded'
                })
            }
        });
    }))
});

function hashPassword(password) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    console.log("HASH =====" + hash);
    return hash
}

module.exports = router;