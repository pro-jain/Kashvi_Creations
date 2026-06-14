import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
    const currency = "₹";
    const delivery_fee = 10;
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [token, setToken] = useState(sessionStorage.getItem("token") || "");
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);

    // ---------------- CART FETCH ----------------
    const getCartData = useCallback(async () => {
        if (!token) return;
        try {
            const response = await axios.post(
                `${backendUrl}/api/cart/get`,
                {},
                { headers: { token } }
            );
            if (response.data.success) {
                // cartData from backend is a flat { itemId: quantity } object
                setCartItems(response.data.cartData || {});
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch cart data.");
        }
    }, [token, backendUrl]);

    useEffect(() => {
        if (token) getCartData();
        else setCartItems({});
    }, [token, getCartData]);

    // ---------------- PRODUCTS ----------------
    const getProductsData = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`);
            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching products");
        }
    };

    useEffect(() => {
        getProductsData();
    }, []);

    // ---------------- ADD TO CART ----------------
    const addToCart = async (itemId) => {
        if (!token) {
            toast.error("Please login to add items to the cart");
            navigate("/login");
            return;
        }
        try {
            const response = await axios.post(
                `${backendUrl}/api/cart/add`,
                { itemId },
                { headers: { token } }
            );
            if (response.data.success) {
                // Optimistic local update — flat structure
                setCartItems(prev => ({
                    ...prev,
                    [itemId]: (prev[itemId] || 0) + 1
                }));
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to add to cart");
        }
    };

    // ---------------- UPDATE QUANTITY ----------------
    const updateQuantity = async (itemId, quantity) => {
        try {
            if (quantity <= 0) {
                return removeFromCart(itemId);
            }
            setCartItems(prev => ({ ...prev, [itemId]: quantity }));
            await axios.post(
                `${backendUrl}/api/cart/update`,
                { itemId, quantity },
                { headers: { token } }
            );
        } catch (error) {
            console.error(error);
            toast.error("Failed to update quantity.");
            getCartData(); // resync on failure
        }
    };

    // ---------------- REMOVE FROM CART ----------------
    const removeFromCart = async (itemId) => {
        try {
            // Optimistic local update
            setCartItems(prev => {
                const updated = { ...prev };
                delete updated[itemId];
                return updated;
            });
            if (token) {
                await axios.post(
                    `${backendUrl}/api/cart/remove`,
                    { itemId },
                    { headers: { token } }
                );
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove item");
            getCartData(); // resync on failure
        }
    };

    // ---------------- CART COUNT ----------------
    // cartItems is flat: { itemId: quantity }
    const getCartCount = () => {
        return Object.values(cartItems).reduce((total, qty) => total + (qty || 0), 0);
    };

    // ---------------- CART TOTAL ----------------
    const getCartAmount = () => {
        return Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
            const product = products.find(p => p._id === itemId);
            if (!product) return total;
            return total + product.price * (quantity || 0);
        }, 0);
    };

    // ---------------- LOGOUT ----------------
    const logout = () => {
        setToken("");
        setCartItems({});
        sessionStorage.removeItem("token");
        navigate("/login");
    };

    const value = {
        products,
        currency,
        delivery_fee,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        cartItems,
        setCartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        getCartAmount,
        getCartCount,
        navigate,
        backendUrl,
        token,
        setToken,
        logout,
        getCartData,
    };

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;