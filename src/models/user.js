const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email must be valid!')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.includes('password')) {
                throw Error('Weak password!')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign( {_id: user._id.toString() }, 'helloworld');
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw Error('Unable to login!');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw Error('Unable to login!');
    }

    return user;
}



//Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User
