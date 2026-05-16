import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, CreditCard } from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import { api } from "../services/api"; // Use the new hook
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const OrdersList = () => {
  const ordersApi = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("receipt");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePayDeliveryOrder = async () => {
    if (paymentMethod === "receipt" && !receiptFile) {
      alert("Por favor sube tu comprobante de pago.");
      return;
    }
    setIsUploading(true);
    try {
      let receiptUrl = null;
      if (paymentMethod === "receipt") {
        const res = await api.upload(receiptFile, 'receipt');
        receiptUrl = res.url;
      }
      await api.orders.payShipping(selectedOrder.id, {
        shipping_payment_method: paymentMethod,
        shipping_payment_receipt_url: receiptUrl,
        shipping_paypal_order_id:
          paymentMethod === "paypal"
            ? "MOCK_PAYPAL_" + Math.random().toString(36).substr(2, 9)
            : null,
      });
      alert("¡Pago enviado correctamente! Espera la validación del administrador.");
      setSelectedOrder(null);
      ordersApi.refresh();
    } catch (e) {
      alert("Error al procesar el pago: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const viewDetails = async (order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const data = await ordersApi.getOrderItems(order.id);
      setItems(data);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los detalles del pedido");
    } finally {
      setLoadingItems(false);
    }
  };

  if (ordersApi.loading && ordersApi.orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 italic">
        Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ordersApi.orders.length === 0 ? (
        <p className="text-gray-400 italic">Aún no has realizado pedidos.</p>
      ) : (
        ordersApi.orders.map((o) => (
          <div
            key={o.id}
            className="bg-white p-6 rounded-2xl border border-brand-accent/10 shadow-sm flex justify-between items-center"
          >
            <div className="space-y-1">
              <p className="text-xs uppercase font-bold text-gray-400">
                Pedido #{o.id}
              </p>
              <p className="text-lg font-serif font-bold">
                ${o.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  o.status === "pending"           ? "bg-yellow-50 text-yellow-600" :
                  o.status === "payment_review"    ? "bg-orange-50 text-orange-500" :
                  o.status === "payment_validated" ? "bg-blue-50 text-blue-600" :
                  o.status === "processing"        ? "bg-purple-50 text-purple-600" :
                  o.status === "ready"             ? "bg-indigo-50 text-indigo-600" :
                  o.status === "delivered"         ? "bg-green-50 text-green-600" :
                  "bg-red-50 text-red-500"
                )}
              >
                {o.status === "pending"           ? "🕐 Pendiente de Procesar" :
                 o.status === "payment_review"    ? "🔍 Revisando Pago" :
                 o.status === "payment_validated" ? "✅ Pago Validado" :
                 o.status === "processing"        ? "🔨 En Fabricación" :
                 o.status === "ready"             ? "📦 Listo para Entrega" :
                 o.status === "delivered"         ? "🎉 Finalizado" :
                 "❌ Cancelado"}
              </span>
              <button
                onClick={() => viewDetails(o)}
                className="text-xs font-bold text-brand-accent hover:underline"
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-serif font-bold">
                    Detalle del Pedido
                  </h3>
                  <p className="text-xs text-gray-400 font-mono tracking-tighter">
                    #{selectedOrder.id} -{" "}
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-paper rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingItems ? (
                    <div className="text-center py-12 text-gray-400 italic">
                      Obteniendo productos...
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <img
                          src={api.getImageUrl(item.image_url)}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-sm leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {item.quantity} x ${item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-mono font-bold text-sm">
                          ${(item.quantity * item.price).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {selectedOrder.shipping_type === 'delivery' && (
                  <div className="p-4 bg-paper rounded-2xl border border-brand-accent/10 text-sm space-y-1">
                    <p className="font-bold text-gray-700">🚚 Envío a Domicilio</p>
                    <p className="text-gray-500 text-xs"><span className="font-bold">Dirección:</span> {selectedOrder.shipping_address}</p>
                    <p className="text-brand-accent font-bold text-xs mt-1">
                      Costo Delivery: {selectedOrder.shipping_cost > 0 ? `$${selectedOrder.shipping_cost.toLocaleString()}` : '🕐 Pendiente de cotización por el administrador.'}
                    </p>
                  </div>
                )}
                {selectedOrder.shipping_type === 'delivery' && selectedOrder.shipping_status === 'validated' && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-bold text-center animate-in fade-in-50">
                    ✅ Pago de Delivery Validado.
                  </div>
                )}
                {selectedOrder.shipping_type === 'delivery' && selectedOrder.shipping_status === 'paid' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 text-orange-600 rounded-xl text-xs font-bold text-center animate-in fade-in-50">
                    🔍 Comprobante de Delivery pendiente de revisar.
                  </div>
                )}
                {selectedOrder.shipping_type === 'delivery' && selectedOrder.shipping_cost > 0 && selectedOrder.shipping_status === 'quoted' && (
                  <div className="p-4 border border-brand-accent/20 rounded-2xl bg-white space-y-4 animate-in slide-in-from-top-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Pagar Envío / Delivery (Monto: ${selectedOrder.shipping_cost.toLocaleString()})
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="payMethod"
                          value="receipt"
                          checked={paymentMethod === "receipt"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="accent-brand-accent"
                        />
                        <Upload size={16} className="text-brand-accent" />
                        Subir Comprobante
                      </label>

                      {paymentMethod === "receipt" && (
                        <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="text-xs w-full file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-accent/10 file:text-brand-accent cursor-pointer"
                          />
                          {receiptPreview && (
                            <img src={receiptPreview} className="w-full h-24 object-cover rounded-lg" />
                          )}
                        </div>
                      )}

                      <label className="flex items-center gap-2 p-2 border rounded-xl cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="payMethod"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="accent-brand-accent"
                        />
                        <CreditCard size={16} className="text-blue-600" />
                        PayPal
                      </label>
                    </div>

                    <button
                      onClick={handlePayDeliveryOrder}
                      disabled={isUploading}
                      className="w-full bg-brand-accent text-white py-2.5 rounded-xl text-xs font-bold hover:bg-yellow-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? "Procesando..." : "Enviar Pago de Envío"}
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-dashed flex justify-between items-end">
                  <p className="text-sm font-serif italic text-gray-500">
                    Subtotal {selectedOrder.shipping_type === 'delivery' && selectedOrder.shipping_cost > 0 && '+ Delivery'}
                  </p>
                  <p className="text-2xl font-serif font-bold text-brand-primary">
                    ${(selectedOrder.total + (selectedOrder.shipping_cost || 0)).toLocaleString()}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-2xl text-center font-bold",
                    selectedOrder.status === "pending"           ? "bg-yellow-50 text-yellow-600" :
                    selectedOrder.status === "payment_review"    ? "bg-orange-50 text-orange-500" :
                    selectedOrder.status === "payment_validated" ? "bg-blue-50 text-blue-600" :
                    selectedOrder.status === "processing"        ? "bg-purple-50 text-purple-600" :
                    selectedOrder.status === "delivered"         ? "bg-green-50 text-green-600" :
                    "bg-red-50 text-red-500"
                  )}
                >
                  {selectedOrder.status === "pending"           ? "🕐 Pendiente de Procesar — Tu comprobante está en revisión." :
                   selectedOrder.status === "payment_review"    ? "🔍 El administrador está revisando tu pago." :
                   selectedOrder.status === "payment_validated" ? "✅ ¡Pago Validado! Tu pedido está confirmado." :
                   selectedOrder.status === "processing"        ? "🔨 Tu mueble está siendo fabricado o listo para recoger." :
                   selectedOrder.status === "delivered"         ? "🎉 ¡Pedido Finalizado! Gracias por tu compra." :
                   "❌ Pedido Cancelado."}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
