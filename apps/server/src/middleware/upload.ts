import multer from 'multer';

// Store in memory for forwarding to Cloudinary / Firebase
const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3, WAV, and M4A files are allowed'));
    }
  },
});

export const uploadFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});
