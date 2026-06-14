import productModel from "../models/productModel.js";
import { uploadImages } from "../services/imageUploadService.js";

// Function to add a product
const addProduct = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            price, 
            category, 
            subCategory, 
            bestseller,
            stock,
            colors,
            rating,
            reviews,
            imageUrl1,
            imageUrl2,
            imageUrl3,
            imageUrl4
        } = req.body;

        // Validate price
        if (!price || price <= 0) {
            return res.json({ success: false, message: "Price is required and must be greater than 0" });
        }

        // Get image URLs - either from pre-uploaded URLs or upload files now
        let imagesUrl = [];

        // Check if image URLs were already uploaded to Vercel Blob
        if (imageUrl1 || imageUrl2 || imageUrl3 || imageUrl4) {
            // Use pre-uploaded URLs from Vercel Blob
            imagesUrl = [imageUrl1, imageUrl2, imageUrl3, imageUrl4].filter(url => url);
            console.log("Using pre-uploaded URLs:", imagesUrl);
        } else {
            // Fallback: Extract files and upload them
            const images = Object.keys(req.files || {})
                .filter((key) => ["image1", "image2", "image3", "image4"].includes(key))
                .flatMap((key) => req.files[key] || []);

            if (images.length === 0) {
                return res.json({ success: false, message: "At least one image is required" });
            }

            // Upload images using flexible service
            try {
                imagesUrl = await uploadImages(images);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                return res.json({ success: false, message: `Image upload failed: ${uploadError.message}` });
            }
        }

        // Parse stock if it's a string (from form data)
        let parsedStock = stock || { S: 10, M: 10, L: 10, XL: 10, XXL: 10 };
        if (typeof stock === 'string') {
            try {
                parsedStock = JSON.parse(stock);
            } catch (e) {
                parsedStock = { S: 10, M: 10, L: 10, XL: 10, XXL: 10 };
            }
        }

        
        // Parse colors if it's a string
        let parsedColors = colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : [];

        // Construct product data
        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            bestseller: bestseller === "true" || bestseller === true,
            images: imagesUrl,
            stock: parsedStock,
            colors: parsedColors,
            rating: rating ? Number(rating) : 0,
            reviews: reviews ? Number(reviews) : 0,
            date: Date.now(),
        };

        console.log("Product data:", productData);

        // Save product to database
        const product = new productModel(productData);
        await product.save();

        return res.json({ success: true, message: "Product added successfully", product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Function to list all products
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        return res.json({ success: true, products }); // ✅ Added return
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message }); // ✅ Proper error response
    }
};

// Function to remove a product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message }); // ✅ Proper error response
    }
};

// Function to get single product details
const singleProduct = async (req, res) => {
    try {
        
        const {productId}=req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message})
    }
};

export { listProducts, addProduct, removeProduct, singleProduct };
