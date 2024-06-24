import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
// in our user model we do not want our passwrods to be visible. we want them to be encrypted fpr that we will use bcrypt.
// direct encryption is not possible so we use a middle care. we will use a PRE hook. This hook can be run before any saving action.
// So like whenbver a user tries to save any name into a db then just before saving it will get encrypted.

const userSchema = new Schema({
    username:{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{
        type:String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type:String, //cludinary URL.
        required: true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type:String,
        required:[true, 'Password is required'],
    },
    refreshToken:{
          type:String,
    }

},{timestamps:true})

// userSchema.pre("save", ()=>{})  // never wrtie arrow fn in the second arg that is the call back function because it does not have 'this' refermece and causes trouble.


// this has one problem that whwver anysave action is there not particular for password it will run. we need to make it run fo only one n only pswrd.
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return 
    this.password = await bcrypt.hash(this.password, 10)
    next()
}) // since encryption takes time so its better to use async


// since pass will be stored encrypted and upon req user will enter paswrd norml so we need to check it. for that we 
// are defining a custom methid.
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)  /// computation takes time so using await.
}

// These are JWT tokens.
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id: this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
        _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)


