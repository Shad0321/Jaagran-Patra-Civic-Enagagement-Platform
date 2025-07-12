import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'others';
    
    if (file.fieldname === 'images') {
      subfolder = 'images';
    } else if (file.fieldname === 'voiceNote') {
      subfolder = 'audio';
    }
    
    const uploadPath = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

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
  }
});

// Middleware for issue creation with file uploads
export const uploadIssueFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'voiceNote', maxCount: 1 }
]);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 images and 1 voice note allowed.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: 'Only image files are allowed for images field.' });
  }
  
  if (error.message.includes('Only audio files are allowed')) {
    return res.status(400).json({ error: 'Only audio files are allowed for voice note field.' });
  }
  
  return res.status(400).json({ error: error.message });
};

export default upload;
