const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (optional - can use local storage instead)
const configureCloudinary = () => {
    if (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('☁️  Cloudinary configured');
        return true;
    }
    console.log('📁 Using local file storage (Cloudinary not configured)');
    return false;
};

const uploadToCloudinary = async (filePath, folder = 'erp_system') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return true;
    } catch (error) {
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
};

module.exports = {
    configureCloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    cloudinary,
};
