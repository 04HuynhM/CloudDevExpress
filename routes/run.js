const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const config = require('../config/main');
const jwt = require('jsonwebtoken');
const Run = require('../models/run');
const User = require('../models/user');
const jsonParser = bodyParser.json();

//Create Run
/*
Takes Json body of:
    * = required

    startTime* : DATE (yyyy-mm-dd hh:MM:ss)
    locations : JSONB
    username* : STRING

    Returns a Run json object (run_id, startTime, locations, user)
 */
router.post('/', jsonParser, (req, res) => {
    const data = req.body;
    if (!data.startTime || !data.username) {
        return res.status(402).json({
            message: 'Incomplete data. Start time and username are required.'
        })
    } else {
        User.findOne({
            where: {
                username: data.username
            }
        }).then(user => {
            if(!user) {
                return res.status(404).json({
                    message: 'User was not found'
                })
            }
            Run.create({
                startTime: data.startTime,
                locations: data.locations,
            }).then(result => {
                result.setUser(user.username).then(result => {
                    return res.status(200).json(result);
                });
            }).catch(error => {
                return res.status(500).json({
                    message: 'An unknown error occurred',
                    error: error
                })
            })
        });
    }
});

//Update Run
/*
Takes JSON body of:
    locations: JSONB

    Returns updated Run JSON object
 */
router.put('/:run_id', jsonParser, (req, res) => {
    Run.findOne({
        where: {
            run_id : req.params.run_id
        }
    }).then(run => {
        if(run) {
            let values = { locations : req.body.locations};
            let selector = {where: { run_id: req.params.run_id }};

            Run.update(values, selector)
                .then(updatedRun => {
                    res.status(200).json(updatedRun)
                }).catch(error => {
                return res.status(500).json({
                    message: 'There was a database error when updating this run.',
                    error: error
                });
            })
        } else {
            return res.status(404).json({
                message: 'Could not find run.'
            })
        }
    })
});

//Get all runs
router.get('/', (req, res) => {
   Run.findAll().then(runs => {
       return res.status(200).json(runs)
   })
});

//Get all runs for user
router.get('/:username', (req, res) => {
    Run.findAll({
        where: {
            user: req.params.username
        }
    }).then(result => {
        if(result.length !== 0) {
            return res.status(200).json(result)
        } else {
            return res.status(404).json({
                message: 'No runs could be found.'
            })
        }
    }).catch(error => {
        return res.status(500).json({
            message: 'An unknown error occurred',
            error: error
        })
    })
});

//Get run by run_id
router.get('/:run_id', (req, res) => {
    Run.findOne({
        where: {
            run_id : req.params.run_id
        }
    }).then(run => {
        if (run) {
            return res.status(200).json(run)
        } else {
            return res.status(404).json({
                message: 'Could not find run'
            })
        }
    })
});

// Delete a run (Requires authorization from a system admin or the run owner)
router.delete('/:run_id', (req, res) => {
    let snippedAuth = req.get('Authorization').replace("Bearer ", "");
    let decodedAuth = jwt.verify(snippedAuth, config.secretKey);
    let callerUsername = decodedAuth.username;
    console.log(callerUsername);
    let isAdmin = decodedAuth.isAdmin;

    let runSelector = { where: { run_id : req.params.run_id }};
    Run.findOne(runSelector).then(run => {
        if (run) {
            if (run.user !== callerUsername && !isAdmin) {
                return res.status(403).json({
                    message: 'Unauthorized. Only system admins and run owners can delete their runs'
                })
            }
            Run.destroy(runSelector).then(() => {
                return res.status(200).json({
                    message: 'Run deleted successfully'
                })
            }).catch(err => {
                return res.status(500).json({
                    message: 'Something went wrong when deleting this run',
                    error: err
                })
            })
        } else {
            return res.status(404).json({
                message: 'Could not find run'
            })
        }
    })
});

module.exports = router;