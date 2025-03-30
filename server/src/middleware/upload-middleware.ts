import { IncomingForm } from 'formidable';
import { Request, Response, NextFunction } from 'express';
import { File } from 'formidable';

// Extend Express Request interface for type safety
declare module 'express' {
  interface Request {
    avatar?: File;
  }
}

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const form = new IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return next(err);
    }
    // console.log('Parsed files:', files); // Debug log to verify file parsing

    // Check if files.avatar exists before proceeding
    const avatarFile = files.avatar;
    if (avatarFile) {
      const file = Array.isArray(avatarFile) ? avatarFile[0] : avatarFile;
      req.avatar = file; // Attach the file to req.avatar
    }
    next();
  });
};