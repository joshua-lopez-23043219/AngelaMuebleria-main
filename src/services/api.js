const API_BASE = import.meta.env.VITE_API_URL || "";

const getImageUrl = (url) => {
  if (!url) return null;
  
  // Si la URL ya viene completa, forzamos HTTPS si la app está en HTTPS
  if (url.startsWith("http")) {
    if (window.location.protocol === "https:" && url.startsWith("http:")) {
      return url.replace("http:", "https:");
    }
    return url;
  }
  
  // Si la ruta es relativa, construimos la URL
  let fullUrl = `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  
  // Forzamos HTTPS si estamos en un sitio seguro y la API base tenía http://
  if (window.location.protocol === "https:" && fullUrl.startsWith("http:")) {
    fullUrl = fullUrl.replace("http:", "https:");
  }
  
  return fullUrl;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("muebleria_token");
  const isAuthRequest = endpoint.includes("/api/token/") || 
    ((endpoint === "/apiUsuarios/Usuario/" || endpoint === "/apiUsuarios/Usuario") && options.method === "POST");

  const headers = {
    "Content-Type": "application/json",
    ...(token && !isAuthRequest ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let errorMsg = "Error en el servidor";
    let errorData = {};
    try {
      errorData = await res.json();
      errorMsg = errorData.error || errorData.detail || errorMsg;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg[0];
      } else if (typeof errorMsg === 'object' && errorMsg !== null) {
        errorMsg = Object.values(errorMsg)[0];
        if (Array.isArray(errorMsg)) errorMsg = errorMsg[0];
      }
    } catch (e) {
      if (res.status === 500) {
        errorMsg = "Error interno del servidor (500). Por favor contacta al soporte.";
      } else {
        errorMsg = `Error ${res.status}: La solicitud no pudo ser procesada.`;
      }
    }
    
    if (res.status === 401) {
      localStorage.removeItem("muebleria_token");
      localStorage.removeItem("muebleria_user");
      if (endpoint.includes("/apiProducto/")) {
         throw new Error("Sesión expirada. Cargando catálogo público...");
      }
    }

    if (errorData.username || errorData.email) {
      throw new Error("Este correo electrónico ya está registrado. Intenta con otro o inicia sesión.");
    }
    if (errorMsg && typeof errorMsg === 'string' && errorMsg.includes("No active account found")) {
      throw new Error("Credenciales incorrectas o la cuenta aún no está activa. Revisa tu contraseña y tu correo de confirmación.");
    }

    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
};

export const api = {
  getImageUrl,
  fetch: apiFetch,

  auth: {
    login: async (credentials) => {
      const data = await apiFetch("/api/token/", {
        method: "POST",
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });
      return { 
        token: data.access, 
        user: data.user 
      };
    },
    register: (userData) =>
      apiFetch("/apiUsuarios/Usuario/", {
        method: "POST",
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: userData.password,
          first_name: userData.name,
          last_name: "",
          numero_telefono: userData.phone || "",
          direccion_exacta: userData.address || "",
          municipio: userData.municipalityId || null,
          rol: "cliente"
        }),
      }),
    recoverPassword: (email) =>
      apiFetch("/apiUsuarios/Usuario/recuperar_contrasena/", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (uidb64, token, newPassword) =>
      apiFetch("/apiUsuarios/Usuario/restablecer_contrasena/", {
        method: "POST",
        body: JSON.stringify({
          uidb64,
          token,
          new_password: newPassword,
        }),
      }),
  },

  products: {
    getAll: async () => {
      const res = await apiFetch("/apiProducto/Producto/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    create: (data) =>
      apiFetch("/apiProducto/Producto/", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/apiProducto/Producto/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id) => apiFetch(`/apiProducto/Producto/${id}/`, { method: "DELETE" }),
  },

  orders: {
    create: (data) =>
      apiFetch("/apiPedidos/Pedido/", { method: "POST", body: JSON.stringify(data) }),
    getMy: async () => {
      const res = await apiFetch("/apiPedidos/Pedido/mis_pedidos/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    getMyItems: (id) => apiFetch(`/apiPedidos/Pedido/${id}/get_detalles/`),
    cancel: (id) =>
      apiFetch(`/apiPedidos/Pedido/${id}/cancelar/`, { method: "POST" }),
    requestRefund: (id) =>
      apiFetch(`/apiPedidos/Pedido/${id}/solicitar_devolucion/`, { method: "POST" }),
    payShipping: (id, data) =>
      apiFetch(`/apiPedidos/Pedido/${id}/pay_shipping/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    adminGetAll: async () => {
      const res = await apiFetch("/apiPedidos/Pedido/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    adminUpdateStatus: (id, status) =>
      apiFetch(`/apiPedidos/Pedido/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    adminSetShippingCost: (id, cost) =>
      apiFetch(`/apiPedidos/Pedido/${id}/set_shipping_cost/`, {
        method: "PATCH",
        body: JSON.stringify({ shipping_cost: cost }),
      }),
    adminValidateShippingPayment: (id) =>
      apiFetch(`/apiPedidos/Pedido/${id}/validate_shipping/`, {
        method: "POST",
      }),
    adminGetItems: (id) => apiFetch(`/apiPedidos/Pedido/${id}/get_detalles/`),
  },

  combos: {
    getAll: async () => {
      const res = await apiFetch("/apiComboPedido/ReglaCombo/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    create: (data) =>
      apiFetch("/apiComboPedido/ReglaCombo/", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/apiComboPedido/ReglaCombo/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      apiFetch(`/apiComboPedido/ReglaCombo/${id}/`, { method: "DELETE" }),
  },
  categories: {
    getAll: async () => {
      const res = await apiFetch("/apiCategoria/Categoria/");
      return Array.isArray(res) ? res : (res.results || []);
    }
  },

  admin: {
    getStats: () => apiFetch("/apiPedidos/Pedido/stats/").catch(() => null),
    sendMassEmail: (data) =>
      apiFetch("/apiUsuarios/Usuario/enviar_correo_masivo/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendIndividualEmail: (data) =>
      apiFetch("/apiUsuarios/Usuario/enviar_correo_individual/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },


  users: {
    getAll: async () => {
      const res = await apiFetch("/apiUsuarios/Usuario/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    update: (id, data) =>
      apiFetch(`/apiUsuarios/Usuario/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ban: (id, isActive) =>
      apiFetch(`/apiUsuarios/Usuario/${id}/ban_user/`, {
        method: "POST",
        body: JSON.stringify({ is_active: isActive }),
      }),
    activateManual: (id) =>
      apiFetch(`/apiUsuarios/Usuario/${id}/activar_manual/`, {
        method: "POST",
      }),
  },

  upload: async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    const token = localStorage.getItem("muebleria_token");
    const res = await fetch(`${API_BASE}/api/upload/`, { 
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) {
       if (res.status === 401) {
         localStorage.removeItem("muebleria_token");
         localStorage.removeItem("muebleria_user");
         throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para completar esta acción.");
       }
       const err = await res.json().catch(() => ({}));
       throw new Error(err.error || err.detail || "Error al subir la imagen. Por favor verifica el formato y tamaño (máx 25MB).");
    }
    return res.json();
  },

  customizations: {
    getFurnitures: async () => {
      const res = await apiFetch(`/apiPersonalizacion/MuebleBase/?_t=${Date.now()}`);
      return Array.isArray(res) ? res : (res.results || []);
    },
    createFurniture: (data) => 
      apiFetch("/apiPersonalizacion/MuebleBase/", { method: "POST", body: JSON.stringify(data) }),
    updateFurniture: (id, data) => 
      apiFetch(`/apiPersonalizacion/MuebleBase/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteFurniture: (id) => 
      apiFetch(`/apiPersonalizacion/MuebleBase/${id}/`, { method: "DELETE" }),
    getColors: async () => {
      const res = await apiFetch(`/apiPersonalizacion/ColorMaterial/?_t=${Date.now()}`);
      return Array.isArray(res) ? res : (res.results || []);
    },
    createColor: (data) => 
      apiFetch("/apiPersonalizacion/ColorMaterial/", { method: "POST", body: JSON.stringify(data) }),
    deleteColor: (id) => 
      apiFetch(`/apiPersonalizacion/ColorMaterial/${id}/`, { method: "DELETE" }),
    getColorModels: async () => {
      const res = await apiFetch(`/apiPersonalizacion/MuebleColorModelo3D/?_t=${Date.now()}`);
      return Array.isArray(res) ? res : (res.results || []);
    },
    createColorModel: (data) =>
      apiFetch("/apiPersonalizacion/MuebleColorModelo3D/", { method: "POST", body: JSON.stringify(data) }),
    deleteColorModel: (id) =>
      apiFetch(`/apiPersonalizacion/MuebleColorModelo3D/${id}/`, { method: "DELETE" }),
  },

  marketing: {
    subscribeNewsletter: (email) => 
      apiFetch("/apiSuscripcion/Suscripcion/", { method: "POST", body: JSON.stringify({ email }) }),
    validateDiscount: (code) => 
      apiFetch("/apiSuscripcion/Suscripcion/validate-discount/", { method: "POST", body: JSON.stringify({ code }) }),
    generateCoupons: (data) =>
      apiFetch("/apiSuscripcion/Suscripcion/generar-cupones/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  locations: {
    getDepartments: async () => {
      const res = await apiFetch("/apiDepartamento/Departamento/");
      return Array.isArray(res) ? res : (res.results || []);
    },
    getMunicipalities: async () => {
      const res = await apiFetch("/apiMunicipio/Municipio/");
      return Array.isArray(res) ? res : (res.results || []);
    },
  }
};
