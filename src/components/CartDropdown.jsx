import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Trash2, ChevronRight, Upload, CreditCard, Tag, CheckCircle, Copy, Check, Info } from "lucide-react";
import { api } from "../services/api";

const CartItemPreview = ({ item, className }) => {
  const modelRef = React.useRef(null);
  const isGlb = item.image_url?.endsWith(".glb");

  const applyColors = () => {
    const modelViewer = modelRef.current;
    if (!modelViewer || !modelViewer.model) return;

    const hexToRgb = (hex) => {
      if (!hex) return null;
      const sh = hex.replace('#', '');
      if (sh.length !== 6) return null;
      const r = parseInt(sh.substring(0, 2), 16) / 255;
      const g = parseInt(sh.substring(2, 4), 16) / 255;
      const b = parseInt(sh.substring(4, 6), 16) / 255;
      return [r, g, b, 1.0];
    };

    const woodColor = hexToRgb(item.wood_hex);
    const fabricColor = hexToRgb(item.fabric_hex);

    const mats = modelViewer.model.materials;
    if (mats.length === 0) return;

    let matchedAny = false;
    mats.forEach(mat => {
      const name = mat.name.toLowerCase();
      const isFabricMat = name.includes('fabric') || name.includes('tela') || name.includes('cushion') || name.includes('cojin') || name.includes('seat') || name.includes('asiento') || name.includes('respaldo') || name.includes('cuero') || name.includes('leather');
      const isContrastMat = name.includes('news') || name.includes('paper') || name.includes('print') || name.includes('centro') || name.includes('backrest') || name.includes('decor') || name.includes('pattern') || name.includes('decal') || name.includes('picture') || name.includes('image') || name.includes('text') || name.includes('texture') || name.includes('contraste') || name.includes('interior') || name.includes('medallion') || name.includes('central');

      if (!isFabricMat && !isContrastMat && woodColor) {
        mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
        matchedAny = true;
      }
    });

    if (!matchedAny && woodColor) {
      mats.forEach(mat => {
        const name = mat.name.toLowerCase();
        const isFabricMat = name.includes('fabric') || name.includes('tela') || name.includes('cushion') || name.includes('cojin') || name.includes('seat') || name.includes('asiento') || name.includes('respaldo') || name.includes('cuero') || name.includes('leather');
        const isContrastMat = name.includes('news') || name.includes('paper') || name.includes('print') || name.includes('centro') || name.includes('backrest') || name.includes('decor') || name.includes('pattern') || name.includes('decal') || name.includes('picture') || name.includes('image') || name.includes('text') || name.includes('texture') || name.includes('contraste') || name.includes('interior') || name.includes('medallion') || name.includes('central');
        if (!isFabricMat && !isContrastMat) {
          mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
        }
      });
    }
  };

  React.useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      applyColors();
    };
    modelViewer.addEventListener('load', handleLoad);
    if (modelViewer.model) {
      applyColors();
    }
    return () => {
      modelViewer.removeEventListener('load', handleLoad);
    };
  }, [item.wood_hex, item.fabric_hex, item.image_url]);

  if (isGlb) {
    return (
      <div className={`${className} bg-paper rounded-lg overflow-hidden relative border border-brand-accent/5 shrink-0`}>
        <model-viewer
          ref={modelRef}
          src={api.getImageUrl(item.image_url)}
          alt={item.name}
          style={{ width: "100%", height: "100%", outline: "none" }}
          camera-orbit="45deg 75deg 105%"
          field-of-view="auto"
          shadow-intensity="0.5"
          interaction-prompt="none"
        />
      </div>
    );
  }

  return (
    <img
      src={
        api.getImageUrl(item.image_url) ||
        `https://picsum.photos/seed/${item.name}/150/150`
      }
      alt={item.name}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};

export const CartDropdown = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  total,
  rawTotal,
  discount,
  onApplyDiscount,
  onClearDiscount,
  comboDiscounts = [],
  comboDiscountTotal = 0,
  onAddToCart,
  products = [],
}) => {
  const [step, setStep] = useState("cart"); // "cart" | "shipping" | "payment"
  const [shippingType, setShippingType] = useState("pickup"); // "pickup" | "delivery"
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("receipt");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(""); // "" | "lafise" | "banpro"

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(key);
    setTimeout(() => {
      setCopiedAccount("");
    }, 2000);
  };

  const handleClose = () => {
    setStep("cart");
    setShippingType("pickup");
    setShippingAddress("");
    setReceiptFile(null);
    setReceiptPreview("");
    setCouponInput("");
    onClose();
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await onApplyDiscount(couponInput.trim().toUpperCase());
      setCouponInput("");
    } catch (err) {
      alert(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalCheckout = async () => {
    if (paymentMethod === "receipt" && !receiptFile) {
      alert("Por favor sube tu comprobante de pago.");
      return;
    }

    setIsUploading(true);
    try {
      let receiptUrl = null;
      if (paymentMethod === "receipt" && receiptFile) {
        const res = await api.upload(receiptFile, 'receipt');
        receiptUrl = res.url;
      }

      if (window.gtag) {
        window.gtag("event", "add_payment_info", {
          currency: "NIO",
          value: Number(total),
          coupon: discount?.code || "",
          payment_type: paymentMethod === "paypal" ? "PayPal" : "Comprobante",
          items: items.map(item => ({
            item_id: String(item.id),
            item_name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
          }))
        });
      }

      await onCheckout({
        payment_method: paymentMethod,
        payment_receipt_url: receiptUrl,
        paypal_order_id:
          paymentMethod === "paypal"
            ? "MOCK_PAYPAL_" + Math.random().toString(36).substr(2, 9)
            : null,
        shipping_type: shippingType,
        shipping_address: shippingType === "delivery" ? shippingAddress : null,
      });

      setStep("cart");
      setShippingType("pickup");
      setShippingAddress("");
      setReceiptFile(null);
      setReceiptPreview("");
    } catch (e) {
      alert("Error al procesar el pedido: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold">
                {step === "cart" && "Carrito de Pedido"}
                {step === "shipping" && "Método de Entrega"}
                {step === "payment" && "Método de Pago"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-paper rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                      <ShoppingCart size={48} strokeWidth={1} />
                      <p>Tu carrito está vacío</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex gap-4 group">
                        <CartItemPreview item={item} className="w-20 h-20 object-cover rounded-lg" />

                        <div className="flex-1 flex flex-col justify-between">
                          <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                          {item.description && (
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5 text-left">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-brand-accent font-bold">
                              C${item.price.toLocaleString()}
                            </span>
                            
                            {/* Quantity control controls */}
                            <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, -1)}
                                className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-bold text-xs transition-colors"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-semibold text-gray-800 bg-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, 1)}
                                className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-bold text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Combo Suggestions inside scrollable area to prevent squishing */}
                  {items.length > 0 && comboDiscounts && comboDiscounts.some(c => c.promptAddGift) && (
                    <div className="pt-4 border-t border-dashed space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Sugerencias para tu pedido:</p>
                      {comboDiscounts.map((combo, idx) => {
                        if (!combo.promptAddGift) return null;
                        const prod = (products || []).find(p => p.id === combo.producto_asociado_id);
                        if (!prod || (Number(prod.stock) || 0) <= 0 || prod.esta_activo === false) {
                          return null;
                        }
                        return (
                          <div key={idx} className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-3 shadow-sm text-left">
                            <div className="space-y-1">
                              <p className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                                ✨ ¡Completa tu Combo: {combo.nombre}!
                              </p>
                              <p className="text-gray-600 leading-relaxed">
                                {combo.precio_combo && Number(combo.precio_combo) > 0 
                                  ? `Lleva el combo completo por solo C$ ${Number(combo.precio_combo).toLocaleString()} en lugar de su precio regular.`
                                  : `Agrega ${combo.cantidad_asociado}x ${combo.producto_asociado_nombre} para activar la promo.`
                                }
                              </p>
                            </div>
                            
                            <div className="space-y-2 pt-1 border-t border-amber-200/40">
                              <p className="font-semibold text-amber-800 uppercase tracking-wider text-[9px]">
                                Añade para activar la promo (Faltan {combo.cantidad_asociado}):
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white/70 hover:bg-white p-2 rounded-xl border border-amber-200/50 transition-all gap-3">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={api.getImageUrl(prod.image_url) || `https://picsum.photos/seed/${prod.name}/50/50`}
                                      className="w-8 h-8 object-cover rounded-md"
                                      alt={prod.name}
                                    />
                                    <div className="text-left">
                                      <p className="font-bold text-gray-800 text-[11px] line-clamp-1">{prod.name}</p>
                                      <p className="text-gray-500 font-medium text-[10px]">C$ {Number(prod.price).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (onAddToCart) {
                                        onAddToCart(prod);
                                      }
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all whitespace-nowrap shadow-sm hover:shadow"
                                  >
                                    + Añadir
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t bg-paper/50 space-y-3">
                  {/* Coupon field */}
                  {discount ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={16} />
                        <span className="text-sm font-bold font-mono">{discount.code}</span>
                        <span className="text-xs">({discount.percentage}% off)</span>
                      </div>
                      <button onClick={onClearDiscount} className="text-red-400 hover:text-red-600 text-xs font-bold">Quitar</button>
                    </div>
                  ) : (
                    <form onSubmit={handleCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Código de descuento"
                          className="w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-accent transition-all disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Aplicar"}
                      </button>
                    </form>
                  )}

                  {/* Active Combo Discounts */}
                  {comboDiscounts && comboDiscounts.some(c => !c.promptAddGift) && (
                    <div className="space-y-2 border-b border-brand-accent/5 pb-2 mb-2">
                      {comboDiscounts.map((combo, idx) => {
                        if (combo.promptAddGift) return null;
                        return (
                          <div key={idx} className="flex justify-between text-sm text-green-600 font-medium">
                            <span className="flex items-center gap-1">🎁 {combo.nombre}</span>
                            <span>-C${combo.monto.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(discount || comboDiscountTotal > 0) && (
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal</span>
                      <span>C${rawTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {discount && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Cupón Descuento ({discount.percentage}%)</span>
                      <span>-C${(rawTotal * discount.percentage / 100).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total</span>
                    <span className="text-2xl font-serif font-bold">
                      C${total.toLocaleString()}
                    </span>
                  </div>
                  <button
                    disabled={items.length === 0}
                    onClick={() => {
                      if (window.gtag) {
                        window.gtag("event", "begin_checkout", {
                          currency: "NIO",
                          value: Number(total),
                          coupon: discount?.code || "",
                          items: items.map(item => ({
                            item_id: String(item.id),
                            item_name: item.name,
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                          }))
                        });
                      }
                      setStep("shipping");
                    }}
                    className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold tracking-tight hover:bg-brand-accent disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}

            {step === "shipping" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <p className="text-sm text-gray-500 font-medium">
                    ¿Cómo deseas recibir tu pedido?
                  </p>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-paper transition-colors">
                      <input
                        type="radio"
                        name="shippingType"
                        value="pickup"
                        checked={shippingType === "pickup"}
                        onChange={(e) => setShippingType(e.target.value)}
                        className="w-5 h-5 accent-brand-accent"
                      />
                      <div>
                        <span className="font-bold block text-sm">Retirar en Tienda</span>
                        <span className="text-xs text-gray-400">Gratis - Te esperamos en nuestro local</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-paper transition-colors">
                      <input
                        type="radio"
                        name="shippingType"
                        value="delivery"
                        checked={shippingType === "delivery"}
                        onChange={(e) => setShippingType(e.target.value)}
                        className="w-5 h-5 accent-brand-accent"
                      />
                      <div>
                        <span className="font-bold block text-sm">Envío a Domicilio (Delivery)</span>
                        <span className="text-xs text-gray-400">Cálculo posterior por el administrador</span>
                      </div>
                    </label>

                    {shippingType === "delivery" && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                          Dirección Exacta de Entrega
                        </label>
                        <textarea
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Escribe calle, número de casa, puntos de referencia..."
                          rows={3}
                          className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t bg-paper/50 space-y-4">
                  <button
                    onClick={() => {
                      if (shippingType === "delivery" && !shippingAddress.trim()) {
                        alert("Por favor ingresa tu dirección exacta.");
                        return;
                      }
                      if (window.gtag) {
                        window.gtag("event", "add_shipping_info", {
                          currency: "NIO",
                          value: Number(total),
                          coupon: discount?.code || "",
                          shipping_tier: shippingType === "delivery" ? "Delivery" : "Pickup",
                          items: items.map(item => ({
                            item_id: String(item.id),
                            item_name: item.name,
                            price: Number(item.price),
                            quantity: Number(item.quantity)
                          }))
                        });
                      }
                      setStep("payment");
                    }}
                    className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold tracking-tight hover:bg-brand-accent transition-all flex items-center justify-center gap-2"
                  >
                    Proceder al Pago <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setStep("cart")}
                    className="w-full text-center text-sm font-bold text-gray-400 hover:text-brand-primary"
                  >
                    Volver al Carrito
                  </button>
                </div>
              </>
            )}

            {step === "payment" && (
              <>
                {/* Payment Step */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Tarjeta de Políticas */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2 text-left shadow-sm">
                    <h4 className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                      <Info size={16} /> Políticas de Pago y Cancelación
                    </h4>
                    <p className="leading-relaxed font-medium">
                      • <strong>Anticipo del 50%:</strong> Se requiere el pago del 50% hoy para iniciar la fabricación de tus muebles. El 50% restante se cancela contra entrega.
                    </p>
                    <p className="leading-relaxed font-medium">
                      • <strong>Penalización por Cancelación:</strong> Si decides cancelar el pedido después de los 5 días de producción, se aplicará una penalización y solo se reembolsará el <strong>25% del total depositado</strong>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-paper transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="receipt"
                        checked={paymentMethod === "receipt"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-brand-accent"
                      />
                      <div className="flex items-center gap-2">
                        <Upload size={20} className="text-brand-accent" />
                        <span className="font-bold">Subir Comprobante</span>
                      </div>
                    </label>

                    {paymentMethod === "receipt" && (
                      <div className="pl-12 space-y-4 animate-in slide-in-from-top-2">
                        {/* Cuentas Bancarias */}
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">
                            Cuentas para transferencia:
                          </p>
                          
                          {/* Cuenta LAFISE */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-gray-500 uppercase">LAFISE Bancentro</p>
                              <p className="text-xs font-mono font-bold text-gray-800">123456789</p>
                              <p className="text-[9px] text-gray-400 font-medium">Córdobas (C$)</p>
                            </div>
                            <button
                              onClick={() => handleCopyText("123456789", "lafise")}
                              className="p-2 hover:bg-gray-200/50 rounded-lg text-gray-500 hover:text-brand-primary transition-all flex items-center justify-center cursor-pointer"
                              title="Copiar número de cuenta"
                            >
                              {copiedAccount === "lafise" ? (
                                <Check size={16} className="text-green-600 animate-in zoom-in-50" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>

                          {/* Cuenta BANPRO */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-gray-500 uppercase">BANPRO Grupo Promerica</p>
                              <p className="text-xs font-mono font-bold text-gray-800">987654321</p>
                              <p className="text-[9px] text-gray-400 font-medium">Córdobas (C$)</p>
                            </div>
                            <button
                              onClick={() => handleCopyText("987654321", "banpro")}
                              className="p-2 hover:bg-gray-200/50 rounded-lg text-gray-500 hover:text-brand-primary transition-all flex items-center justify-center cursor-pointer"
                              title="Copiar número de cuenta"
                            >
                              {copiedAccount === "banpro" ? (
                                <Check size={16} className="text-green-600 animate-in zoom-in-50" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          Sube la foto del comprobante de transferencia/depósito para confirmar tu anticipo.
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20 cursor-pointer"
                        />
                        {receiptPreview && (
                          <img
                            src={receiptPreview}
                            alt="Comprobante"
                            className="mt-4 w-full h-32 object-cover rounded-lg border animate-in fade-in"
                          />
                        )}
                      </div>
                    )}

                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-paper transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-brand-accent"
                      />
                      <div className="flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" />
                        <span className="font-bold">PayPal / Tarjeta</span>
                      </div>
                    </label>

                    {paymentMethod === "paypal" && (
                      <div className="pl-12 animate-in slide-in-from-top-2">
                        <p className="text-xs text-gray-500 mb-2">
                          Serás redirigido a PayPal de forma segura.
                        </p>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-bold text-center">
                          Simulación de Botón PayPal
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t bg-paper/50 space-y-4">
                  <div className="space-y-2 text-sm border-b border-brand-accent/5 pb-3">
                    <div className="flex justify-between font-medium text-gray-500">
                      <span>Total del pedido</span>
                      <span>C${total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-brand-primary">
                      <span>Anticipo a pagar hoy (50%)</span>
                      <span>C${(total * 0.5).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                      <span>Restante contra entrega (50%)</span>
                      <span>C${(total * 0.5).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleFinalCheckout}
                    disabled={isUploading}
                    className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold tracking-tight hover:bg-yellow-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      "Procesando..."
                    ) : paymentMethod === "paypal" ? (
                      `Pagar Anticipo (C$${(total * 0.5).toLocaleString()}) con PayPal`
                    ) : (
                      `Enviar Comprobante de Anticipo (C$${(total * 0.5).toLocaleString()})`
                    )}
                  </button>
                  <button
                    onClick={() => setStep("shipping")}
                    className="w-full text-center text-sm font-bold text-gray-400 hover:text-brand-primary"
                  >
                    Volver a Entrega
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
