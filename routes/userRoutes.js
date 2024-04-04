const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../models/user.js");
const ObjectId = mongoose.Types.ObjectId;

const userRoutes = express.Router();


// User signup
userRoutes.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: `${username} was added` });
  } catch (error) {
    console.error("Error creating new user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// User login
userRoutes.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    // If user does not exist or password does not match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect username or password" });
    }

    res.status(200).json({
      status: true,
      username: user.username,
      message: `${user.username} was logged in successfully`
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all users
userRoutes.get("/", async (req, res) => {
  try {
    const userList = await User.find();
    res.status(200).json(userList);
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




// Get user profile by _id
userRoutes.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userProfile = await User.findById(userId);
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }
    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user email by _id
userRoutes.put("/profile/:userId/update-email", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Update email
    await User.findByIdAndUpdate(userId, { email });

    res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user password by _id
userRoutes.put("/profile/:userId/update-password", async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = userRoutes;
