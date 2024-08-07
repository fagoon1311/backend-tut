import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadImageToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { stringify } from "flatted"
import jwt from "jsonwebtoken"

// Steps to write controller/logic for registering user.
// 1) get user details from frontend. (we can use postman.)
// 2) validations to check format or user has sent data in proper format or Not.
// 3) check if user already exists.
// 4) check fo images , check for avatar.
// 5) upload them to cloduinary, avatar.
// 6) create an user object to send it into mongoDB - create entry in de.
// 7) remove password and refresh token from response that is sent to user.
// 8) check response is recieved or not. (checking if user is created/not).
// 9) return response.

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        
        const accessToken = user.generateAccessToken()
        
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // save despite any validation fails

        return {accessToken, refreshToken}   
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}

const registerUser = asyncHandler( async (req, res)=>{
    // res.status(200).json({  
    //     message:"ok"
    // })
    
    // getting user details
    const {fullName, email, username, password}=req.body
    console.log("email", email)

    // validation
    if(
        [fullName, email, username, password].some((field)=>field?.trim() === '')
    ){
        throw new ApiError(400, "All fields are compulsory.")
    }

    // check if user exists already.
    // we can umport our user model since its created using mongoose it provides us with diff methiods.
    const existingUser = await User.findOne({
        $or:[{username},{email}]  // this is a way to seaarch for multiple fields. (we can seearch wfor single field as well.)
    })

    if(existingUser){
        throw new ApiError(409, "User already Exists")
    }

    // images , avatars
    const avatarLocalPath = req.files?.avatar[0]?.path //given by multer to handle files.  here multer middle ware will take file to our local server and provide us with the file name.
 //   const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required") 
    }


    // upload to cloudinary
    const avatar = await uploadImageToCloudinary(avatarLocalPath) // image size could take time to upload so we need an await.
    const coverImage = await uploadImageToCloudinary(coverImageLocalPath)

    if((!avatar)){
        throw new ApiError(400, "Avatar is required.")
    }

    // entruy in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    }) 

    const created = await User.findById(user._id).select(
        "-password -refreshToken"      // select selects all data using - we exclude.
    )

    if(!created){
        throw new ApiError(500, "Something went wrong while registering a user.")
    }
    return res.status(201).json(
        new ApiResponse(200, created, "User Created succesfully.")
    )
})

const loginUser = asyncHandler(async (req, res)=>{
    // req body -> data
    // username or email
    // find the user
    // pass check
    // acces and refreshtoken
    // send cookies
    const {email, username, password} = req.body
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}] // finds on basis of anyone and returns 
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true   // these two allow cookies to not be mutable via front end. Can only be done viea the server
    }

    
    return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    JSON.parse(stringify(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in Successfully"
      )
    )))

})

const logoutUser = asyncHandler(async(req, res) => {
    // clear the cookies first
    // reset the refresh tokens
    // the biggest prob is we dont have access to our user here and it does
    // not make sense to make user fill a form again to fetch his records from db.
    // middleware comes in rol here.
    // we designed a middleware that verifies jwt token and appends an user object to so now wee have acces to -
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken: undefined
            }
        },
        {
            new: true // this sennds new values that are updated
        }
    )
    const options = {
        httpOnly: true,
        secure: true   // these two allow cookies to not be mutable via front end. Can only be done viea the server
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))

})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken    // in mobile devices we do not recive in cookies we recieve in body object.
    // to refresh first we our accessing our current refresh Tkoen
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh TOken")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(
            new ApiResponse(
                200, {accessToken, newRefreshToken}, "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body
    // if we are able to achange pass that means we are logged in. If we are logged in then def we have users access from our middleware.
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Ivanlid password")
    }
    user.password = newPassword 
    await user.save({validateBeforeSave:false})
    return res 
    .status(200)
    .json(
        new ApiResponse (200, {}, "Password Changed Successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All field are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id
        ,
        {
            $set:{
                fullName, email:email
            }
        },
        {new:True}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadImageToCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading Avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse (200, user, "Avatar updated succesfuully")
    )
})

const updateUserCover = asyncHandler(async(req, res)=>{
    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
        throw new ApiError(400, "Cover image is missing")
    }
    const coverImage = await uploadImageToCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                cover: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse (200, user, "Cover image updated succesfuully")
    )
})


const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    } 
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel", 
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber", 
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if:{
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        } 
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched")
    )
})

export {
    getUserChannelProfile,
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCover
}