import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async(req, res) => {
    // res.status(200).json({
    //     message: "tcode"
    // })
    //get user details from frontend
    //validation - not empty
    //check if user already exists: email,username
    //check for images&avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password & refreshtoken from response
    //check for user creation
    //return response

    const {fullname, email, password, username} = req.body
    console.log("email: ",email);

    // if (fullname === "") {
    //     throw new ApiError(400, "full name is required")
    // }
  
    if ([fullname, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are necessary");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    // File paths from multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatarUploadResult = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUploadResult = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (!avatarUploadResult?.url) {
        throw new ApiError(400, "Failed to upload avatar to Cloudinary");
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatarUploadResult.url, // ✅ write it here
        coverImage: coverImageUploadResult?.url || ""
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export { registerUser }