import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
export default upload;

const storage = multer.diskStorage({
    filename:function(req,file,callback){
        callback(null,file.originalname)
    }
})

const upload =multer({storage})

export default upload
