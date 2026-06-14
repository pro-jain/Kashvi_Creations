import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', street: '',
  city: '', state: '', zipcode: '', country: '', phone: '',
};

const PlaceOrder = () => {
  const { backendUrl, token, cartItems, setCartItems, products } = useContext(ShopContext);
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [method, setMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveThisAddress, setSaveThisAddress] = useState(false);

  // Fetch saved addresses on mount
  useEffect(() => {
    if (!token) return;
    axios
      .post(`${backendUrl}/api/user/addresses`, {}, { headers: { token } })
      .then((res) => {
        if (res.data.success && res.data.addresses.length > 0) {
          setSavedAddresses(res.data.addresses);
          const def = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
          setSelectedAddressId(def._id);
          // pre-fill form with default address (strip mongoose fields)
          const { _id, __v, isDefault, label, ...addrFields } = def;
          setFormData({ ...EMPTY_FORM, ...addrFields });
        } else {
          // No saved addresses — show blank form directly
          setShowNewForm(true);
        }
      })
      .catch(() => {
        setShowNewForm(true);
      });
  }, [token, backendUrl]);

  const selectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setShowNewForm(false);
    const { _id, __v, isDefault, label, ...addrFields } = addr;
    setFormData({ ...EMPTY_FORM, ...addrFields });
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setShowNewForm(true);
    setFormData(EMPTY_FORM);
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...d, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const buildOrderItems = () => {
    const orderItems = [];
    for (const itemId in cartItems) {
    {
        if (cartItems[itemId] > 0) {
          const product = structuredClone(products.find((p) => p._id === itemId));
          if (product) {
          
            product.quantity = cartItems[itemId];
            orderItems.push(product);
          }
        }
      }
    }
    return orderItems;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Optionally save the new address before placing order
      if (saveThisAddress && showNewForm) {
        try {
          const saveRes = await axios.post(
            `${backendUrl}/api/user/address/save`,
            { address: { ...formData, label: 'Home' } },
            { headers: { token } }
          );
          if (saveRes.data.success) {
            setSavedAddresses(saveRes.data.addresses);
            toast.success('Address saved!');
          }
        } catch {
          // non-fatal — order still proceeds
        }
      }

      const orderItems = buildOrderItems();
      const orderData = { address: formData, items: orderItems, paymentMethod: method };

      const { data } = await axios.post(`${backendUrl}/api/order/place`, orderData, {
        headers: { token },
      });

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      // COD — done
      if (!data.razorpay) {
        setCartItems({});
        toast.success('Order placed successfully!');
        navigate('/orders');
        return;
      }

      // Razorpay — open payment modal
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Kashvi Creations',
        description: 'Order Payment',
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${backendUrl}/api/order/verify-payment`,
              {
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              { headers: { token } }
            );

            if (verifyRes.data.success) {
              setCartItems({});
              toast.success('Payment successful! Order confirmed.');
              navigate('/orders');
            } else {
              toast.error('Payment verification failed. Contact support.');
            }
          } catch {
            toast.error('Payment verification error.');
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#1a1a1a' },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled. Your order is saved — you can retry from Orders page.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Something went wrong while placing the order.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    html2canvas(invoiceRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 180, 160);
      pdf.save('invoice.pdf');
    });
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">

      {/* Left — Delivery Info */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1="Delivery" text2="Information" />
        </div>

        {/* Saved Addresses Selector */}
        {savedAddresses.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-medium mb-2 text-gray-700">Saved Addresses</p>
            {savedAddresses.map((addr) => (
              <div
                key={addr._id}
                onClick={() => selectSavedAddress(addr)}
                className={`border p-3 rounded cursor-pointer mb-2 text-sm transition-all
                  ${selectedAddressId === addr._id && !showNewForm
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-500'
                  }`}
              >
                <p className="font-medium">{addr.label} — {addr.firstName} {addr.lastName}</p>
                <p className="text-gray-600">{addr.street}, {addr.city}, {addr.state} {addr.zipcode}</p>
                <p className="text-gray-600">{addr.phone}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={handleUseNewAddress}
              className={`text-sm mt-1 underline ${showNewForm ? 'text-black font-medium' : 'text-gray-500'}`}
            >
              + Use a new address
            </button>
          </div>
        )}

        {/* Address Form — shown when no saved addresses, or user clicked "Use new address" */}
        {(showNewForm || savedAddresses.length === 0) && (
          <>
            <div className="flex gap-3">
              <input required onChange={onChangeHandler} name="firstName" value={formData.firstName}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="First Name" />
              <input required onChange={onChangeHandler} name="lastName" value={formData.lastName}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="Last Name" />
            </div>
            <input required onChange={onChangeHandler} name="email" value={formData.email}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="email" placeholder="Email Id" />
            <input required onChange={onChangeHandler} name="street" value={formData.street}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="Address" />
            <div className="flex gap-3">
              <input required onChange={onChangeHandler} name="city" value={formData.city}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="City" />
              <input required onChange={onChangeHandler} name="state" value={formData.state}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="State" />
            </div>
            <div className="flex gap-3">
              <input required onChange={onChangeHandler} name="zipcode" value={formData.zipcode}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="number" placeholder="Zipcode" />
              <input required onChange={onChangeHandler} name="country" value={formData.country}
                className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="text" placeholder="Country" />
            </div>
            <input required onChange={onChangeHandler} name="phone" value={formData.phone}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full" type="number" placeholder="Phone Number" />

            {/* Save address checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveThisAddress}
                onChange={(e) => setSaveThisAddress(e.target.checked)}
                className="accent-black"
              />
              Save this address for future orders
            </label>
          </>
        )}
      </div>

      {/* Right — Payment Method + Summary */}
      <div className="mt-8 min-w-80">

        {/* Payment Method Selector */}
        <div className="mt-8">
          <Title text1="Payment" text2="Method" />
          <div className="flex flex-col gap-3 mt-4">

            {/* Razorpay */}
            <div
              onClick={() => setMethod('razorpay')}
              className={`flex items-center gap-3 border p-3 rounded cursor-pointer transition-all ${method === 'razorpay' ? 'border-black bg-gray-50' : 'border-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'razorpay' ? 'border-black' : 'border-gray-400'}`}>
                {method === 'razorpay' && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
              <div>
                <p className="text-sm font-medium">Razorpay</p>
                <p className="text-xs text-gray-500">UPI, Cards, Net Banking, Wallets</p>
              </div>
            </div>

            {/* COD */}
            <div
              onClick={() => setMethod('cod')}
              className={`flex items-center gap-3 border p-3 rounded cursor-pointer transition-all ${method === 'cod' ? 'border-black bg-gray-50' : 'border-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-black' : 'border-gray-400'}`}>
                {method === 'cod' && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
              <div>
                <p className="text-sm font-medium">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when your order arrives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="mt-8 p-4 border border-gray-300 rounded bg-gray-50" ref={invoiceRef}>
          <h2 className="text-lg font-bold">Invoice</h2>
          <p><strong>Customer:</strong> {formData.firstName} {formData.lastName}</p>
          <p><strong>Order Date:</strong> {new Date().toLocaleDateString()}</p>
          <p className="mt-3">Thank you for shopping with <strong>Kashvi Creations</strong>!</p>
        </div>

        {/* Buttons */}
        <div className="w-full text-end mt-8 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-16 py-3 text-sm disabled:opacity-60"
          >
            {loading ? 'PROCESSING...' : method === 'razorpay' ? 'PAY NOW' : 'PLACE ORDER'}
          </button>
          <button type="button" onClick={generatePDF} className="bg-blue-600 text-white px-16 py-3 text-sm">
            Download Invoice
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;