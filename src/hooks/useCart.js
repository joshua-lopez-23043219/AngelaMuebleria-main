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

  // Copia de cantidades para simular asignaciones de combos y evitar doble conteo
  let tempQuantities = {};
  cart.forEach(item => {
    tempQuantities[item.id] = item.quantity;
  });

  if (combos.length > 0 && cart.length > 0) {
    combos.forEach(regla => {
      const prodReqId = regla.producto_requerido;
      const prodAsoId = regla.producto_asociado;
      
      const itemReq = cart.find(item => item.id === prodReqId);
      const itemAso = cart.find(item => item.id === prodAsoId);
      
      const qtyReq = tempQuantities[prodReqId] || 0;
      const qtyAso = tempQuantities[prodAsoId] || 0;
      
      const vecesReq = Math.floor(qtyReq / regla.cantidad_requerida);
      if (vecesReq <= 0) return;
      
      let vecesActivado = 0;
      if (prodReqId === prodAsoId) {
        const totalNeeded = regla.cantidad_requerida + regla.cantidad_asociado;
        vecesActivado = Math.floor(qtyReq / totalNeeded);
      } else {
        const vecesAsociadoTotal = Math.floor(qtyAso / regla.cantidad_asociado);
        vecesActivado = Math.min(vecesReq, vecesAsociadoTotal);
      }
      
      if (vecesActivado > 0) {
        // Disminuir de tempQuantities
        if (prodReqId === prodAsoId) {
          tempQuantities[prodReqId] -= vecesActivado * (regla.cantidad_requerida + regla.cantidad_asociado);
        } else {
          tempQuantities[prodReqId] -= vecesActivado * regla.cantidad_requerida;
          tempQuantities[prodAsoId] -= vecesActivado * regla.cantidad_asociado;
        }
        
        // Calcular descuento
        const precioReq = itemReq.price;
        const precioAso = itemAso ? itemAso.price : (itemReq ? itemReq.price : 0);
        
        const costoNormal = (regla.cantidad_requerida * precioReq) + (regla.cantidad_asociado * precioAso);
        const precioComboNum = regla.precio_combo ? Number(regla.precio_combo) : costoNormal;
        const descuentoUnidad = Math.max(0, costoNormal - precioComboNum);
        const descuentoTotalRegla = vecesActivado * descuentoUnidad;
        
        if (descuentoTotalRegla > 0) {
          comboDiscountTotal += descuentoTotalRegla;
          comboDiscounts.push({
            id: regla.id,
            nombre: regla.nombre,
            monto: descuentoTotalRegla,
            vecesActivado: vecesActivado,
            precio_combo: regla.precio_combo,
            promptAddGift: false
          });
        }
      } else {
        // No se activó el combo porque falta el producto asociado en el carrito.
        // Pero sí tenemos suficiente del producto requerido, así que sugerimos el producto asociado!
        comboDiscounts.push({
          id: regla.id,
          nombre: regla.nombre,
          monto: 0,
          vecesActivado: 0,
          precio_combo: regla.precio_combo,
          promptAddGift: true,
          producto_requerido_id: prodReqId,
          producto_requerido_nombre: regla.producto_requerido_nombre,
          producto_asociado_id: prodAsoId,
          producto_asociado_nombre: regla.producto_asociado_nombre,
          cantidad_requerida: regla.cantidad_requerida,
          cantidad_asociado: regla.cantidad_asociado
        });
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
