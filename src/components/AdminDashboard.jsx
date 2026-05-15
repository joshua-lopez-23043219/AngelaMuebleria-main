import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api"; // Corrected import
import { useAdmin } from "../hooks/useAdmin"; // Use the new hook
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AdminDashboard = () => {
  const admin = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  const [customFurnitures, setCustomFurnitures] = useState([]);
  const [customColors, setCustomColors] = useState([]);
  const [shippingCosts, setShippingCosts] = useState({});

  const loadCustomizations = async () => {
    try {
      setCustomFurnitures(await api.customizations.getFurnitures());
      setCustomColors(await api.customizations.getColors());
    } catch(e) { console.error("Error loading customizations:", e); }
  };

  useEffect(() => {
    loadCustomizations();
  }, []);

  const loadOrderDetails = async (order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const items = await api.orders.adminGetItems(order.id);
      setOrderItems(items);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSetShippingCost = async (id) => {
    const cost = shippingCosts[id];
    if (cost === undefined || cost === "") {
      alert("Ingresa un monto válido para el Delivery.");
      return;
    }
    try {
      await api.orders.adminSetShippingCost(id, Number(cost));
      alert("Costo de Delivery asignado exitosamente.");
      admin.refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await admin.updateOrderStatus(id, status);
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
    } catch (e) {
      alert(e.message);
    }
  };
  const handleValidateShipping = async (id) => {
    try {
      await admin.validateShippingPayment(id);
      alert("Pago de Delivery validado exitosamente.");
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => ({ ...prev, shipping_status: 'validated' }));
      }
    } catch (e) {
      alert(e.message);
    }
  };
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get("image_file");
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (file && file.size > 0) {
        const res = await api.upload(file, 'image');
        data.image_url = res.url;
      } else if (!editingProduct?.image_url) {
        throw new Error("Debe subir una imagen.");
      } else {
        data.image_url = editingProduct.image_url;
      }
      delete data.image_file;

      if (editingProduct) {
        await api.products.update(editingProduct.id, data);
      } else {
        await api.products.create(data);
      }
      setShowForm(false);
      setEditingProduct(null);
      admin.refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await admin.deleteProduct(id);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="p-8 space-y-12">
      {/* Rest of the component structure remains similar but is cleaner */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">
            Control de inventario y analíticas de ventas
          </p>
          {admin.lastUpdated && (
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Última actualización: {admin.lastUpdated.toLocaleTimeString()}
              <span className="ml-2 text-brand-accent/60">(auto-refresh 30s)</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={admin.refresh}
            title="Actualizar datos"
            className="p-3 border border-brand-accent/20 rounded-xl text-brand-accent hover:bg-brand-accent hover:text-white transition-all"
          >
            <RefreshCw size={18} className={admin.loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingProduct(null);
            }}
            className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-accent transition-all"
          >
            <Plus size={20} /> Nuevo Producto
          </button>
        </div>
      </header>

      {admin.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">
            Error al cargar datos: {admin.error}
          </p>
          <button onClick={admin.refresh} className="ml-auto underline text-xs">
            Reintentar
          </button>
        </div>
      )}

      {admin.loading ? (
        <div className="h-64 flex items-center justify-center font-serif italic text-gray-400">
          Actualizando métricas y pedidos...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Ventas Totales",
                value: `$${admin.stats?.revenue?.toLocaleString() || 0}`,
                icon: TrendingUp,
                color: "text-brand-accent",
              },
              {
                label: "Pedidos",
                value: admin.stats?.orders || 0,
                icon: ShoppingCart,
                color: "text-blue-600",
              },
              {
                label: "Productos",
                value: admin.stats?.products || 0,
                icon: Package,
                color: "text-purple-600",
              },
              {
                label: "Stock Bajo",
                value: admin.stats?.lowStock || 0,
                icon: AlertCircle,
                color: "text-red-500",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-brand-accent/10 shadow-sm"
              >
                <stat.icon className={cn("mb-2", stat.color)} size={24} />
                <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-serif font-bold mt-1">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <section className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-serif font-bold border-b pb-2">
                Inventario
              </h2>
              <div className="bg-white rounded-2xl border border-brand-accent/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-paper text-xs uppercase tracking-tighter font-bold text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-accent/5">
                    {admin.products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-400 italic"
                        >
                          No hay productos en el inventario
                        </td>
                      </tr>
                    ) : (
                      admin.products.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-paper/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium">{p.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {p.category}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm">
                            ${p.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-bold",
                                p.stock < 5
                                  ? "bg-red-50 text-red-600"
                                  : "bg-green-50 text-green-600",
                              )}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setShowForm(true);
                              }}
                              className="p-1.5 hover:bg-brand-accent/10 rounded-lg transition-colors"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-serif font-bold border-b pb-2">
                Pedidos Recientes
              </h2>
              <div className="space-y-4">
                {admin.orders.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-brand-accent/20 text-center text-gray-400">
                    <ShoppingCart
                      size={32}
                      className="mx-auto mb-2 opacity-20"
                    />
                    <p className="text-sm font-serif italic">
                      No hay pedidos registrados
                    </p>
                  </div>
                ) : (
                  admin.orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-white p-4 rounded-xl border border-brand-accent/10 shadow-sm space-y-4 hover:border-brand-accent/30 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold">
                            {o.user_name || "Usuario desconocido"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[9px] text-brand-accent font-mono flex items-center gap-1">
                              <span>📱 {o.user_phone}</span>
                            </p>
                            <p className="text-[9px] text-gray-500 font-medium">
                              📍 {o.user_department}, {o.user_municipality}
                            </p>
                            <div className="mt-2 p-2 bg-paper rounded-lg border border-brand-accent/5 text-[10px] space-y-1">
                              <span className="font-bold text-gray-600">
                                {o.shipping_type === 'delivery' ? '🚚 ENVÍO A DOMICILIO' : '🏪 RETIRAR EN TIENDA'}
                              </span>
                              {o.shipping_type === 'delivery' && (
                                <>
                                  <p className="text-gray-500"><span className="font-bold">Dirección:</span> {o.shipping_address}</p>
                                  <p className="text-brand-accent font-bold">
                                    Costo Delivery: {o.shipping_cost > 0 ? `$${o.shipping_cost}` : 'No asignado'}
                                  </p>
                                  
                                  {(!o.shipping_cost || o.shipping_cost === 0) && (
                                    <div className="mt-2 flex gap-2 items-center">
                                      <input 
                                        type="number" 
                                        placeholder="$ Delivery"
                                        value={shippingCosts[o.id] || ""}
                                        onChange={(e) => setShippingCosts(prev => ({...prev, [o.id]: e.target.value}))}
                                        className="w-24 p-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                      />
                                      <button 
                                        onClick={() => handleSetShippingCost(o.id)}
                                        className="px-2 py-1 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-accent transition-all"
                                      >
                                        Asignar
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-brand-accent">
                            ${o.total.toLocaleString()}
                          </p>
                          <span
                            className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full uppercase font-bold",
                              o.status === "pending"           ? "bg-yellow-50 text-yellow-600" :
                              o.status === "payment_review"    ? "bg-orange-50 text-orange-500" :
                              o.status === "payment_validated" ? "bg-blue-50 text-blue-600" :
                              o.status === "processing"        ? "bg-purple-50 text-purple-600" :
                              o.status === "delivered"         ? "bg-green-50 text-green-600" :
                              "bg-red-50 text-red-500"
                            )}
                          >
                            {o.status === "pending"           ? "Pend. Procesar" :
                             o.status === "payment_review"    ? "Revisando Pago" :
                             o.status === "payment_validated" ? "Pago Validado" :
                             o.status === "processing"        ? "En Proceso" :
                             o.status === "delivered"         ? "Finalizado" :
                             "Cancelado"}
                          </span>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                            {o.payment_method === 'paypal' ? 'PayPal' : 'Comprobante'}
                          </p>
                          {o.shipping_type === 'delivery' && o.shipping_status === 'paid' && (
                            <div className="p-1 px-2 bg-orange-500 text-white rounded-md text-[8px] font-bold text-center uppercase tracking-wider mt-1 animate-pulse">
                              🔔 Pago Delivery por Revisar
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-brand-accent/5 flex-wrap">
                        <button
                          onClick={() => loadOrderDetails(o)}
                          className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-paper rounded-lg hover:bg-brand-accent/10 transition-all"
                        >
                          Ver Detalle
                        </button>
                        {o.shipping_type === 'delivery' && o.shipping_status === 'paid' && (
                          <button
                            onClick={() => handleValidateShipping(o.id)}
                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                          >
                            Validar Pago Delivery ✓
                          </button>
                        )}
                        {/* Step 1: Admin reviews payment */}
                        {o.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, "payment_review")}
                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                          >
                            Revisar Pago
                          </button>
                        )}

                        {/* Step 2: Admin validates payment */}
                        {o.status === "payment_review" && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, "payment_validated")}
                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                          >
                            Validar Pago ✓
                          </button>
                        )}

                        {/* Step 3: Mark as processing (in fabrication/pending pickup) */}
                        {o.status === "payment_validated" && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, "processing")}
                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                          >
                            En Proceso
                          </button>
                        )}

                        {/* Step 4: Finalize / delivered */}
                        {o.status === "processing" && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, "delivered")}
                            className="flex-1 text-[10px] font-bold uppercase tracking-wider py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                          >
                            Finalizar ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold border-b pb-2">
            Muebles Base (Diseño)
          </h2>
          <div className="bg-white rounded-2xl border border-brand-accent/10 p-4 space-y-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const file = formData.get("image_file");
              let imageUrl = "";
              if (file && file.size > 0) {
                const res = await api.upload(file, "image");
                imageUrl = res.url;
              } else {
                return alert("Debe subir una imagen");
              }
              await api.customizations.createFurniture({
                name: formData.get("name"),
                base_price: formData.get("base_price"),
                image_url: imageUrl,
                wood_type: formData.get("wood_type") || "N/A"
              });
              e.target.reset();
              loadCustomizations();
            }} className="flex flex-col gap-2 border p-3 rounded-xl bg-paper/30">
              <input required name="name" placeholder="Nombre (ej. Sofá)" className="px-3 py-1.5 border rounded-lg text-sm" />
              <div className="flex gap-2">
                <input required type="number" name="base_price" placeholder="Precio Base" className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                <input required name="wood_type" placeholder="Tipo Madera" className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
              </div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mt-1">Imagen Base:</label>
              <input required type="file" name="image_file" accept="image/*" className="px-3 py-1 border rounded-lg text-sm bg-white" />
              <button type="submit" className="py-2 mt-1 bg-brand-primary text-white rounded-lg text-sm font-bold">Añadir Mueble</button>
            </form>
            <div className="space-y-2">
              {customFurnitures.map(f => (
                <div key={f.id} className="flex justify-between items-center p-2 hover:bg-paper rounded-lg border">
                  <div className="flex gap-2 items-center">
                    <img src={api.getImageUrl(f.image_url)} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-sm font-bold">{f.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{f.wood_type} | ${f.base_price}</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (confirm("¿Eliminar?")) {
                      await api.customizations.deleteFurniture(f.id);
                      loadCustomizations();
                    }
                  }} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold border-b pb-2">
            Colores y Materiales
          </h2>
          <div className="bg-white rounded-2xl border border-brand-accent/10 p-4 space-y-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              await api.customizations.createColor(data);
              e.target.reset();
              loadCustomizations();
            }} className="grid grid-cols-2 gap-2 border p-3 rounded-xl bg-paper/30">
              <input required name="name" placeholder="Nombre (ej. Roble)" className="px-3 py-1.5 border rounded-lg text-sm col-span-2" />
              <div className="flex items-center gap-2">
                <input required name="hex_code" type="color" className="w-8 h-8 cursor-pointer rounded border-0" />
                <span className="text-[10px] text-gray-500 font-bold uppercase">Color Hex</span>
              </div>
              <select name="type" className="px-3 py-1.5 border rounded-lg text-sm">
                <option value="paint">Pintura</option>
                <option value="fabric">Tela/Tapizado</option>
              </select>
              <input required type="number" name="price_modifier" placeholder="Precio Extra ($)" className="px-3 py-1.5 border rounded-lg text-sm col-span-2" />
              <button type="submit" className="col-span-2 py-2 mt-1 bg-brand-primary text-white rounded-lg text-sm font-bold">Añadir Material</button>
            </form>
            <div className="space-y-2 max-h-64 overflow-auto">
              {customColors.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 hover:bg-paper rounded-lg border">
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: c.hex_code }} />
                    <div>
                      <p className="text-sm font-bold">{c.name}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-500">{c.type === 'paint' ? 'Pintura' : 'Tela'} (+${c.price_modifier})</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (confirm("¿Eliminar?")) {
                      await api.customizations.deleteColor(c.id);
                      loadCustomizations();
                    }
                  }} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Form and Detail Modals */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl p-8 rounded-2xl shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold mb-6">
                {editingProduct ? "Editar" : "Crear"} Producto
              </h3>
              <form
                onSubmit={handleProductSubmit}
                className="grid grid-cols-2 gap-4"
              >
                <input
                  required
                  name="name"
                  placeholder="Nombre"
                  defaultValue={editingProduct?.name}
                  className="col-span-2 w-full px-4 py-2 border rounded-lg"
                />
                <input
                  required
                  type="number"
                  name="price"
                  placeholder="Precio"
                  defaultValue={editingProduct?.price}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  required
                  type="number"
                  name="stock"
                  placeholder="Stock"
                  defaultValue={editingProduct?.stock}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  name="description"
                  placeholder="Descripción"
                  defaultValue={editingProduct?.description}
                  className="col-span-2 w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
                <input
                  name="category"
                  placeholder="Categoría"
                  defaultValue={editingProduct?.category}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  name="wood_type"
                  placeholder="Tipo de Madera"
                  defaultValue={editingProduct?.wood_type}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="w-full">
                  <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Imagen del Producto</label>
                  <input
                    type="file"
                    name="image_file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const preview = document.getElementById('image-preview');
                          if (preview) preview.src = e.target.result;
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    className="w-full px-4 py-1.5 border rounded-lg text-sm bg-white"
                  />
                  {editingProduct?.image_url && !document.getElementById('image-preview')?.src?.startsWith('data:') && (
                    <p className="text-[10px] text-gray-400 mt-1">Ya tiene una imagen asignada. Sube otra para reemplazarla.</p>
                  )}
                  <div className="mt-2 flex justify-center">
                    <img 
                      id="image-preview" 
                      src={editingProduct?.image_url ? api.getImageUrl(editingProduct.image_url) : ""} 
                      className={`max-h-32 rounded-lg border object-contain ${(!editingProduct?.image_url && !document.getElementById('image-preview')?.src) ? 'hidden' : ''}`}
                    />
                  </div>
                </div>
                <div className="col-span-2 flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 bg-gray-100 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-accent"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <h3 className="text-2xl font-serif font-bold">
                  Detalles del Pedido
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-paper rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-paper/50 rounded-2xl border border-brand-accent/5 space-y-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                      Cliente
                    </p>
                    <p className="font-bold">{selectedOrder.user_name}</p>
                    <p className="text-xs text-brand-accent font-mono">
                      {selectedOrder.user_email}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-brand-accent/5">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">
                        Teléfono
                      </p>
                      <p className="text-xs font-bold">
                        {selectedOrder.user_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">
                        Ubicación
                      </p>
                      <p className="text-xs font-bold leading-tight">
                        {selectedOrder.user_municipality},{" "}
                        {selectedOrder.user_department}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">
                        Pago Mueble
                      </p>
                      <p className="text-[10px] font-bold uppercase">
                        {selectedOrder.payment_method === 'paypal' ? 'PayPal' : 'Comprobante'}
                      </p>
                      {selectedOrder.payment_method === 'paypal' && selectedOrder.paypal_order_id && (
                        <p className="text-[8px] text-gray-400 font-mono leading-tight break-all">{selectedOrder.paypal_order_id}</p>
                      )}
                      {selectedOrder.payment_method === 'receipt' && selectedOrder.payment_receipt_url && (
                        <button 
                          onClick={() => setViewReceipt(selectedOrder.payment_receipt_url)}
                          className="text-[9px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded mt-0.5 hover:bg-brand-accent hover:text-white transition-colors block font-bold"
                        >
                          Ver Recibo
                        </button>
                      )}
                    </div>
                    
                    {selectedOrder.shipping_type === 'delivery' && (
                      <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">
                          Pago Delivery
                        </p>
                        {selectedOrder.shipping_cost > 0 ? (
                          <p className="text-[10px] font-bold text-brand-accent">
                            ${selectedOrder.shipping_cost.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-[9px] text-gray-400 font-bold">Pendiente</p>
                        )}
                        
                        {selectedOrder.shipping_payment_method ? (
                          <>
                            <p className="text-[10px] font-bold uppercase mt-1">
                              {selectedOrder.shipping_payment_method === 'paypal' ? 'PayPal' : 'Comprobante'}
                            </p>
                            {selectedOrder.shipping_payment_method === 'paypal' && selectedOrder.shipping_paypal_order_id && (
                              <p className="text-[8px] text-gray-400 font-mono leading-tight break-all">{selectedOrder.shipping_paypal_order_id}</p>
                            )}
                            {selectedOrder.shipping_payment_method === 'receipt' && selectedOrder.shipping_payment_receipt_url && (
                              <button 
                                onClick={() => setViewReceipt(selectedOrder.shipping_payment_receipt_url)}
                                className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded mt-0.5 hover:bg-orange-600 transition-colors block font-bold animate-pulse"
                              >
                                Ver Flete
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-[8px] text-gray-400 italic">Sin pago aún</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingItems ? (
                    <div className="text-center py-8">Cargando...</div>
                  ) : (
                    orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 items-center p-2 rounded-xl transition-all"
                      >
                        <img
                          src={api.getImageUrl(item.image_url)}
                          className="w-12 h-12 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {item.quantity} x ${item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-mono font-bold">
                          ${(item.quantity * item.price).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-dashed">
                  <p className="text-lg font-serif font-bold italic">Total</p>
                  <p className="text-2xl font-mono font-bold text-brand-primary">
                    ${selectedOrder.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4 pt-2">
                  {selectedOrder.status === "pending" ? (
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, "delivered")
                      }
                      className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all"
                    >
                      Marcar como Finalizado
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-4 bg-green-50 text-green-600 rounded-2xl font-bold border border-green-100">
                      Pedido Finalizado
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewReceipt(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            >
              <button
                onClick={() => setViewReceipt(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-10"
              >
                <X size={20} />
              </button>
              <img src={api.getImageUrl(viewReceipt)} alt="Comprobante de Pago" className="w-full h-auto rounded-xl relative" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
