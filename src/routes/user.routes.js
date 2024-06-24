//creating a router for users
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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



export default router