import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
 // cors is to allow people to interact with our backend
 // cookie parser  is to allow cookies as well as to interact with cookies of the user.

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))  // use is used for all the middlewares. 
// this is the default cors setup if you want to add custom allowed urls you can use origin param.

//data can come in multiopke ways like JSON, from forms. We do not want data to come in much bulk so as our server crashes so we always
// put in a limit

app.use(express.json({limit: "16kb"}))  //express allows us to limit the incoming json size. here we are accepting json.

// when data comes from URL it cause issue because at multiple places url encoders are diff so it might cause issue so we have to tell that
// too so that our app acccepts/understands the url.
app.use(express.urlencoded({extended:true, limit:"16kb"}))

app.use(express.static('public')) // to store some public assets to store any kind of files which can be accessed bu anyone.

app.use(cookieParser()) //to access cookies of brower of an user.


// routes import
import userRouter from './routes/user.routes.js'

// routes declare
// here we can not use app .get because when we made a basic proj the routes was defined within the file. npw we need middlewares.
app.use("/api/v1/users", userRouter)  // this is a std pratice to use api/v1 prefix. here we are saying that on users router give control to userRouter.
// which will then give control to as per URl

export { app }


