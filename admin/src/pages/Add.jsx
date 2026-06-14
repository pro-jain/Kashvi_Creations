import React from 'react';
import { assets } from '../assets/assets';
import { useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from "react-toastify";

const Add = ({ token }) => {

  // Image states
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Product data states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Women");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [colors, setColors] = useState("");
  const [stock, setStock] = useState({
    S: 10,
    M: 10,
    L: 10,
    XL: 10,
    XXL: 10
  });

  // Handle image selection and upload to Vercel Blob
  const handleImageChange = async (e, setImageFunction, imageKey) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set local preview
    setImageFunction(file);

    // Show preview
    const preview = URL.createObjectURL(file);
    console.log(`Image ${imageKey} preview ready`);
  };

  // Upload images to Vercel Blob before submitting
  const uploadImagesToBlob = async () => {
    const images = [image1, image2, image3, image4].filter(img => img);

    if (images.length === 0) {
      toast.error("Please select at least one image");
      return null;
    }

    setUploadingImages(true);

    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(
        `${backendUrl}/api/upload`,
        formData,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        toast.success(`${images.length} image(s) uploaded successfully`);
        setUploadingImages(false);
        return response.data.urls; // Returns array of URLs from Vercel Blob
      } else {
        toast.error(response.data.message);
        setUploadingImages(false);
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload images: ${error.message}`);
      setUploadingImages(false);
      return null;
    }
  };

  // Handle stock change
  const handleStockChange = (value) => {
    setStock(prev => ({
      ...prev,
      S: parseInt(value) || 0
    }));
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (uploadingImages) {
      toast.error("Please wait for images to upload");
      return;
    }

    if (!price || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      // Upload images to Vercel Blob first
      const imageUrls = await uploadImagesToBlob();
      if (!imageUrls) {
        return; // Upload failed
      }

      // Create form data with image URLs
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("colors", colors);
      formData.append("stock", JSON.stringify(stock));

      // Append image URLs instead of files
      imageUrls.forEach((url, index) => {
        formData.append(`imageUrl${index + 1}`, url);
      });

      // Send to backend
      const response = await axios.post(
        `${backendUrl}/api/product/add`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setName('');
        setDescription('');
        setPrice('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setCategory('Women');
        setSubCategory('Topwear');
        setBestseller(false);
        setColors('');
        setStock({ S: 10, M: 10, L: 10, XL: 10, XXL: 10 });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to add product");
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      {/* Image Upload Section */}
      <div>
        <p className='mb-2 font-semibold'>Upload Images (to Vercel Blob)</p>
        <div className='flex gap-2'>
          {[
            { state: image1, setter: setImage1, id: 'image1', key: 1 },
            { state: image2, setter: setImage2, id: 'image2', key: 2 },
            { state: image3, setter: setImage3, id: 'image3', key: 3 },
            { state: image4, setter: setImage4, id: 'image4', key: 4 }
          ].map((img) => (
            <label key={img.id} className='cursor-pointer'>
              <img
                className='w-20 h-20 object-cover border-2 border-gray-300 rounded'
                src={!img.state ? assets.upload_area : URL.createObjectURL(img.state)}
                alt={`preview-${img.key}`}
              />
              <input
                onChange={(e) => handleImageChange(e, img.setter, img.key)}
                type="file"
                id={img.id}
                hidden
                accept="image/*"
              />
            </label>
          ))}
        </div>
        <p className='text-sm text-gray-500 mt-2'>✨ Images will be uploaded to Vercel Blob</p>
      </div>

      {/* Product Name */}
      <div className='w-full'>
        <p className='mb-2'>Product Name *</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded'
          type='text'
          placeholder='Enter product name'
          required
        />
      </div>

      {/* Product Description */}
      <div className='w-full'>
        <p className='mb-2'>Product Description *</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded'
          placeholder='Enter product description'
          rows='3'
          required
        />
      </div>

      {/* Price */}
      <div className='w-full'>
        <p className='mb-2'>Price (USD) *</p>
        <input
          onChange={(e) => setPrice(e.target.value)}
          value={price}
          className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded'
          type='number'
          step='0.01'
          placeholder='Enter price'
          required
        />
      </div>

      {/* Category and SubCategory */}
      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Category *</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className='px-3 py-2 border border-gray-300 rounded'
          >
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub Category *</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            value={subCategory}
            className='px-3 py-2 border border-gray-300 rounded'
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Footwear">Footwear</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

    

      {/* Colors */}
      <div className='w-full'>
        <p className='mb-2'>Available Colors (comma-separated)</p>
        <input
          onChange={(e) => setColors(e.target.value)}
          value={colors}
          className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded'
          type='text'
          placeholder='Red,Blue,Black,White'
        />
      </div>

      

      {/* Bestseller Checkbox */}
      <div className='flex gap-2 mt-2'>
        <input
          onChange={() => setBestseller(prev => !prev)}
          checked={bestseller}
          type='checkbox'
          id='bestseller'
        />
        <label className='cursor-pointer' htmlFor="bestseller">
          Mark as bestseller
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploadingImages}
        className={`w-28 py-3 mt-4 rounded text-white font-semibold ${
          uploadingImages
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800'
        }`}
      >
        {uploadingImages ? 'Uploading...' : 'ADD PRODUCT'}
      </button>
    </form>
  );
};

export default Add;