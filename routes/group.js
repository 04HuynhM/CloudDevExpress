const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const Group = require('../models/group');
const jsonParser = bodyParser.json();

//Create a group
/*
Takes JSON body of:
    username: STRING (will become admin)
    groupName: STRING

    Returns status 200
 */
router.post('/', jsonParser, (req, res) => {
    const data = req.body;
    let groupName = data.groupName || '';
    if (!data.username) {
        return res.status(400).json({
            message: 'Incomplete data. Username required.'
        })
    }
    User.findOne({
        where: {
            username : data.username
        }
    }).then(user => {
        if (user) {
            Group.create({
                    groupName: groupName
                }
            ).then(result => {
                console.log('Did this work?');
                result.setAdmin(data.username).then(result => {
                    return res.status(200).json(result);
                });
            }).catch(error => {
                return res.status(500).json({
                    message: 'An unknown error occurred',
                    error: error
                })
            })
        } else {
            return res.status(404).json({
                message: 'User could not be found'
            })
        }
    }).catch(err => {
        return res.status(500).json({
            message: 'Something went wrong',
            error: err
        })
    })

});

//Invite User to Group
/*
Takes JSON body of:
    invitedUser: STRING (username of invited user)

    Returns status 200
 */
router.put('/:group_id/invite', jsonParser, (res, req) => {
    let data = req.body;
    if (!data.invitedUser) {
        return res.status(400).json({
            message: 'Invited user required'
        })
    }
    Group.findOne({
        where: {
            group_id : req.params.group_id
        }
    }).then(group => {
        if (!group) {
            return res.status(404).json({
                message: 'Could not find group'
            })
        }
        let invited = data.invitedUser;
        User.findOne({
            where: {
                username: invited
            }
        }).then(user => {
            if (!user) {
                return res.status(404).json({
                    message: 'Could not find user'
                })
            }
            let groupInvites = user.groupInvitations;
            let newInvited = groupInvites.push(group.group_id);
            let values = {groupInvitations: newInvited};
            User.update(values, {
                returning: true,
                where: {
                    group_id: group.group_id
                }
            }).then(updatedGroup => {
                res.status(200).json(updatedGroup)
            }).catch(error => {
                return res.status(500).json({
                    message: 'There was a database error when updating this run.',
                    error: error
                });
            })
        })
    })
});


//Accept Group Invitation
/*
Takes JSON body of:
    username: STRING (for invited user)

    Returns status 200
 */
router.put('/:group_id/accept', jsonParser, (res, req) => {
    let data = req.body;
    Group.findOne({
        where: {
            group_id: req.params.group_id
        }
    }).then(group => {
        if (!group) {
            return res.status(404).json({
                message: 'Could not find group'
            })
        }
        User.findOne({
            where: {
                username: data.username
            }
        })
        .then(user => {
            if(!user) {
                return res.status(404).json({
                    message: 'Could not find user'
                })
            }
            if (!user.groupInvitations.includes(group.group_id)) {
                return res.status(400).json({
                    message: 'Invitation does not exist'
                })
            }
            let newGroupMembers = group.members.push(user.username);

            let values = {members: newGroupMembers};
            let selector = {returning: true, where: {group_id: group.group_id}};

            Group.update(values, selector)
            .then(updatedGroup => {
                if (updatedGroup === 1) {
                    let newInvitations = user.groupInvitations;
                    for (let i = 0; i < newInvitations.length; i++) {
                        if (newInvitations[i] === group.group_id) {
                            newInvitations.splice(i, 1)
                        }
                    }
                    let values = {groupInvitations: newInvitations};
                    let selector = {where: {username: user.username}};
                    User.update(values, selector)
                        .then(updatedUser => {
                            if (updatedUser === 1) {
                                res.status(200).json(updatedUser)
                            } else {
                                return res.status(500).json({
                                    message: 'Unknown error, user invitations list was not updated'
                                })
                            }
                        }).catch(error => {
                        return res.status(500).json({
                            message: 'There was a database error when updating the users invitations.',
                            error: error
                        });
                    })
                        .catch(error => {
                            return res.status(500).json({
                                message: 'There was a database error when updating this groups members.',
                                error: error
                            });
                        });
                } else {
                    return res.status(500).json({
                        message: 'Unknown error, group was not updated'
                    })
                }
            }).catch(error => {
                return res.status(500).json({
                    message: 'Something went wrong',
                    error: error
                })
            })
        })
    })

});

//Update Group Name
/*
Takes JSON body of:
    groupName: STRING

    Returns status 200
 */
router.put('/:group_id/name', jsonParser, (req, res) => {
    Group.findOne({
        where: {
            group_id : req.params.group_id
        }
    }).then(group => {
        if(!group) {
            return res.status(404).json({
                message: 'Could not find group.'
            })
        }
        let values = { groupName : req.body.groupName};
        let selector = {where: { group_id: req.params.group_id }};

        Group.update(values, selector)
            .then(updatedGroup => {
                if (updatedGroup === 1) {
                    return res.status(200).json(updatedGroup)
                } else {
                    return res.status(500).json({
                        message: 'There was a database error when updating this group.',
                    });
                }
            }).catch(error => {
            return res.status(500).json({
                message: 'There was a database error when updating this group.',
                error: error
            });
        })
    })
});

//Get all groups
router.get('/', (req, res) => {
    Group.findAll().then(groups => {
        return res.status(200).json(groups)
    })
});

//Get all groups owned by a user
router.get('/:username', (req, res) => {
    Group.findAll({
        where: {
            admin: req.params.username
        }
    }).then(result => {
        if(result.length !== 0) {
            return res.status(200).json(result)
        } else {
            return res.status(404).json({
                message: 'No groups could be found.'
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
router.get('/:group_id', (req, res) => {
    Group.findOne({
        where: {
            group_id : req.params.group_id
        }
    }).then(group => {
        if (group) {
            return res.status(200).json(group)
        } else {
            return res.status(404).json({
                message: 'Could not find group'
            })
        }
    })
});

module.exports = router;

