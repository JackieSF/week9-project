const express = require('express');
const auth = require('../middleware/auth');
const Like = require('../models/Like');
const router = express.Router();


router.get('/', auth, async (req, res) => {
    try {
        const like = await Like.findOne({user: req.user.id})
                                .populate({
                                    path: 'likes.tweet',
                                    populate: {
                                        path: 'profile',
                                        select: 'name icon',
                                        populate: {
                                            path: 'user',
                                            select: 'username'
                                        }
                                    }
                                });

        res.status(200).json({likes: like.likes})
    } catch(err) {
        console.log(err.message);
        res.status(500).send(' error');
    }
});

module.exports = router;