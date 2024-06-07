import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {  // file is the main thing which is why we use multer.
      cb(null, "./public/temp") // folder where we will keep our files.
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)  // original name should not be used as per recommendation as there may be multple
      //  files with same name and may result in overwriting.
    }
  })
  
export const upload = multer({ storage: storage })