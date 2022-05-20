const express = require('express');
const auth = require('../middleware/auth');
const Follow = require('../models/Follow');
const Profile = require('../models/Profile')
const router = express.Router();

e
router.get('/', auth, async (req, res) => {
    try {
        const follow = await Follow.findOne({user: req.user.id}).select('followings');

        res.status(200).json({followings: follow.followings});
    } catch(err) {
        console.log(err.message);
        res.status(500).send(' error');
    }
});


router.put('/:userId', auth, async (req, res) => {
    if(req.user.profile === req.params.profileId) {
        return res.status(400).json({msg: 'Cannot follow yourself'});
    }

    try {
        const followingProfile = await Profile.findOne({user: req.params.userId}).select('user');
        if(!followingProfile) {
            return res.status(404).json({msg: ' not found'});
        }
        const myFollows = await Follow.findOne({user: req.user.id});r
        const followingUser = await Follow.findOne({user: followingProfile.user});
        const followingIndex = myFollows.followings.map(val => val.profile.toString()).indexOf(followingProfile.id);
        if(followingIndex !== -1) {
            myFollows.followings.splice(followingIndex, 1);
            const followerIndex = followingUser.followers.map(val => val.profile.toString()).indexOf(req.user.profile);
            followingUser.followers.splice(followerIndex, 1);
            await myFollows.save();
            await followingUser.save();
        } else {
            myFollows.followings.unshift({profile: followingProfile.id});
            followingUser.followers.unshift({profile: req.user.profile});
            await myFollows.save();
            await followingUser.save();
        }

        res.status(200).json({msg: 'Done'});
    } catch(err) {
        console.log(err.message);

        // check if id is invalid
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Invalid'})
        }

        res.status(500).send('error');
    }
});

module.exports = router;