import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadImageToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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


export {registerUser}