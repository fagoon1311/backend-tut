import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MonngoDB connected DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error", error);
        process.exit(1)    // given to us by node to exit any process while facing any error.
    }
}


export default connectDB