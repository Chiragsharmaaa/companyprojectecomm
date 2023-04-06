const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const User = require('../models/user');

function generateAccessToken(id, name) {
    return jwt.sign({ userId: id, name: name }, process.env.JWT_SECRET);
};

exports.postSignup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findAll({ where: { email } });
        if (user.length > 0) {
            return res.status(550).json({ message: 'user already exists!' });
        };

        const saltRounds = 10;

        bcrypt.hash(password, saltRounds, async (err, hash) => {
            await User.create({ name, email, password: hash });
            return res.status(201).json({ message: 'user created!' });
        });

    } catch (err) {
        res.status(500).json(err);
    };
};

exports.postLogin = async (req, res, next) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Enter all fields' })
        };
        const user = await User.findAll({ where: { email } })
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        };
        const existingUser = user[0];
        bcrypt.compare(password, existingUser.password, (err, result) => {
            if (err) {
                return res.status(401).json({ message: 'User not authorized!' });
            };
            return res.status(200).json({ message: 'Successfully Logged-in!', token: generateAccessToken(existingUser.id, existingUser.name) });
        });
    } catch (err) {
        return res.status(500).json({ message: err, success: false });
    };
};