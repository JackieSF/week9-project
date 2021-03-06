const express = require('express');
const {check, validationResult} = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.post('/', [auth, [
    check('username', 'cannot be blank').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const pattern = new RegExp(req.body.username);

    try {
        const users = await User.find({username: {$regex: pattern, $options: 'i'}})
                                .select('_id')
                                .populate({
                                    path: 'profile',
                                    select: 'name icon bio',
                                    populate: {
                                        path: 'user',
                                        select: 'username'
                                    }
                                });

        res.status(200).json({users});
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;