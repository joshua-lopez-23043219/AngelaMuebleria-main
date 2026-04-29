import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useOrders } from "../hooks/useOrders"; // Use the new hook
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
                  o.status === "delivered"         ? "bg-green-50 text-green-600" :
                  "bg-red-50 text-red-500"
                )}
              >
                {o.status === "pending"           ? "🕐 Pendiente de Procesar" :
                 o.status === "payment_review"    ? "🔍 Revisando Pago" :
                 o.status === "payment_validated" ? "✅ Pago Validado" :
                 o.status === "processing"        ? "🔨 En Fabricación / Entrega" :
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

              <div className="space-y-6">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingItems ? (
                    <div className="text-center py-12 text-gray-400 italic">
                      Obteniendo productos...
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <img
                          src={item.image_url}
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

                <div className="pt-4 border-t border-dashed flex justify-between items-end">
                  <p className="text-sm font-serif italic text-gray-500">
                    Subtotal
                  </p>
                  <p className="text-2xl font-serif font-bold text-brand-primary">
                    ${selectedOrder.total.toLocaleString()}
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
