//creating a router for users
import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// to store / handle files we need to use our middleware since we can onnly handle data with out a middleware.
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount: 1 
        } 
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)  // here first is middleware thats why it hasnext in it so that it can jum,p to next.
router.route("/refresh-token").post(refreshAccessToken)


export default router