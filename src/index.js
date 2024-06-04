// never connect db in one line always use async await and try/catch.
import dotenv from "dotenv"

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
