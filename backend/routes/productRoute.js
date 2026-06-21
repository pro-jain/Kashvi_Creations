import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct } from '../controllers/productController.js'
import adminAuth from '../middleware/adminAuth.js'
import multer from 'multer'

const productRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

productRouter.post('/add', adminAuth, upload.none(), addProduct);  // upload.none() parses FormData fields with no files
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);

export default productRouter
