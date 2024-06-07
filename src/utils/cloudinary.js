// our file system works with Links and unlinks. Deleting is done via unlinking a file from its directory.
// We aree implementing a approach where when user uploads a file it will first come into our local server and then
// will be uploaded to cloudinary



import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

async function uploadImageToCloudinary() {
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    
    // Path to the image file on your local server
    const localFilePath = 'path/to/your/local/image.jpg';
    
    try {
        // Check if the file exists
        if (!fs.existsSync(localFilePath)) {
            throw new Error('File not found!');
        }

        // Upload the image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        });
        
        console.log('Upload Result:', uploadResult.url);
        return uploadResult
    
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.error('Error uploading the image:', error);
    }
}

// Call the function
uploadImageToCloudinary();
