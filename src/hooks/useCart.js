import { useState, useEffect } from "react";
import { api } from "../services/api";

export function useCart(user) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState(null); // { code, percentage }

  // Limpiar el carrito cuando el usuario cierra sesión
  useEffect(() => {
    if (!user) {
      setCart([]);
      setDiscount(null);
    }
  }, [user]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const applyDiscount = async (code) => {
    const result = await api.marketing.validateDiscount(code);
    setDiscount({ code, percentage: result.percentage });
    return result;
  };

  const clearDiscount = () => setDiscount(null);

  const checkout = async (paymentData, onSuccess) => {
    if (!user) {
      setIsCartOpen(false);
      throw new Error("Debe iniciar sesión para realizar un pedido");
    }

    try {
      const rawTotal = cart.reduce(
        (acc, curr) => acc + curr.price * curr.quantity,
        0,
      );
      const discountAmount = discount ? rawTotal * (discount.percentage / 100) : 0;
      const total = rawTotal - discountAmount;

      await api.orders.create({
        items: cart,
        total,
        discount_code: discount?.code || null,
        ...paymentData,
      });
      setCart([]);
      setDiscount(null);
      setIsCartOpen(false);
      onSuccess();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const cartRawTotal = cart.reduce(
    (acc, curr) => acc + curr.price * curr.quantity,
    0,
  );
  const discountAmount = discount ? cartRawTotal * (discount.percentage / 100) : 0;
  const cartTotal = cartRawTotal - discountAmount;
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    checkout,
    applyDiscount,
    clearDiscount,
    discount,
    cartRawTotal,
    cartTotal,
    cartCount,
  };
}
