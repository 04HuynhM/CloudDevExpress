const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Run = require('../models/run');
const Group = require('../models/group');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/main');
const jsonParser = bodyParser.json();
const upload = require('../config/cloudStorage');
const singleUpload = upload.single('image');
const cors = require('cors');

// Get all users
router.get('/', cors(), (req, res) => {
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
router.get('/:id', cors(), (req, res) => {
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
        if (appUser) {
            return res.status(200).json(appUser);
        } else {
            return res.status(404).json({
                message: 'User not found'
            })
        }
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
router.post('/login', cors(), jsonParser, (req, res) => {
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
router.post('/', cors(), jsonParser, (req, res) => {
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
router.put('/:id', cors(), jsonParser, passport.authenticate('jwt', { session: false }), (req, res) => {
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
router.post('/:id/image-upload', cors(), passport.authenticate('jwt', { session: false }), (req, res) => {
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

// Delete User (ADMIN ONLY)
// Takes json body of:
//     username : String
//
// REQUIRES AUTHORIZATION
router.delete('/:id', cors(), jsonParser, passport.authenticate('jwt', { session : false }), (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, config.secretKey);
    let isAdmin = decodedAuth.isAdmin;
    let isUser = decodedAuth.username == req.params.username;
    if (isAdmin || isUser) {
        User.findOne({
            where : {
                username: req.params.id
            }
        }).then(userToBeDeleted => {
            if (userToBeDeleted) {
                console.log('Deleting runs for user.');
                Run.destroy({
                    where: {
                        user: userToBeDeleted.username
                    }
                }).then(() => {
                    console.log('Deleting groups for user');
                    Group.destroy({
                        where: {
                            admin: userToBeDeleted.username
                        }
                    }).then(() => {
                        console.log('Deleting user');
                        User.destroy({
                            where: {
                                username : userToBeDeleted.username
                            }
                        }).then(() => {
                            return res.status(200).json({
                                message: 'User and their runs and groups have been deleted'
                            })
                        }).catch(err => {
                            return res.status(500).json({
                                message: 'User could not be deleted.',
                                error: err
                            })
                        })
                    }).catch(err => {
                        return res.status(500).json({
                            message: 'Groups could not be deleted',
                            error: err
                        })
                    })
                }).catch(err => {
                    return res.status(500).json({
                      message: 'Runs could not be deleted',
                      error: err
                    })
                })
            } else {
                return res.status(404).json({
                    message: 'User could not be found',
                })
            }
        }).catch(err => {
            return res.status(500).json({
                message: "Something went wrong",
                error: err
            })
        })
    } else {
        return res.status(401).json({
            message: 'Unauthorized. You cannot delete another user unless you are a system admin.'
        })
    }
});

function hashPassword(password) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    console.log("HASH =====" + hash);
    return hash
}

function deleteUser(user) {

}

module.exports = router;