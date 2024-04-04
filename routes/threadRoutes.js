var express = require('express')
var Thread = require("/models/thread.js")
var threadRoutes = express.Router();

threadRoutes.use(express.json());

// Create Thread
threadRoutes.post("/createThread", async (req, res) => {
    try {
        const newThread = new Thread({
          ...req.body
        });
        await newThread.save();
        res.status(201).json(newThread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve All Threads
threadRoutes.get("/view", async (req, res) => {
    try {
        const threads = await Thread.find();
        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve Single Thread by ID
threadRoutes.get("/view/:id", async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json(thread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Thread
threadRoutes.put("/updateThread/:id", async (req, res) => {
    try {
        // Retrieve the existing thread from the database
        const existingThread = await Thread.findById(req.params.id);
        if (!existingThread) {
            return res.status(404).json({ message: "Thread not found" });
        }

        // Merge the updated fields with the existing fields
        const updatedFields = { ...existingThread.toObject(), ...req.body };

        // Update the thread with the merged fields
        const updatedThread = await Thread.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
        if (!updatedThread) {
            return res.status(404).json({ message: "Thread not found" });
        }

        res.status(200).json(updatedThread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//Add Like
threadRoutes.put("/addLike/:id", async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }

        // Increment threadLikes by 1
        thread.threadLikes += 1;
        
        // Save the updated thread document
        const updatedThread = await thread.save();

        res.status(200).json(updatedThread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
threadRoutes.put("/deleteLike/:id", async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }

        // Increment threadLikes by 1
        thread.threadLikes -= 1;
        
        // Save the updated thread document
        const updatedThread = await thread.save();

        res.status(200).json(updatedThread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Thread
threadRoutes.delete("/deleteThread/:id", async (req, res) => {
    try {
        const deletedThread = await Thread.findByIdAndDelete(req.params.id);
        if (!deletedThread) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = threadRoutes