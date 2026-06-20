import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [images, setImages] = useState([null, null, null, null]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Women');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [bestseller, setBestseller] = useState(false);
  const [colors, setColors] = useState('');
  const [stock, setStock] = useState({ S: 10, M: 10, L: 10, XL: 10, XXL: 10 });

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
    // Reset upload state when new image selected
    setUploadDone(false);
    setUploadedUrls([]);
  };

  const handleStockChange = (size, value) => {
    setStock(prev => ({ ...prev, [size]: parseInt(value) || 0 }));
  };

  // Step 1: Upload images to Vercel Blob via backend /api/upload
  const uploadImages = async () => {
    const selectedImages = images.filter(Boolean);
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return false;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((img, i) => formData.append(`image${i + 1}`, img));

      const res = await axios.post(`${backendUrl}/api/upload`, formData, {
        headers: { token, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadedUrls(res.data.urls);
        setUploadDone(true);
        toast.success(`${res.data.urls.length} image(s) uploaded to Vercel Blob ✓`);
        return true;
      } else {
        toast.error(res.data.message || 'Upload failed');
        return false;
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Submit product with already-uploaded Blob URLs stored in MongoDB
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!uploadDone || uploadedUrls.length === 0) {
      toast.error('Please upload images first');
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('colors', colors);
      formData.append('stock', JSON.stringify(stock));
      // Send Vercel Blob URLs — backend stores these in MongoDB images[]
      uploadedUrls.forEach((url, i) => formData.append(`imageUrl${i + 1}`, url));

      const res = await axios.post(`${backendUrl}/api/product/add`, formData, {
        headers: { token },
      });

      if (res.data.success) {
        toast.success('Product added successfully!');
        // Reset form
        setName(''); setDescription(''); setPrice('');
        setImages([null, null, null, null]);
        setUploadedUrls([]); setUploadDone(false);
        setCategory('Women'); setSubCategory('Topwear');
        setBestseller(false); setColors('');
        setStock({ S: 10, M: 10, L: 10, XL: 10, XXL: 10 });
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-5">
      <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>

      {/* ── IMAGE UPLOAD ── */}
      <div className="w-full">
        <p className="mb-2 font-medium text-gray-700">Product Images</p>
        <div className="flex gap-3 flex-wrap">
          {images.map((img, index) => (
            <label key={index} className="cursor-pointer relative group">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 hover:border-black transition-colors">
                {img ? (
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`preview-${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={assets.upload_area} alt="upload" className="w-10 h-10 opacity-40" />
                )}
                {uploadDone && img && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <span className="text-green-700 text-xl font-bold">✓</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-gray-400 mt-1">Image {index + 1}</p>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImageChange(e, index)}
              />
            </label>
          ))}
        </div>

        {/* Upload to Blob button */}
        <button
          type="button"
          onClick={uploadImages}
          disabled={uploading || uploadDone}
          className={`mt-3 px-5 py-2 rounded text-sm font-medium transition-colors ${
            uploadDone
              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
              : uploading
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {uploadDone
            ? `✓ ${uploadedUrls.length} image(s) uploaded to Vercel Blob`
            : uploading
            ? 'Uploading…'
            : 'Upload Images to Vercel Blob'}
        </button>
        {uploadDone && (
          <p className="text-xs text-gray-400 mt-1">
            URLs saved — they'll be linked to this product in MongoDB on submit.
          </p>
        )}
      </div>

      {/* ── NAME ── */}
      <div className="w-full">
        <p className="mb-1 font-medium text-gray-700">Product Name <span className="text-red-500">*</span></p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          type="text"
          placeholder="e.g. Silk Embroidered Saree"
          required
        />
      </div>

      {/* ── DESCRIPTION ── */}
      <div className="w-full">
        <p className="mb-1 font-medium text-gray-700">Description <span className="text-red-500">*</span></p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          rows="3"
          placeholder="Describe the product, fabric, occasion…"
          required
        />
      </div>

      {/* ── PRICE ── */}
      <div className="w-full">
        <p className="mb-1 font-medium text-gray-700">Price (₹) <span className="text-red-500">*</span></p>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-40 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          type="number"
          min="1"
          step="1"
          placeholder="0"
          required
        />
      </div>

      {/* ── CATEGORY / SUBCATEGORY ── */}
      <div className="flex gap-6 flex-wrap">
        <div>
          <p className="mb-1 font-medium text-gray-700">Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          >
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div>
          <p className="mb-1 font-medium text-gray-700">Sub Category</p>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Footwear">Footwear</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* ── STOCK PER SIZE ── */}
      <div className="w-full">
        <p className="mb-2 font-medium text-gray-700">Stock per Size</p>
        <div className="flex gap-3 flex-wrap">
          {Object.keys(stock).map((size) => (
            <div key={size} className="flex flex-col items-center">
              <label className="text-xs text-gray-500 mb-1 font-semibold">{size}</label>
              <input
                type="number"
                min="0"
                value={stock[size]}
                onChange={(e) => handleStockChange(size, e.target.value)}
                className="w-16 text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-black text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── COLORS ── */}
      <div className="w-full">
        <p className="mb-1 font-medium text-gray-700">Available Colors</p>
        <input
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
          type="text"
          placeholder="Red, Blue, Black (comma-separated)"
        />
      </div>

      {/* ── BESTSELLER ── */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={bestseller}
          onChange={() => setBestseller((p) => !p)}
          className="w-4 h-4 accent-black"
        />
        <span className="text-gray-700">Mark as Bestseller</span>
      </label>

      {/* ── SUBMIT ── */}
      <button
        type="submit"
        disabled={submitting || !uploadDone}
        className={`px-8 py-3 rounded font-semibold text-white transition-colors ${
          submitting || !uploadDone
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800'
        }`}
      >
        {submitting ? 'Saving…' : 'Add Product'}
      </button>
      {!uploadDone && (
        <p className="text-xs text-amber-600">⚠ Upload images first, then submit.</p>
      )}
    </form>
  );
};

export default Add;
