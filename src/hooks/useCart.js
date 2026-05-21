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
      // Determinar activaciones posibles de la regla
      let totalReqAvailable = 0;
      cart.forEach(item => {
        const qty = tempQuantities[item.id] || 0;
        if (qty <= 0) return;
        const matchesType = !regla.tipo_requerido || item.type === regla.tipo_requerido;
        const matchesCategory = !regla.categoria_requerida || (item.category || item.category_read) === regla.categoria_requerida_nombre;
        if (matchesType && matchesCategory) {
          totalReqAvailable += qty;
        }
      });

      const timesActivatedLimit = Math.floor(totalReqAvailable / regla.cantidad_requerida);
      if (timesActivatedLimit <= 0) return;

      let timesActivated = 0;
      let ruleDiscountTotal = 0;
      let totalGiftsGiven = 0;

      for (let step = 0; step < timesActivatedLimit; step++) {
        // Intentar consumir requeridos
        let reqConsumed = [];
        let reqCandidates = [];
        cart.forEach(item => {
          const qty = tempQuantities[item.id] || 0;
          if (qty > 0) {
            const matchesType = !regla.tipo_requerido || item.type === regla.tipo_requerido;
            const matchesCategory = !regla.categoria_requerida || (item.category || item.category_read) === regla.categoria_requerida_nombre;
            if (matchesType && matchesCategory) {
              reqCandidates.push({
                id: item.id,
                price: item.price,
                qtyAvailable: qty
              });
            }
          }
        });
        // Ordenar requeridos de menor a mayor precio
        reqCandidates.sort((a, b) => a.price - b.price);

        let accumulatedReq = 0;
        let stepUpdates = {};
        for (let rc of reqCandidates) {
          if (accumulatedReq >= regla.cantidad_requerida) break;
          const needed = regla.cantidad_requerida - accumulatedReq;
          const currentAllocated = stepUpdates[rc.id] || 0;
          const take = Math.min(rc.qtyAvailable - currentAllocated, needed);
          if (take > 0) {
            stepUpdates[rc.id] = currentAllocated + take;
            accumulatedReq += take;
            reqConsumed.push({ id: rc.id, price: rc.price, qty: take });
          }
        }

        if (accumulatedReq < regla.cantidad_requerida) break;

        // Intentar consumir regalos
        let giftConsumed = [];
        let giftCandidates = [];
        cart.forEach(item => {
          const qty = (tempQuantities[item.id] || 0) - (stepUpdates[item.id] || 0);
          if (qty > 0) {
            const matchesType = !regla.tipo_regalo || item.type === regla.tipo_regalo;
            const matchesCategory = !regla.categoria_regalo || (item.category || item.category_read) === regla.categoria_regalo_nombre;
            if (matchesType && matchesCategory) {
              giftCandidates.push({
                id: item.id,
                price: item.price,
                qtyAvailable: qty
              });
            }
          }
        });
        giftCandidates.sort((a, b) => a.price - b.price);

        let accumulatedGift = 0;
        for (let gc of giftCandidates) {
          if (accumulatedGift >= regla.cantidad_regalo) break;
          const needed = regla.cantidad_regalo - accumulatedGift;
          const take = Math.min(gc.qtyAvailable, needed);
          if (take > 0) {
            stepUpdates[gc.id] = (stepUpdates[gc.id] || 0) + take;
            accumulatedGift += take;
            giftConsumed.push({ id: gc.id, price: gc.price, qty: take });
          }
        }

        if (accumulatedGift < regla.cantidad_regalo) {
          // El combo está activo pero el regalo/segundo item no está en el carrito
          // Para esta iteración no podemos aplicar el descuento del combo.
          break;
        }

        // Si llegamos aquí, la iteración es exitosa! Consolidar asignación
        Object.keys(stepUpdates).forEach(id => {
          tempQuantities[id] -= stepUpdates[id];
        });

        // Calcular precio normal total
        let normalSum = 0;
        reqConsumed.forEach(r => normalSum += r.price * r.qty);
        giftConsumed.forEach(g => normalSum += g.price * g.qty);

        // Calcular descuento
        let discountThisTime = 0;
        if (regla.precio_combo && Number(regla.precio_combo) > 0) {
          discountThisTime = normalSum - Number(regla.precio_combo);
        } else {
          giftConsumed.forEach(g => discountThisTime += g.price * g.qty);
        }

        if (discountThisTime > 0) {
          ruleDiscountTotal += discountThisTime;
        }
        totalGiftsGiven += accumulatedGift;
        timesActivated++;
      }

      if (timesActivated > 0) {
        comboDiscountTotal += ruleDiscountTotal;
        comboDiscounts.push({
          id: regla.id,
          nombre: regla.nombre,
          monto: ruleDiscountTotal,
          giftsGiven: totalGiftsGiven,
          giftsAllowed: timesActivated * regla.cantidad_regalo,
          tipo_regalo: regla.tipo_regalo,
          categoria_regalo_nombre: regla.categoria_regalo_nombre,
          precio_combo: regla.precio_combo,
          promptAddGift: false
        });
      } else {
        // No se pudo activar ninguna instancia completa (falta el regalo en el carrito)
        comboDiscounts.push({
          id: regla.id,
          nombre: regla.nombre,
          monto: 0,
          giftsGiven: 0,
          giftsAllowed: timesActivatedLimit * regla.cantidad_regalo,
          tipo_regalo: regla.tipo_regalo,
          categoria_regalo_nombre: regla.categoria_regalo_nombre,
          precio_combo: regla.precio_combo,
          promptAddGift: true
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
