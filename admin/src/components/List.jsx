import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setList(response.data.products.reverse()); // newest first
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('Product removed');
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">All Products</h2>
        <span className="text-sm text-gray-500">{list.length} items</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No products yet</p>
          <p className="text-sm mt-1">Add your first product using the sidebar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[80px_1fr_120px_100px_80px_60px] gap-3 items-center px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Image</span>
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock (S)</span>
            <span className="text-center">Del</span>
          </div>

          {list.map((item, index) => (
            <div
              key={item._id}
              className={`grid grid-cols-[80px_1fr] md:grid-cols-[80px_1fr_120px_100px_80px_60px] gap-3 items-center px-4 py-3 text-sm ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              } border-t border-gray-100`}
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>

              {/* Name + sub info */}
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.subCategory}</p>
                {item.bestseller && (
                  <span className="inline-block text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-1">
                    Bestseller
                  </span>
                )}
              </div>

              {/* Category */}
              <p className="hidden md:block text-gray-600">{item.category}</p>

              {/* Price */}
              <p className="hidden md:block font-medium">₹{item.price?.toLocaleString()}</p>

              {/* Stock S size */}
              <p className="hidden md:block text-gray-500">{item.stock?.S ?? '—'}</p>

              {/* Delete */}
              <button
                onClick={() => removeProduct(item._id, item.name)}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors mx-auto"
                title="Remove product"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default List;
