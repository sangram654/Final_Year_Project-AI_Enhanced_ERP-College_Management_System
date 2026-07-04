const User = require('../models/User');

exports.registerFace = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }

        // 1. Image ka path nikalye
        const imagePath = req.file.path; 

        // 2. Model ke exact names use karein (faceImage)
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
                faceImage: imagePath, // Aapke model mein 'faceImage' hai
                // faceDescriptor: [] // Agar vector data abhi nahi hai to khali array bhej sakte hain
            },
            { new: true } // Isse updated data return hoga
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Face registered successfully!",
            data: updatedUser 
        });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};