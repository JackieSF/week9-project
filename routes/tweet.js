const express = require('express');
const auth = require('../middleware/auth');
const deleteTweet = require('../utilities/deleteTweet');
const {check, validationResult} = require('express-validator');
const Tweet = require('../models/Tweet');
const TweetList = require('../models/TweetList');
const Like = require('../models/Like');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');
const router = express.Router();

router.post('/', [auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const tweetList = await TweetList.findOne({user: req.user.id});
        let tweet = await Tweet.create({profile: req.user.profile, text: req.body.text});

        tweetList.tweets.unshift({tweet: tweet.id, type: 'tweet'});
        await tweetList.save();
        tweet = await tweetList.populate({
            path: 'tweets.tweet',
            populate: {
                path: 'profile',
                select: 'name icon',
                populate: {
                    path: 'user',
                    select: 'username'
                }
            }
        }).execPopulate();

        res.status(200).json({tweet: tweet.tweets[0]});
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:tweetId', auth, async (req, res) => {
    try {
        // get tweet
        const tweet = await Tweet.findById(req.params.tweetId)
                                    .populate({
                                        path: 'profile',
                                        select: 'name icon',
                                        populate: {
                                            path: 'user',
                                            select: 'username'
                                        }
                                    })
                                    .populate({
                                        path: 'replies.profile',
                                        select: 'name icon',
                                        populate: {
                                            path: 'user',
                                            select: 'username'
                                        }
                                    })
                                    .populate({
                                        path: 'retweets.profile',
                                        select: 'name icon bio',
                                        populate: {
                                            path: 'user',
                                            select: 'username'
                                        }
                                    })
                                    .populate({
                                        path: 'likes.profile',
                                        select: 'name icon bio',
                                        populate: {
                                            path: 'user',
                                            select: 'username'
                                        }
                                    });
        if(!tweet) {
            return res.status(404).json({msg: 'Tweet not found'});
        }

        res.status(200).json({tweet});
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

router.delete('/:tweetId', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.tweetId);
        if(!tweet) {
            return res.status(404).json({msg: 'Tweet not found'});
        }
        if(tweet.profile.toString() !== req.user.profile) {
            return res.status(401).json({msg: 'Unauthorized'});
        }
        tweet.retweets.unshift({profile: {_id: req.user.profile, user: req.user.id}});
        await tweet.populate('likes.profile', 'user')
                    .populate('retweets.profile', 'user')
                    .execPopulate();
        await tweet.deleteOne();
        res.status(200).json({msg: 'Tweet deleted'});
    } catch(err) {
        console.log(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Invalid ID'})
        }
        res.status(500).send('Server error');
    }
});

router.put('/:tweetId/like', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.tweetId);
        if(!tweet) {
            return res.status(404).json({msg: 'Tweet not found'});
        }
        const like = await Like.findOne({user: req.user.id});
        let removeIndex = tweet.likes.map(val => val.profile.toString()).indexOf(req.user.profile);

        if(removeIndex !== -1) {
            tweet.likes.splice(removeIndex, 1);
            removeIndex = like.likes.map(val => val.tweet.toString()).indexOf(req.params.tweetId);
            like.likes.splice(removeIndex, 1);
            await tweet.save();
            await like.save();
        } else {
            tweet.likes.unshift({profile: req.user.profile});
            like.likes.unshift({tweet: req.params.tweetId});
            await tweet.save();
            await like.save();
        }

        const profile = await Profile.findById(req.user.profile)
                                        .select('name icon bio')
                                        .populate('user', 'username');

        res.status(200).json({profile});
    } catch(err) {
        console.log(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Invalid ID'});
        }

        res.status(500).send('Server error');
    }
});

router.put('/:tweetId/retweet', auth, async (req, res) => {
    try {
        let tweet = await Tweet.findById(req.params.tweetId);
        if(!tweet) {
            return res.status(404).json({msg: 'Tweet not found'});
        }
        const tweetList = await TweetList.findOne({user: req.user.id});
        let removeIndex = tweetList.tweets.map(val => val.tweet.toString()).indexOf(req.params.tweetId);

        if(removeIndex !== -1 && tweetList.tweets[removeIndex].type === 'retweet')
            tweetList.tweets.splice(removeIndex, 1);
            removeIndex = tweet.retweets.map(val => val.profile.toString()).indexOf(req.user.profile);
            tweet.retweets.splice(removeIndex, 1);
            await tweetList.save();
            await tweet.save();
        } 
        finally {
            tweetList.tweets.unshift({
                tweet: req.params.tweetId,
                type: 'retweet',
                retweetedBy: req.user.profile
            });
            tweet.retweets.unshift({profile: req.user.profile});
            await tweetList.save();
            await tweet.save();
        }

        tweet = await tweet.populate({
            path: 'profile',
            select: 'name icon bio',
            populate: {
                path: 'user',
                select: 'username'
            }
        }).execPopulate();
        
        const _id = mongoose.Types.ObjectId();

        const retweet = {
            _id,
            tweet,
            type: 'retweet',
            retweetedBy: {
                _id: req.user.profile,
                user: req.user.id,
                name: tweet.profile.name
            },
            date: tweet.date
        }

        res.status(200).json({retweet});
    },
});

router.post('/:tweetId/reply', [auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        let tweet = await Tweet.findById(req.params.tweetId);
        if(!tweet) {
            return res.status(404).json({msg: 'Tweet not found'});
        }
        tweet.replies.unshift({profile: req.user.profile, text: req.body.text});
        await tweet.save();
        tweet = await tweet.populate({
            path: 'replies.profile',
            select: 'name icon',
            populate: {
                path: 'user',
                select: 'username'
            }
        }).execPopulate();

        res.status(200).json({reply: tweet.replies[0]});
    } catch(err) {
        console.log(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Invalid ID'});
        }

        res.status(500).send('Server error');
    }
});

router.delete('/:tweetId/reply/:replyId', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.tweetId);
        if(!tweet) {
            return res.status(404).json({msg: ' not found'});
        }
        const index = tweet.replies.map(val => val._id.toString()).indexOf(req.params.replyId);
        if(index === -1) {
            return res.status(404).json({msg: ' not found'});
        }
        const correctUser = tweet.replies[index].profile.toString() === req.user.profile;
        if(!correctUser) {
            return res.status(401).json({msg: 'Unauthorized'});
        }
        tweet.replies.splice(index, 1);
        await tweet.save();
        res.status(200).json({msg: ' deleted'});
    } catch(err) {
        console.log(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Invalid ID'});
        }

        res.status(500).send(' error');
    }
});

module.exports = router;