const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination folder exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'problems');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique, sanitized filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  },
});

// File filter: accept images and videos only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/mpeg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Only image and video evidence formats are accepted.`
      ),
      false
    );
  }
};

// 200 MB maximum upload limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
    files: 5, // Up to 5 files per problem
  },
});

module.exports = {
  upload,
  uploadDir,
};
