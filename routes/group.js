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
                    groupName: groupName,
                    members: [ user.username ],
                }
            ).then(createdGroup => {
                user.addGroup(createdGroup).then(returnedUser => {
                    Group.max('group_id', {
                        where: {
                            admin: returnedUser.username,
                        }
                    }).then(groupId => {
                        Group.findOne({
                            where: {
                                group_id: groupId
                            }
                        }).then(createdGroup => {
                            return res.status(200).json(createdGroup)
                        })
                    }).catch(error => {
                        Group.max('group_id', {
                            where: {
                                admin: returnedUser.username,
                            }
                        }).then(groupId => {
                            deleteErroneousGroup(groupId);
                            return res.status(500).json({
                                message: 'An unknown error occurred, the group was not created',
                                error: error
                            })
                        });
                        return res.status(500).json({
                            message: 'Something went wrong and an erroneous group was created'
                        })
                    });
                })
            }).catch(error => {
                Group.max('group_id', {
                    where: {
                        admin: user.username,
                    }
                }).then(groupId => {
                    deleteErroneousGroup(groupId);
                    return res.status(500).json({
                        message: 'An unknown error occurred, the group was not created',
                        error: error
                    })
                });
                return res.status(500).json({
                    message: 'Something went wrong and an erroneous group was created'
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
router.put('/:group_id/invite', jsonParser, (req, res) => {
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
        }).then(invitedUser => {
            if (!invitedUser) {
                return res.status(404).json({
                    message: 'Could not find user'
                })
            }
            let groupInvites = invitedUser.groupInvitations;
            if (groupInvites === []) {
                groupInvites = [groupInvites.push(group.group_id)];
            } else if (groupInvites.includes(group.group_id)) {
                return res.status(400).json({
                    message: 'User is already invited to group'
                })
            } else {
                groupInvites.push(group.group_id);
            }
            let values = {groupInvitations: groupInvites};
            User.update(values, {
                where: {
                    username: invitedUser.username
                }
            }).then(() => {
                res.status(200).json({
                    message: 'Invitation sent successfully'
                })
            }).catch(error => {
                return res.status(500).json({
                    message: 'There was a database error when sending the invitation.',
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
router.put('/:group_id/accept', jsonParser, (req, res) => {
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
            let currentMembers = group.members;
            if (currentMembers === []) {
                currentMembers = [currentMembers.push(user.username)];
            } else if (currentMembers.includes(user.username)) {
                return res.status(400).json({
                    message: 'User is already a member of this group.'
                })
            } else {
                currentMembers.push(user.username);
            }
            let values = {members: currentMembers};
            let selector = {where: {group_id: group.group_id}};

            Group.update(values, selector)
            .then(updatedRows => {
                if (updatedRows==1) {
                    let userInvitations = user.groupInvitations;
                    for (var i = 0; i < userInvitations.length; i++) {
                        if (userInvitations[i] === group.group_id) {
                            userInvitations.splice(i, 1)
                        }
                    }
                    let values = {groupInvitations: userInvitations};
                    let selector = {where: {username: user.username}};
                    User.update(values, selector)
                    .then(updatedUser => {
                        if (updatedUser == 1) {
                            res.status(200).json({
                                message: 'Accepted invitation successfully'
                            })
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
                }
                else {
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

//Get group by group_id
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

function deleteErroneousGroup(groupId) {
    Group.destroy({
        where: {
            group_id: groupId
        }
    }).then(result => {
        return result === 1;
    })
}

module.exports = router;

