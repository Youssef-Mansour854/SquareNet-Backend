const cloudinary = require("./cloudinary");
const streamifier = require("streamifier");

/**
 * Uploads a buffer to Cloudinary using streams.
 * @param {Buffer} buffer - The image buffer to upload.
 * @param {string} folder - The Cloudinary folder name.
 * @param {string} publicId - The public ID for the image.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
exports.uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        format: "jpeg",
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
