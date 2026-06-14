import userModel from "../models/userModel.js";

// Add Item to Cart
const addToCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.body;

        if (!itemId) {
            return res.json({ success: false, message: "Item ID is required" });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const cart = userData.cartData;
        const currentQty = cart.get(itemId) || 0;
        cart.set(itemId, currentQty + 1);
        // ✅ FIX: removed `userData.cartData = cartData` (wrong variable name)
        await userData.save();

        res.json({ success: true, message: "Added to Cart" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update Cart Item Quantity
const updateCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId, quantity } = req.body;

        if (!itemId || quantity == null) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const userData = await userModel.findById(userId);
        const cart = userData.cartData;

        if (quantity <= 0) {
            cart.delete(itemId);
        } else {
            cart.set(itemId, Number(quantity));
        }

        await userData.save();

        res.json({ success: true, message: "Cart Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove Item From Cart
// ✅ FIX: re-ordered the body so variables are declared before use
const removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.body;

        if (!itemId) {
            return res.json({ success: false, message: "Item ID is required" });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const cart = userData.cartData;

        if (!cart.has(itemId)) {
            return res.json({ success: false, message: "Item not found in cart" });
        }

        // ✅ FIX: use Map .delete() consistently (not plain object `delete`)
        cart.delete(itemId);
        await userData.save();

        res.json({ success: true, message: "Item removed from cart" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get User Cart
const getUserCart = async (req, res) => {
    try {
        const userId = req.userId;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            cartData: Object.fromEntries(userData.cartData),
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, removeFromCart, getUserCart };