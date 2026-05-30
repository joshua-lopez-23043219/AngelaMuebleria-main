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
  Box,
} from "lucide-react";
import { api } from "../services/api"; // Corrected import
import { useAdmin } from "../hooks/useAdmin"; // Use the new hook
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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

export const AdminDashboard = () => {
  const admin = useAdmin();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [clearModel3d, setClearModel3d] = useState(false);

  useEffect(() => {
    if (showForm) {
      setClearModel3d(false);
    }
  }, [showForm]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  const [customFurnitures, setCustomFurnitures] = useState([]);
  const [editingFurniture, setEditingFurniture] = useState(null);
  const [customColors, setCustomColors] = useState([]);
  const [shippingCosts, setShippingCosts] = useState({});

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "pedidos" | "combos" | "email"
  const [emailForm, setEmailForm] = useState({
    subject: "",
    title: "",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const [combos, setCombos] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [newCombo, setNewCombo] = useState({
    id: null,
    nombre: "",
    activo: true,
    precio_combo: "",
    productos: [{ producto_id: "", cantidad: 1 }],
    imagen_url: ""
  });

  const loadCombosData = async () => {
    setLoadingCombos(true);
    try {
      const dataCombos = await api.combos.getAll();
      setCombos(dataCombos);
      const cats = await api.categories.getAll();
      setCategoriesList(cats);
    } catch (e) {
      console.error("Error loading combos or categories:", e);
    } finally {
      setLoadingCombos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "combos") {
      loadCombosData();
    }
  }, [activeTab]);

  const handleCreateCombo = async (e) => {
    e.preventDefault();
    if (!newCombo.nombre.trim()) {
      alert("Por favor ingresa un nombre para el combo.");
      return;
    }
    if (newCombo.productos.length === 0) {
      alert("Por favor añade al menos un mueble al combo.");
      return;
    }
    const invalidProd = newCombo.productos.find(p => !p.producto_id || p.cantidad <= 0);
    if (invalidProd) {
      alert("Por favor selecciona un mueble válido y cantidad mayor a 0 para todos los elementos.");
      return;
    }
    if (!newCombo.precio_combo) {
      alert("Por favor ingresa el precio para el combo.");
      return;
    }
    try {
      const firstProd = newCombo.productos[0];
      const secondProd = newCombo.productos[1] || null;

      const payload = {
        nombre: newCombo.nombre,
        activo: newCombo.activo,
        precio_combo: parseFloat(newCombo.precio_combo),
        productos_json: JSON.stringify(newCombo.productos.map(p => ({
          producto_id: parseInt(p.producto_id),
          cantidad: parseInt(p.cantidad)
        }))),
        producto_requerido: firstProd ? parseInt(firstProd.producto_id) : null,
        cantidad_requerida: firstProd ? parseInt(firstProd.cantidad) : 0,
        producto_asociado: secondProd ? parseInt(secondProd.producto_id) : null,
        cantidad_asociado: secondProd ? parseInt(secondProd.cantidad) : 0,
        imagen_url: newCombo.imagen_url || null,
      };

      if (newCombo.id) {
        await api.combos.update(newCombo.id, payload);
        alert("Combo actualizado exitosamente.");
      } else {
        await api.combos.create(payload);
        alert("Combo creado exitosamente.");
      }

      setNewCombo({
        id: null,
        nombre: "",
        activo: true,
        precio_combo: "",
        productos: [{ producto_id: "", cantidad: 1 }],
        imagen_url: ""
      });
      loadCombosData();
    } catch (e) {
      alert("Error al guardar el combo: " + e.message);
    }
  };

  const handleEditCombo = (c) => {
    let prodList = [];
    if (c.productos_json) {
      try {
        const parsed = JSON.parse(c.productos_json);
        prodList = parsed.map(p => ({
          producto_id: String(p.producto_id || p.id),
          cantidad: Number(p.cantidad || p.quantity || 1)
        }));
      } catch (e) {
        prodList = [];
      }
    }
    
    if (prodList.length === 0) {
      if (c.producto_requerido) {
        prodList.push({
          producto_id: String(c.producto_requerido),
          cantidad: Number(c.cantidad_requerida || 1)
        });
      }
      if (c.producto_asociado) {
        prodList.push({
          producto_id: String(c.producto_asociado),
          cantidad: Number(c.cantidad_asociado || 1)
        });
      }
    }

    if (prodList.length === 0) {
      prodList = [{ producto_id: "", cantidad: 1 }];
    }

    setNewCombo({
      id: c.id,
      nombre: c.nombre,
      activo: c.activo,
      precio_combo: String(c.precio_combo),
      productos: prodList,
      imagen_url: c.imagen_url || ""
    });
  };

  const handleCancelEdit = () => {
    setNewCombo({
      id: null,
      nombre: "",
      activo: true,
      precio_combo: "",
      productos: [{ producto_id: "", cantidad: 1 }],
      imagen_url: ""
    });
  };

  const handleToggleActiveCombo = async (id, currentStatus) => {
    try {
      await api.combos.update(id, { activo: !currentStatus });
      setCombos(prev => prev.map(c => c.id === id ? { ...c, activo: !currentStatus } : c));
    } catch (e) {
      alert("Error al cambiar estado del combo: " + e.message);
    }
  };

  const handleDeleteCombo = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta regla de combo?")) {
      try {
        await api.combos.delete(id);
        alert("Combo eliminado exitosamente.");
        loadCombosData();
      } catch (e) {
        alert("Error al eliminar el combo: " + e.message);
      }
    }
  };

  const handleSendMassEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.title.trim() || !emailForm.message.trim()) {
      alert("Por favor rellena todos los campos.");
      return;
    }

    if (!confirm("¿Estás seguro de que deseas enviar este correo masivo a todos los clientes y suscriptores?")) {
      return;
    }

    setSendingEmail(true);
    try {
      const res = await api.admin.sendMassEmail(emailForm);
      alert(res.detail || "Correo masivo enviado exitosamente.");
      setEmailForm({ subject: "", title: "", message: "" });
    } catch (err) {
      alert("Error al enviar el correo masivo: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

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

  const handleUpdateStatus = async (id, newStatus) => {
    // Actualización optimista de la interfaz
    const previousOrders = [...admin.orders];
    const updatedOrders = admin.orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    admin.setOrders(updatedOrders);
    
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await admin.updateOrderStatus(id, newStatus);
    } catch (e) {
      // Revertir en caso de error
      admin.setOrders(previousOrders);
      alert("Error al actualizar estado: " + e.message);
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
    const file3d = formData.get("model_3d_file");
    const data = Object.fromEntries(formData.entries());
    // Convert checkbox string to boolean
    data.esta_activo = formData.get("esta_activo") === "on";
    
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

      // Manejo de modelo 3D
      if (clearModel3d) {
        data.model_3d_url = "";
      } else if (file3d && file3d.size > 0) {
        const res3d = await api.upload(file3d, 'model_3d');
        data.model_3d_url = res3d.url;
      } else {
        data.model_3d_url = editingProduct?.model_3d_url || null;
      }
      delete data.model_3d_file;

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
    <div className="p-4 md:p-8 space-y-8">
      {/* Rest of the component structure remains similar but is cleaner */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold">Admin Dashboard</h1>
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-2 font-bold transition-all ${activeTab === 'dashboard' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Dashboard Principal
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`pb-2 font-bold transition-all ${activeTab === 'pedidos' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Gestión de Pedidos
            </button>
            <button
              onClick={() => setActiveTab('combos')}
              className={`pb-2 font-bold transition-all ${activeTab === 'combos' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Configuración de Combos
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`pb-2 font-bold transition-all ${activeTab === 'email' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Correo Masivo
            </button>
          </div>
          {admin.lastUpdated && activeTab === 'dashboard' && (
            <p className="text-[10px] text-gray-400 mt-2 font-mono">
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
            Error al cargar datos: {String(admin.error)}
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
          {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  label: "Ingresos Totales",
                  value: `C$${(Number(admin.stats?.revenue) || 0).toLocaleString()}`,
                  icon: TrendingUp,
                  color: "text-brand-accent",
                },
                {
                  label: "Pedidos",
                  value: String(admin.stats?.orders || 0),
                  icon: ShoppingCart,
                  color: "text-blue-600",
                },
                {
                  label: "Productos",
                  value: String(admin.stats?.products || 0),
                  icon: Package,
                  color: "text-purple-600",
                },
                {
                  label: "Stock Bajo",
                  value: String(admin.stats?.lowStock || 0),
                  icon: AlertCircle,
                  color: "text-red-500",
                },
                {
                  label: "Devoluciones",
                  value: `C$${(Number(admin.stats?.refundedAmount) || 0).toLocaleString()}`,
                  icon: RefreshCw,
                  color: "text-orange-600",
                  subtext: `Sem: C$${(Number(admin.stats?.refundedThisWeek) || 0).toLocaleString()} | Mes: C$${(Number(admin.stats?.refundedThisMonth) || 0).toLocaleString()}`,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-5 rounded-2xl border border-brand-accent/10 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <stat.icon className={cn("mb-2", stat.color)} size={22} />
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-xl font-serif font-bold mt-1">
                      {stat.value}
                    </p>
                  </div>
                  {stat.subtext && (
                    <p className="text-[9px] text-gray-500 font-bold tracking-tight mt-2 border-t pt-1.5 border-brand-accent/5">
                      {stat.subtext}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-12">
              <section className="space-y-6">
                <h2 className="text-2xl font-serif font-bold border-b pb-2">
                  Inventario
                </h2>
                <div className="bg-white rounded-2xl border border-brand-accent/10 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-paper text-xs uppercase tracking-tighter font-bold text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Madera</th>
                        <th className="px-6 py-4">Precio</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
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
                            <td className="px-6 py-4 font-medium">
                              <div>{p.name}</div>
                              {p.dimensions && (
                                <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                                  {p.dimensions}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {p.category}
                            </td>
                            <td className="px-6 py-4 text-sm text-brand-accent font-mono">
                              {p.wood_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm">
                              C${p.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded text-xs font-bold",
                                  (Number(p.stock) || 0) < 5
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section className="space-y-6">
                <h2 className="text-2xl font-serif font-bold border-b pb-2">
                  Muebles Base (Diseño)
                </h2>
                <div className="bg-white rounded-2xl border border-brand-accent/10 p-4 space-y-4">
                  <form
                    key={editingFurniture ? editingFurniture.id : "new"}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      try {
                        const file = formData.get("image_file");
                        let imageUrl = editingFurniture ? editingFurniture.image_url : "";
                        if (file && file.size > 0) {
                          const res = await api.upload(file, "image");
                          imageUrl = res.url;
                        } else if (!editingFurniture) {
                          return alert("Debe subir una imagen o modelo 3D");
                        }
                        
                        const data = {
                          name: formData.get("name"),
                          base_price: formData.get("base_price"),
                          image_url: imageUrl,
                          wood_type: formData.get("wood_type") || "N/A",
                          dimensions: formData.get("dimensions") || ""
                        };

                        if (editingFurniture) {
                          await api.customizations.updateFurniture(editingFurniture.id, data);
                          setEditingFurniture(null);
                        } else {
                          await api.customizations.createFurniture(data);
                        }
                        e.target.reset();
                        loadCustomizations();
                      } catch (err) {
                        alert(err.message || "Error al guardar");
                      }
                    }}
                    className="flex flex-col gap-2 border p-3 rounded-xl bg-paper/30"
                  >
                    <input
                      required
                      name="name"
                      defaultValue={editingFurniture ? editingFurniture.name : ""}
                      placeholder="Nombre (ej. Sofá)"
                      className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        required
                        type="number"
                        name="base_price"
                        defaultValue={editingFurniture ? editingFurniture.base_price : ""}
                        placeholder="Precio Base"
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <input
                        required
                        name="wood_type"
                        defaultValue={editingFurniture ? editingFurniture.wood_type : ""}
                        placeholder="Tipo Madera"
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                    </div>
                    <input
                      name="dimensions"
                      defaultValue={editingFurniture ? editingFurniture.dimensions : ""}
                      placeholder="Dimensiones (ej. 45x45x90 cm)"
                      className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                    <label className="text-[10px] uppercase font-bold text-gray-500 mt-1">
                      {editingFurniture ? "Reemplazar Diseño 3D (.glb) o Imagen (Opcional):" : "Diseño 3D (.glb) o Imagen:"}
                    </label>
                    <input
                      required={!editingFurniture}
                      type="file"
                      name="image_file"
                      accept=".glb,image/*"
                      className="px-3 py-1 border rounded-lg text-sm bg-white"
                    />
                    <div className="flex gap-2 mt-1">
                      <button type="submit" className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold">
                        {editingFurniture ? "Guardar Cambios" : "Añadir Mueble"}
                      </button>
                      {editingFurniture && (
                        <button
                          type="button"
                          onClick={() => setEditingFurniture(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="space-y-2">
                    {customFurnitures.map(f => (
                      <div key={f.id} className="flex justify-between items-center p-2 hover:bg-paper rounded-lg border">
                        <div className="flex gap-2 items-center">
                          {f.image_url?.endsWith('.glb') ? (
                            <div className="w-10 h-10 bg-brand-accent/10 rounded flex items-center justify-center text-brand-accent" title="Modelo 3D">
                              <Box size={20} />
                            </div>
                          ) : (
                            <img src={api.getImageUrl(f.image_url)} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-bold">{f.name}</p>
                            <p className="text-[10px] font-mono text-gray-500">
                              {f.wood_type} | ${f.base_price} {f.dimensions ? `| ${f.dimensions}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingFurniture(f)}
                            className="text-blue-500 p-1 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button onClick={async () => {
                            if (confirm("¿Eliminar?")) {
                              await api.customizations.deleteFurniture(f.id);
                              loadCustomizations();
                            }
                          }} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
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
                    <input required type="number" name="price_modifier" placeholder="Precio Extra (C$)" className="px-3 py-1.5 border rounded-lg text-sm col-span-2" />
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
          </>
        )}

        {activeTab === 'pedidos' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-2xl font-serif font-bold">
                Gestión de Pedidos
              </h2>
              <span className="bg-brand-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                {admin.orders.length} pedidos
              </span>
            </div>
            
            {admin.orders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-brand-accent/20 text-center text-gray-400">
                <ShoppingCart
                  size={48}
                  className="mx-auto mb-4 opacity-20"
                />
                <p className="text-lg font-serif italic">
                  No hay pedidos registrados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {admin.orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white p-5 rounded-2xl border border-brand-accent/10 shadow-sm space-y-4 hover:border-brand-accent/30 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-base font-bold text-gray-800">
                          {o.user_name || "Usuario desconocido"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(o.created_at).toLocaleString()}
                        </p>
                        <div className="flex flex-col gap-1 mt-3">
                          <p className="text-[11px] text-brand-accent font-mono flex items-center gap-1 bg-brand-accent/5 w-max px-2 py-1 rounded-md">
                            <span>📱 {o.user_phone}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium">
                            📍 {o.user_department}, {o.user_municipality}
                          </p>
                          <div className="mt-3 p-3 bg-paper rounded-xl border border-brand-accent/5 text-[11px] space-y-2">
                            <span className="font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-sm border block w-max">
                              {o.shipping_type === 'delivery' ? '🚚 ENVÍO A DOMICILIO' : '🏪 RETIRAR EN TIENDA'}
                            </span>
                            {o.shipping_type === 'delivery' && (
                              <>
                                <p className="text-gray-600 leading-relaxed"><span className="font-bold block text-[10px] uppercase text-gray-400 mb-0.5">Dirección Exacta:</span> {o.shipping_address}</p>
                                <p className="text-brand-accent font-bold mt-2">
                                  Costo Delivery: {o.shipping_cost > 0 ? `C$${o.shipping_cost}` : 'No asignado'}
                                </p>
                                
                                {(!o.shipping_cost || o.shipping_cost === 0) && (
                                  <div className="mt-2 flex gap-2 items-center bg-white p-2 rounded border border-yellow-100 shadow-inner">
                                    <input 
                                      type="number" 
                                      placeholder="C$ Costo Flete"
                                      value={shippingCosts[o.id] || ""}
                                      onChange={(e) => setShippingCosts(prev => ({...prev, [o.id]: e.target.value}))}
                                      className="w-full p-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                    />
                                    <button 
                                      onClick={() => handleSetShippingCost(o.id)}
                                      className="px-3 py-1.5 bg-brand-primary text-white font-bold rounded hover:bg-brand-accent transition-all whitespace-nowrap"
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
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-mono text-lg font-bold text-brand-accent mb-1">
                          C${o.total.toLocaleString()}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] px-2.5 py-1 rounded-full uppercase font-bold shadow-sm inline-block",
                            o.status === "pending"           ? "bg-yellow-100 text-yellow-700" :
                            o.status === "payment_review"    ? "bg-orange-100 text-orange-700" :
                            o.status === "payment_validated" ? "bg-blue-100 text-blue-700" :
                            o.status === "processing"        ? "bg-purple-100 text-purple-700" :
                            o.status === "ready"             ? "bg-indigo-100 text-indigo-700" :
                            o.status === "delivered"         ? "bg-green-100 text-green-700" :
                            o.status === "refund_pending"    ? "bg-orange-100 text-orange-700 animate-pulse" :
                            o.status === "refunded"          ? "bg-gray-100 text-gray-700" :
                            "bg-red-100 text-red-700"
                          )}
                        >
                          {o.status === "pending"           ? "Pend. Procesar" :
                            o.status === "payment_review"    ? "Revisando Pago" :
                            o.status === "payment_validated" ? "Pago Validado" :
                            o.status === "processing"        ? "En Proceso" :
                            o.status === "ready"             ? "Listo para Entrega" :
                            o.status === "delivered"         ? "Finalizado" :
                            o.status === "refund_pending"    ? "Devolución Sol." :
                            o.status === "refunded"          ? "Devuelto" :
                            "Cancelado"}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">
                          Pago: {o.payment_method === 'paypal' ? 'PayPal' : 'Comprobante'}
                        </p>
                        {o.shipping_type === 'delivery' && o.shipping_status === 'paid' && (
                          <div className="p-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-bold text-center uppercase tracking-wider mt-2 animate-pulse shadow-md">
                            🔔 Revisar Flete
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 mt-auto border-t border-brand-accent/10 flex-wrap">
                      <button
                        onClick={() => loadOrderDetails(o)}
                        className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Ver Detalle
                      </button>
                      {o.shipping_type === 'delivery' && o.shipping_status === 'paid' && (
                        <button
                          onClick={() => handleValidateShipping(o.id)}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm"
                        >
                          Validar Flete ✓
                        </button>
                      )}
                      {/* Step 1: Admin reviews payment */}
                      {o.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, "payment_review")}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-sm"
                        >
                          Revisar Pago
                        </button>
                      )}

                      {/* Step 2: Admin validates payment */}
                      {o.status === "payment_review" && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, "payment_validated")}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                        >
                          Validar Pago ✓
                        </button>
                      )}

                      {/* Step 3: Mark as processing (in fabrication/pending pickup) */}
                      {o.status === "payment_validated" && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, "processing")}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-sm"
                        >
                          En Proceso
                        </button>
                      )}

                      {/* Step 4: Finalize / delivered */}
                      {/* Step 4: Mark as ready */}
                      {o.status === "processing" && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, "ready")}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                        >
                          Listo ✓
                        </button>
                      )}

                      {/* Step 5: Finalize / delivered */}
                      {o.status === "ready" && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, "delivered")}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm"
                        >
                          Finalizar ✓
                        </button>
                      )}

                      {/* Step 6: Refund approval */}
                      {o.status === "refund_pending" && (
                        <button
                          onClick={() => {
                            if (confirm("¿Estás seguro de hacer efectiva esta devolución? Se reintegrará el stock y se reembolsarán los pagos.")) {
                              handleUpdateStatus(o.id, "refunded");
                            }
                          }}
                          className="flex-1 text-[11px] font-bold uppercase tracking-wider py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-sm"
                        >
                          Aprobar Devolución ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'combos' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-2xl font-serif font-bold">Configuración de Combos Promocionales</h2>
              <span className="bg-brand-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                {combos.length} reglas activas
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to Create/Edit Combo */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-brand-accent/10 shadow-sm space-y-4">
                <h3 className="text-lg font-serif font-bold border-b pb-2">
                  {newCombo.id ? "Editar Regla de Combo" : "Crear Nueva Regla"}
                </h3>
                <form onSubmit={handleCreateCombo} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Combo</label>
                    <input
                      type="text"
                      placeholder="Ej. Lleva una mesa gratis por 4 sillas"
                      value={newCombo.nombre}
                      onChange={(e) => setNewCombo({ ...newCombo, nombre: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Muebles en el Combo</label>
                      <button
                        type="button"
                        onClick={() => setNewCombo({
                          ...newCombo,
                          productos: [...newCombo.productos, { producto_id: "", cantidad: 1 }]
                        })}
                        className="text-[11px] font-bold text-brand-primary hover:text-brand-accent flex items-center gap-0.5"
                      >
                        <Plus size={12} /> Añadir mueble
                      </button>
                    </div>

                    {newCombo.productos.map((prodItem, idx) => (
                      <div key={idx} className="p-3 bg-paper/50 rounded-xl space-y-2 border relative">
                        {newCombo.productos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedProds = newCombo.productos.filter((_, i) => i !== idx);
                              setNewCombo({ ...newCombo, productos: updatedProds });
                            }}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-0.5 rounded transition-colors"
                            title="Remover este mueble"
                          >
                            <X size={14} />
                          </button>
                        )}
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Mueble #{idx + 1}</label>
                          <select
                            value={prodItem.producto_id}
                            onChange={(e) => {
                              const updated = [...newCombo.productos];
                              updated[idx].producto_id = e.target.value;
                              setNewCombo({ ...newCombo, productos: updated });
                            }}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs"
                            required
                          >
                            <option value="">Selecciona un mueble...</option>
                            {(admin.products || []).map(p => (
                              <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={prodItem.cantidad}
                            onChange={(e) => {
                              const updated = [...newCombo.productos];
                              updated[idx].cantidad = parseInt(e.target.value) || 1;
                              setNewCombo({ ...newCombo, productos: updated });
                            }}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Precio del Combo Completo</label>
                    <input
                      type="number"
                      placeholder="Ej. 9500"
                      value={newCombo.precio_combo}
                      onChange={(e) => setNewCombo({ ...newCombo, precio_combo: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen del Combo (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const res = await api.upload(file, 'combo');
                            setNewCombo(prev => ({ ...prev, imagen_url: res.url }));
                          } catch (err) {
                            alert("Error al subir la imagen del combo: " + err.message);
                          }
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                    />
                    {newCombo.imagen_url && (
                      <div className="relative mt-2 w-full h-32 rounded-xl overflow-hidden border border-brand-accent/15 bg-paper/50 flex items-center justify-center">
                        <img src={api.getImageUrl(newCombo.imagen_url)} alt="Vista previa del combo" className="object-contain h-full w-full" />
                        <button
                          type="button"
                          onClick={() => setNewCombo(prev => ({ ...prev, imagen_url: "" }))}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-all"
                          title="Remover imagen"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      id="activo_combo"
                      checked={newCombo.activo}
                      onChange={(e) => setNewCombo({ ...newCombo, activo: e.target.checked })}
                      className="w-4 h-4 accent-brand-accent rounded cursor-pointer"
                    />
                    <label htmlFor="activo_combo" className="text-xs font-medium text-gray-600 cursor-pointer select-none">
                      Regla Activa
                    </label>
                  </div>

                  <div className="flex gap-2">
                    {newCombo.id && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-brand-primary hover:bg-brand-accent text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {newCombo.id ? "Guardar" : "Crear Combo"}
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Combos */}
              <div className="lg:col-span-2 space-y-4">
                {loadingCombos ? (
                  <div className="text-center py-12 text-gray-400 italic">Cargando combos...</div>
                ) : combos.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-dashed border-brand-accent/20 text-center text-gray-400">
                    <p className="text-lg font-serif italic">No hay reglas de combo configuradas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combos.map((c) => {
                      const detailList = c.productos_detalle || [];
                      return (
                        <div key={c.id} className="bg-white p-5 rounded-2xl border border-brand-accent/10 shadow-sm flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            {c.imagen_url && (
                              <div className="w-full h-32 rounded-xl overflow-hidden border border-brand-accent/5 bg-paper/20">
                                <img src={api.getImageUrl(c.imagen_url)} alt={c.nombre} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-serif font-bold text-base text-brand-primary line-clamp-2">{c.nombre}</h4>
                              
                              {/* Toggle switch for active status */}
                              <label className="relative inline-flex items-center cursor-pointer select-none" title={c.activo ? "Desactivar Combo" : "Activar Combo"}>
                                <input
                                  type="checkbox"
                                  checked={c.activo}
                                  onChange={() => handleToggleActiveCombo(c.id, c.activo)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                <span className="ml-1.5 text-[10px] font-bold text-gray-500 uppercase">
                                  {c.activo ? 'ON' : 'OFF'}
                                </span>
                              </label>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1.5">
                              <div className="bg-paper/30 p-2 rounded-xl border border-gray-100 space-y-1">
                                <p className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Productos en el Combo:</p>
                                {detailList.length > 0 ? (
                                  detailList.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-gray-700 text-xs">
                                      <span>📦 {item.nombre}</span>
                                      <span className="font-bold">x{item.cantidad}</span>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex justify-between text-gray-700 text-xs">
                                      <span>📦 {c.producto_requerido_nombre}</span>
                                      <span className="font-bold">x{c.cantidad_requerida}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 text-xs">
                                      <span>📦 {c.producto_asociado_nombre}</span>
                                      <span className="font-bold">x{c.cantidad_asociado}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {c.precio_combo && (
                                <div className="flex justify-between items-center pt-1 px-1">
                                  <span className="font-medium text-gray-400">Precio especial:</span>
                                  <span className="font-bold text-brand-accent text-sm">C${Number(c.precio_combo).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-dashed">
                            <button
                              type="button"
                              onClick={() => handleEditCombo(c)}
                              className="text-brand-primary hover:bg-brand-primary/5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                            >
                              <Edit3 size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCombo(c.id)}
                              className="text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1"
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'email' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-2xl font-serif font-bold">Envío de Correo Masivo</h2>
              <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                Marketing y Boletines
              </span>
            </div>

            <div className="max-w-2xl bg-white p-8 rounded-3xl border border-brand-accent/10 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-serif font-bold text-gray-800">Enviar Campaña a Clientes y Suscriptores</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Esta herramienta permite enviar un correo informativo masivo a todos los clientes registrados y usuarios suscritos al boletín de noticias de Angela Mueblería. El correo incluirá automáticamente una sección destacada con los primeros 10 productos activos de tu catálogo junto con sus precios y descripciones.
                </p>
              </div>

              <form onSubmit={handleSendMassEmail} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Asunto del Correo</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: ¡Descubre nuestro catálogo exclusivo de temporada!"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Título del Boletín (Encabezado)</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Nuevos mimbre y diseños de temporada"
                    value={emailForm.title}
                    onChange={(e) => setEmailForm({ ...emailForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mensaje / Introducción</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Escribe el mensaje introductorio para tus clientes. Ej: Nos complace presentarte nuestra más reciente colección de muebles artesanales..."
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full bg-brand-primary hover:bg-brand-accent text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingEmail ? "Enviando correos..." : "Enviar Correo Masivo ✉"}
                </button>
              </form>
            </div>
          </section>
        )}
      </>
    )}

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
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh] p-1"
              >
                <input
                  required
                  name="name"
                  placeholder="Nombre"
                  defaultValue={editingProduct?.name}
                  className="sm:col-span-2 w-full px-4 py-2 border rounded-lg"
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
                  className="sm:col-span-2 w-full px-4 py-2 border rounded-lg"
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
                <input
                  name="dimensions"
                  placeholder="Dimensiones (ej. 45x45x90 cm)"
                  defaultValue={editingProduct?.dimensions}
                  className="sm:col-span-2 w-full px-4 py-2 border rounded-lg"
                />
                <div className="sm:col-span-2 flex items-center gap-2 px-1 py-2">
                  <input 
                    type="checkbox" 
                    name="esta_activo" 
                    id="esta_activo" 
                    defaultChecked={editingProduct ? editingProduct.esta_activo : true}
                    className="w-4 h-4 accent-brand-accent rounded cursor-pointer"
                  />
                  <label htmlFor="esta_activo" className="text-sm font-bold text-gray-600 cursor-pointer">
                    Mostrar producto en el catálogo público
                  </label>
                </div>
                <div className="sm:col-span-2 w-full">
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

                <div className="sm:col-span-2 w-full pt-3 border-t border-gray-100">
                  <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Modelo 3D del Producto (.glb)</label>
                  <input
                    type="file"
                    name="model_3d_file"
                    accept=".glb"
                    className="w-full px-4 py-1.5 border rounded-lg text-sm bg-white"
                  />
                  {editingProduct?.model_3d_url && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold text-brand-primary">Modelo 3D actual:</span>
                        <a 
                          href={api.getImageUrl(editingProduct.model_3d_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-accent hover:underline font-mono truncate max-w-[180px]"
                        >
                          {editingProduct.model_3d_url.split('/').pop()}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id="clear_model_3d"
                          checked={clearModel3d}
                          onChange={(e) => setClearModel3d(e.target.checked)}
                          className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                        />
                        <label htmlFor="clear_model_3d" className="text-xs text-red-600 font-bold cursor-pointer">
                          Quitar modelo 3D
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 mt-4">
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
                        <div className="mt-1">
                          <img 
                            src={api.getImageUrl(selectedOrder.payment_receipt_url)} 
                            alt="Comprobante" 
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity mb-1"
                            onClick={() => setViewReceipt(selectedOrder.payment_receipt_url)}
                          />
                          <button 
                            onClick={() => setViewReceipt(selectedOrder.payment_receipt_url)}
                            className="text-[9px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded hover:bg-brand-accent hover:text-white transition-colors font-bold w-16 text-center"
                          >
                            Ampliar
                          </button>
                        </div>
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
                              <div className="mt-2">
                                <img 
                                  src={api.getImageUrl(selectedOrder.shipping_payment_receipt_url)} 
                                  alt="Flete" 
                                  className="w-16 h-16 object-cover rounded-lg border border-orange-200 cursor-pointer hover:opacity-80 transition-opacity mb-1"
                                  onClick={() => setViewReceipt(selectedOrder.shipping_payment_receipt_url)}
                                />
                                <button 
                                  onClick={() => setViewReceipt(selectedOrder.shipping_payment_receipt_url)}
                                  className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded hover:bg-orange-600 transition-colors font-bold w-16 text-center animate-pulse"
                                >
                                  Ver Flete
                                </button>
                              </div>
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
                        <CartItemPreview item={item} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold leading-tight">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-[10px] text-gray-500 leading-tight mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-[10px] text-brand-accent font-semibold mt-0.5">
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
                  {selectedOrder.status === "refund_pending" ? (
                    <button
                      onClick={() => {
                        if (confirm("¿Estás seguro de hacer efectiva esta devolución? Se reintegrará el stock y se reembolsarán los pagos.")) {
                          handleUpdateStatus(selectedOrder.id, "refunded");
                        }
                      }}
                      className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700 transition-all text-xs uppercase tracking-wider"
                    >
                      Aprobar Devolución ✓
                    </button>
                  ) : selectedOrder.status === "refunded" ? (
                    <div className="flex-1 text-center py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold border border-gray-200 text-sm">
                      Devolución Efectuada 💸
                    </div>
                  ) : selectedOrder.status === "cancelled" ? (
                    <div className="flex-1 text-center py-4 bg-red-50 text-red-500 rounded-2xl font-bold border border-red-100 text-sm">
                      Pedido Cancelado
                    </div>
                  ) : selectedOrder.status === "delivered" ? (
                    <div className="flex-1 text-center py-4 bg-green-50 text-green-600 rounded-2xl font-bold border border-green-100 text-sm">
                      Pedido Finalizado 🎉
                    </div>
                  ) : (
                    <div className="flex-1 text-center py-4 bg-brand-primary/5 text-brand-primary rounded-2xl font-bold border border-brand-primary/10 text-sm">
                      Estado: {
                        selectedOrder.status === "pending" ? "Pendiente" :
                        selectedOrder.status === "payment_review" ? "En Revisión de Pago" :
                        selectedOrder.status === "payment_validated" ? "Pago Validado" :
                        selectedOrder.status === "processing" ? "En Fabricación" :
                        selectedOrder.status === "ready" ? "Listo para entrega" :
                        selectedOrder.status
                      }
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
