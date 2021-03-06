const express = require('express');
const auth = require('../middleware/auth');
const TweetList = require('../models/TweetList');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        let retweets = await TweetList.findOne({user: req.user.id});

        retweets = retweets.tweets.filter(tweet => tweet.type === 'retweet')
                                    .map(tweet => ({tweet: tweet.tweet}));

        res.status(200).json({retweets: retweets});
    } catch(err) {
        console.log(err.message);
        res.status(500).send('error');
    }
});

module.exports = router;