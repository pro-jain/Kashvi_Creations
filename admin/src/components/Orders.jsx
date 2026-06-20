import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App.jsx';
import { toast } from 'react-toastify';

const statusColors = {
  'Order Placed': 'bg-blue-100 text-blue-700',
  'Packing': 'bg-yellow-100 text-yellow-700',
  'Shipped': 'bg-purple-100 text-purple-700',
  'Out for delivery': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-green-100 text-green-700',
};

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    if (!token) { toast.error('Admin login required'); return; }
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/order/list`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.orders.reverse()); // newest first
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Not authorized — please login as admin');
      } else {
        toast.error('Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success('Status updated');
        await fetchAllOrders();
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => { fetchAllOrders(); }, [token]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order, index) => (
            <div
              key={order._id || index}
              className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-start gap-4"
            >
              {/* Parcel icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                📦
              </div>

              {/* Items */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1 mb-2">
                  {order.items?.map((item, idx) => (
                    <span key={idx} className="text-sm text-gray-700">
                      {item.name} × {item.quantity}
                      {idx < order.items.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>

                {/* Address */}
                {order.address && (
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p className="font-medium text-gray-700">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p>{order.address.street}</p>
                    <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                    <p>{order.address.country} · {order.address.phone}</p>
                  </div>
                )}
              </div>

              {/* Right side: amount + status */}
              <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                <p className="font-semibold text-gray-800">
                  ₹{order.amount?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{order.paymentMethod} · {order.payment ? 'Paid' : 'Pending'}</p>
                <p className="text-xs text-gray-400">{order.items?.length} item(s)</p>

                {/* Status badge + updater */}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status || 'Order Placed'}
                </span>
                <select
                  value={order.status || 'Order Placed'}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-black"
                >
                  <option>Order Placed</option>
                  <option>Packing</option>
                  <option>Shipped</option>
                  <option>Out for delivery</option>
                  <option>Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
