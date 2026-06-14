import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const Cart = () => {
    const {
        products, currency, cartItems,
        delivery_fee, token, getCartData,
        navigate, removeFromCart, updateQuantity,
        getCartAmount
    } = useContext(ShopContext);

    const [cartData, setCartData] = useState([]);

    // Redirect if not logged in
    useEffect(() => {
        if (!token) {
            toast.error("Please log in to view your cart.");
            navigate("/login");
            return;
        }
        getCartData();
    }, [token]);

    // cartItems is flat: { itemId: quantity } — no nested size object
    useEffect(() => {
        const tempData = Object.entries(cartItems)
            .filter(([, qty]) => qty > 0)
            .map(([productId, quantity]) => ({ productId, quantity }));
        setCartData(tempData);
    }, [cartItems]);

    const getProductDetails = (productId) =>
        products.find(p => p._id === productId);

    return (
        <div className="border-t pt-14">
            <div className="text-2xl mb-3 font-semibold text-gray-800">YOUR CART</div>

            {cartData.length === 0 ? (
                <p className="text-center text-gray-500 my-10">Your cart is empty!</p>
            ) : (
                <>
                    <div>
                        {cartData.map((item, index) => {
                            const productData = getProductDetails(item.productId);
                            if (!productData) return null;

                            return (
                                <div
                                    key={index}
                                    className="py-4 border-t border-b text-gray-700 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        {productData.images?.[0] && (
                                            <img
                                                className="w-16 sm:w-20 rounded"
                                                src={productData.images[0]}
                                                alt={productData.name}
                                            />
                                        )}
                                        <div>
                                            <p className="text-sm sm:text-base font-medium">{productData.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {currency}{productData.price}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            className="w-7 h-7 border border-gray-400 flex items-center justify-center text-lg hover:bg-gray-100"
                                        >−</button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            className="w-7 h-7 border border-gray-400 flex items-center justify-center text-lg hover:bg-gray-100"
                                        >+</button>
                                        <img
                                            className="w-4 cursor-pointer ml-2 opacity-60 hover:opacity-100"
                                            src={assets.bin_icon}
                                            alt="Remove"
                                            onClick={() => removeFromCart(item.productId)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Cart Totals */}
                    <div className="flex justify-end my-10">
                        <div className="w-full sm:w-[400px] bg-gray-100 p-5 rounded-md">
                            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Subtotal</span>
                                <span>{currency}{getCartAmount()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Delivery Fee</span>
                                <span>{currency}{delivery_fee}</span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between font-semibold text-gray-800">
                                <span>Total</span>
                                <span>{currency}{getCartAmount() + delivery_fee}</span>
                            </div>
                            <button
                                onClick={() => navigate("/place-order")}
                                className="bg-black text-white text-sm mt-5 px-6 py-3 w-full hover:bg-gray-800 transition"
                            >
                                PROCEED TO CHECKOUT
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;