import multer from "multer";

//The main use of Multer is to handle file uploads from an HTML form that includes a file input field

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname); // this code save the file in unique name assingnment
  },
});

// Multer error handler middleware
export const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File size exceeds limit" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(413).json({ message: "Too many files" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected file field" });
    }
  }

  if (err && err.message === "Request aborted") {
    return res.status(400).json({ message: "Upload cancelled by client" });
  }

  next(err);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 2, // Max 2 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});
