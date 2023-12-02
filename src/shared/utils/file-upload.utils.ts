import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const pathUpload = './src/assets/uploads';

export const storage = diskStorage({
  destination: pathUpload,
});

export const imageFileFilter = (req, file, callback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
  }
};

export const customFileInterceptor = (name: string) =>
  FileInterceptor(name, { storage });
