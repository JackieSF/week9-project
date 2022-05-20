const express = require('express');
const auth = require('../middleware/auth');
const compare = require('../utilities/compare');
const Follow = require('../models/Follow');
const TweetList = require('../models/TweetList');
const router = express.Router();


router.get('/', auth, async (req, res) => {
    try {
        const follow = await Follow.findOne({user: req.user.id})
                                    .select('followings')
                                    .populate('followings.profile', 'user');

        const userList = [{profile: {_id: req.user.profile, user: req.user.id}}, ...follow.followings];

        const tweetList = []
        let i = 0;
        while(i < userList.length) {
            let tweet = await TweetList.findOne({user: userList[i].profile.user})
                                        .populate({
                                            path: 'tweets.tweet',
                                            populate: {
                                                path: 'profile',
                                                select: 'name icon',
                                                populate: {
                                                    path: 'user',
                                                    select: 'username'
                                                }
                                            }
                                        })
                                        .populate('tweets.retweetedBy', 'name user');
            tweetList.unshift(...tweet.tweets);

            i++;
        }
        tweetList.sort(compare);

        res.status(200).json({tweetList});
    } catch(err) {
        console.log(err.message);
        res.status(500).send('error');
    }
});

module.exports = router;