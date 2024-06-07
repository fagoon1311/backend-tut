// never connect db in one line always use async await and try/catch.
import dotenv from "dotenv"

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on : ${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log("MONGO DB Connection failed:", err)
})
