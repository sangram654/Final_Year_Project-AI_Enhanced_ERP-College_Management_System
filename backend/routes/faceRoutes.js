const express = require('express');
const multer = require('multer');
const canvas = require('canvas');
const { faceapi } = require('../utils/face');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const faceController = require('../controllers/faceController');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// 🔥 REGISTER FACE (Updated)
router.post('/register-face', upload.single('face'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const img = await canvas.loadImage(req.file.path);
        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ message: 'No face detected' });
        }

        const descriptor = Array.from(detection.descriptor);
        
        // Model ke hissab se update karein
        const user = await User.findById(req.body.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.faceDescriptor = descriptor;
        user.faceImage = req.file.path; // Agar aap image path save karna chahte hain
        
        await user.save();

        res.json({ success: true, message: 'Face Registered Successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// 🔥 FACE ATTENDANCE
router.post('/mark-face-attendance', upload.single('face'), async (req, res) => {
    try {
        const img = await canvas.loadImage(req.file.path);

        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return res.status(400).json({ message: 'No face detected' });
        }

        const inputDescriptor = detection.descriptor;

        const users = await User.find({ faceDescriptor: { $exists: true } });

        let bestMatch = null;
        let minDistance = 1;

        users.forEach(user => {
            const dist = faceapi.euclideanDistance(
                inputDescriptor,
                user.faceDescriptor
            );

            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = user;
            }
        });

        if (!bestMatch || minDistance > 0.5) {
            return res.status(401).json({ message: 'Face not recognized' });
        }

        const attendance = await Attendance.create({
            student: bestMatch._id,
            method: 'face',
            confidence: (1 - minDistance).toFixed(2)
        });

        res.json({
            message: 'Attendance Marked',
            name: bestMatch.name
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;