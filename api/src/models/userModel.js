const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
    {
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },
        user_id: {
            type: String,
            default: function() {
                return this._id
            }
        },
        resetToken: {
            type: String,
            default: null
        },
        resetTokenExpiry: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
)

userSchema.index({ email: 1, status: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
