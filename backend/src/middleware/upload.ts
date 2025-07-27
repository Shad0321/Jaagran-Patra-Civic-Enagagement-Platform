import multer from 'multer';

// Use memory storage for multer
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type based on fieldname
  if (file.fieldname === 'images') {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  } else if (file.fieldname === 'voiceNote') {
    // Allow only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 6, // Max 5 images + 1 voice note
  },
});

// Middleware for issue creation with file uploads
export const uploadIssueFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'voiceNote', maxCount: 1 },
]);

// Error handling middleware for multer
export const handleUploadError = (
  error: any,
  req: any,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum 5 images and 1 voice note allowed.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error.message.includes('Only image files are allowed')) {
    return res
      .status(400)
      .json({ error: 'Only image files are allowed for images field.' });
  }

  if (error.message.includes('Only audio files are allowed')) {
    return res
      .status(400)
      .json({ error: 'Only audio files are allowed for voice note field.' });
  }

  return res.status(400).json({ error: error.message });
};

export default upload;
