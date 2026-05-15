const API_BASE = import.meta.env.VITE_API_URL || "";

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("muebleria_token");
  const isAuthRequest = endpoint.includes("/api/token/") || (endpoint.includes("/apiUsuarios/Usuario/") && options.method === "POST");

  const headers = {
    "Content-Type": "application/json",
    ...(token && !isAuthRequest ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    
    if (res.status === 401) {
      localStorage.removeItem("muebleria_token");
      localStorage.removeItem("muebleria_user");
      if (endpoint.includes("/apiProducto/")) {
         throw new Error("Sesión expirada. Cargando catálogo público...");
      }
    }

    if (error.username || error.email) {
      throw new Error("Este correo electrónico ya está registrado. Intenta con otro o inicia sesión.");
    }
    if (error.detail && error.detail.includes("No active account found")) {
      throw new Error("Tu cuenta aún no está activada. Por favor, revisa tu correo electrónico y haz clic en el enlace de confirmación.");
    }

    throw new Error(error.error || error.detail || "Error en la solicitud. Revisa tus datos.");
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
  },

  products: {
    getAll: () => apiFetch("/apiProducto/Producto/"),
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
    getMy: () => apiFetch("/apiPedidos/Pedido/mis_pedidos/"),
    getMyItems: (id) => apiFetch(`/apiPedidos/Pedido/${id}/get_detalles/`),
    adminGetAll: () => apiFetch("/apiPedidos/Pedido/"),
    adminUpdateStatus: (id, status) =>
      apiFetch(`/apiPedidos/Pedido/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  admin: {
    getStats: () => ({ revenue: 0, orders: 0, products: 0, lowStock: 0 }),
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
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  customizations: {
    getFurnitures: () => [],
    getColors: () => [],
  },

  marketing: {
    subscribeNewsletter: (email) => 
      apiFetch("/apiSuscripcion/Suscripcion/", { method: "POST", body: JSON.stringify({ email }) }),
    validateDiscount: (code) => 
      apiFetch("/apiSuscripcion/Suscripcion/validate-discount/", { method: "POST", body: JSON.stringify({ code }) }),
  },

  locations: {
    getDepartments: () => apiFetch("/apiDepartamento/Departamento/"),
    getMunicipalities: () => apiFetch("/apiMunicipio/Municipio/"),
  }
};
