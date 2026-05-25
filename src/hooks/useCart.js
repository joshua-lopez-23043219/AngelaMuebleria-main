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
      let itemsCombos = [];
      if (regla.productos_json) {
        try {
          itemsCombos = JSON.parse(regla.productos_json);
        } catch (e) {
          itemsCombos = [];
        }
      }
      
      if (!itemsCombos || itemsCombos.length === 0) {
        // Fallback para compatibilidad
        if (regla.producto_requerido) {
          itemsCombos.push({
            producto_id: regla.producto_requerido,
            cantidad: regla.cantidad_requerida || 1
          });
        }
        if (regla.producto_asociado) {
          itemsCombos.push({
            producto_id: regla.producto_asociado,
            cantidad: regla.cantidad_asociado || 1
          });
        }
      }

      if (itemsCombos.length === 0) return;

      // Agrupar requerimientos por producto_id
      const groupedReqs = {};
      itemsCombos.forEach(item => {
        const pid = Number(item.producto_id || item.id);
        const qty = Number(item.cantidad || item.quantity || 1);
        if (pid > 0 && qty > 0) {
          groupedReqs[pid] = (groupedReqs[pid] || 0) + qty;
        }
      });

      const reqKeys = Object.keys(groupedReqs).map(Number);
      if (reqKeys.length === 0) return;

      // Determinar cuántas veces se puede activar el combo
      let vecesActivado = null;
      reqKeys.forEach(pid => {
        const needed = groupedReqs[pid];
        const inCart = tempQuantities[pid] || 0;
        const possible = Math.floor(inCart / needed);
        if (vecesActivado === null) {
          vecesActivado = possible;
        } else {
          vecesActivado = Math.min(vecesActivado, possible);
        }
      });

      if (vecesActivado === null) vecesActivado = 0;

      if (vecesActivado > 0) {
        // Disminuir de tempQuantities
        reqKeys.forEach(pid => {
          tempQuantities[pid] -= vecesActivado * groupedReqs[pid];
        });

        // Calcular descuento
        let costoNormal = 0;
        reqKeys.forEach(pid => {
          const item = cart.find(i => Number(i.id) === pid);
          const unitPrice = item ? Number(item.price) : 0;
          costoNormal += unitPrice * groupedReqs[pid];
        });

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
        // No se activó. Ver si el usuario tiene al menos una parte del combo para sugerir lo faltante.
        const totalUnidadesComboEnCarrito = reqKeys.reduce((acc, pid) => acc + (tempQuantities[pid] || 0), 0);
        if (totalUnidadesComboEnCarrito > 0) {
          const missingItems = [];
          reqKeys.forEach(pid => {
            const qtyInCart = tempQuantities[pid] || 0;
            const qtyNeeded = groupedReqs[pid];
            if (qtyInCart < qtyNeeded) {
              missingItems.push({
                producto_id: pid,
                needed: qtyNeeded - qtyInCart
              });
            }
          });

          // Sugerir cada producto faltante con la cantidad restante necesaria
          if (missingItems.length > 0) {
            missingItems.forEach(missing => {
              let prodName = "Producto recomendado";
              if (regla.productos_detalle) {
                const det = regla.productos_detalle.find(d => Number(d.id) === missing.producto_id);
                if (det) prodName = det.nombre;
              } else if (missing.producto_id === regla.producto_asociado) {
                prodName = regla.producto_asociado_nombre;
              } else if (missing.producto_id === regla.producto_requerido) {
                prodName = regla.producto_requerido_nombre;
              }

              comboDiscounts.push({
                id: regla.id,
                nombre: regla.nombre,
                monto: 0,
                vecesActivado: 0,
                precio_combo: regla.precio_combo,
                promptAddGift: true,
                producto_asociado_id: missing.producto_id,
                producto_asociado_nombre: prodName,
                cantidad_asociado: missing.needed
              });
            });
          }
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
