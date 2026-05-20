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

  const [combos, setCombos] = useState([]);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const data = await api.combos.getAll();
        setCombos(data.filter(c => c.activo));
      } catch (e) {
        console.error("Error loading combo rules:", e);
      }
    };
    fetchCombos();
  }, []);

  // Calcular descuentos de combos promocionales configurados
  const cartRawTotal = cart.reduce(
    (acc, curr) => acc + curr.price * curr.quantity,
    0,
  );

  let comboDiscounts = [];
  let comboDiscountTotal = 0;

  if (combos.length > 0 && cart.length > 0) {
    combos.forEach(regla => {
      // Contar cuántos items cumplen el requerimiento
      let countRequired = 0;
      cart.forEach(item => {
        const matchesType = !regla.tipo_requerido || item.type === regla.tipo_requerido;
        const matchesCategory = !regla.categoria_requerida || item.category === regla.categoria_requerida_nombre;
        if (matchesType && matchesCategory) {
          countRequired += item.quantity;
        }
      });

      const timesActivated = Math.floor(countRequired / regla.cantidad_requerida);
      if (timesActivated > 0) {
        // Buscar productos de regalo elegibles en el carrito
        let candidates = [];
        cart.forEach(item => {
          const matchesType = !regla.tipo_regalo || item.type === regla.tipo_regalo;
          const matchesCategory = !regla.categoria_regalo || item.category === regla.categoria_regalo_nombre;
          if (matchesType && matchesCategory) {
            candidates.push(item);
          }
        });

        // Ordenar candidatos por precio de menor a mayor
        candidates.sort((a, b) => a.price - b.price);

        const giftsAllowed = timesActivated * regla.cantidad_regalo;
        let giftsGiven = 0;

        candidates.forEach(cand => {
          if (giftsGiven >= giftsAllowed) return;
          const available = cand.quantity;
          const discountQty = Math.min(available, giftsAllowed - giftsGiven);
          comboDiscountTotal += cand.price * discountQty;
          giftsGiven += discountQty;
        });

        if (giftsGiven > 0) {
          comboDiscounts.push({
            id: regla.id,
            nombre: regla.nombre,
            monto: comboDiscountTotal,
            giftsGiven,
            giftsAllowed,
            tipo_regalo: regla.tipo_regalo,
            categoria_regalo_nombre: regla.categoria_regalo_nombre,
            promptAddGift: false
          });
        } else {
          // El combo está activo pero no tiene el regalo en el carrito
          comboDiscounts.push({
            id: regla.id,
            nombre: regla.nombre,
            monto: 0,
            giftsGiven: 0,
            giftsAllowed,
            tipo_regalo: regla.tipo_regalo,
            categoria_regalo_nombre: regla.categoria_regalo_nombre,
            promptAddGift: true
          });
        }
      }
    });
  }

  const discountAmount = discount ? cartRawTotal * (discount.percentage / 100) : 0;
  const cartTotal = Math.max(0, cartRawTotal - discountAmount - comboDiscountTotal);
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  const checkout = async (paymentData, onSuccess) => {
    if (!user) {
      setIsCartOpen(false);
      throw new Error("Debe iniciar sesión para realizar un pedido");
    }

    try {
      await api.orders.create({
        items: cart,
        total: cartTotal,
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
    comboDiscounts,
    comboDiscountTotal
  };
}
