const faceapi = require('face-api.js');
const path = require('path');
const canvas = require('canvas');

// Monkey Patching for Node.js environment
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Path ko absolute banane ke liye path.join ka upyog
// Ensure karo ki 'models' folder backend folder ke ek level upar (../) hi hai
const modelPath = path.join(__dirname, '../models');

const loadModels = async () => {
    try {
        // ✅ Backend ke liye hamesha 'loadFromDisk' use karein
        // loadFromUri ko hata kar loadFromDisk kar diya hai
        await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
        
        console.log("✅ Face API Models Loaded Successfully from Disk");
    } catch (error) {
        console.error("❌ Model Loading Error in Backend:", error.message);
        console.log("Current Model Path:", modelPath); // Debugging ke liye path print karega
    }
};

module.exports = { faceapi, loadModels };