import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password, phoneNumber } = req.body;

        // checking for all data to register user
        if (!name || !email || !password || !phoneNumber) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        //validating strong password
        if (phoneNumber.length != 10) {
            return res.json({ success: false, message: "Enter valid phone number" })
        }
        if (phoneNumber[0] !== '0' || phoneNumber[1] !== '7') {
            return res.json({ success: false, message: "Enter valid phone number" });
        }
        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            phoneNumber,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phoneNumber, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phoneNumber || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        // Basic info update
        const updateData = {
            name,
            phoneNumber,
            address: JSON.parse(address),
            dob,
            gender,
        };

        // If image is uploaded, store its path
        if (imageFile) {
            updateData.image = imageFile.path;
        }

        await userModel.findByIdAndUpdate(userId, updateData);

        res.json({ success: true, message: 'Profile Updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
    // console.log('Incoming body:', req.body);
    // console.log('Uploaded image file:', req.file);
    // console.log('User ID from token:', req.body.userId);

}


export { registerUser, loginUser, getProfile, updateProfile }
