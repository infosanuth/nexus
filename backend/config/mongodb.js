import mongoose from "mongoose";

// const connectDB = async ()=> {

//     mongoose.connection.on('connected', () => console.log("Database Connected"))

//     await mongoose.connect(`${process.env.MONGODB_URI}/nexus`)
// }


const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("Database Connected"))

    await mongoose.connect(`${process.env.MONGODB_URI}/nexus`)

  } catch (error) {
    console.error(" Failed to connect to MongoDB", error);
  
  }
};
export default connectDB