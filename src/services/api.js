const API_BASE = import.meta.env.VITE_API_URL || "";

export const api = {
  // Ayudante para obtener la URL completa de una imagen
  getImageUrl(url) {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    // Si la ruta es relativa (comienza con /), le pegamos el dominio del backend
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  },

  async fetch(endpoint, options = {}) {
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
      
      // Si el token es inválido o expiró (Error 401)
      if (res.status === 401) {
        localStorage.removeItem("muebleria_token");
        localStorage.removeItem("muebleria_user");
        // Si el catálogo falla por token, lanzamos un mensaje más amigable
        if (endpoint.includes("/apiProducto/")) {
           throw new Error("Sesión expirada. Cargando catálogo público...");
        }
      }

      // Si Django nos dice que el username/email ya existe:
      if (error.username || error.email) {
        throw new Error("Este correo electrónico ya está registrado. Intenta con otro o inicia sesión.");
      }
      // Si la cuenta aún no ha sido activada por correo (Error de SimpleJWT)
      if (error.detail && error.detail.includes("No active account found")) {
        throw new Error("Tu cuenta aún no está activada. Por favor, revisa tu correo electrónico y haz clic en el enlace de confirmación.");
      }

      throw new Error(error.error || error.detail || "Error en la solicitud. Revisa tus datos.");
    }
    return res.json();
  },

  auth: {
    login: async (credentials) => {
      // Django SimpleJWT espera 'username', así que mapeamos 'email' a 'username'
      const data = await api.fetch("/api/token/", {
        method: "POST",
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });
      // Ahora usamos los datos REALES que vienen de Django (id, name, role)
      return { 
        token: data.access, 
        user: data.user 
      };
    },
    register: (userData) =>
      api.fetch("/apiUsuarios/Usuario/", {
        method: "POST",
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: userData.password,
          first_name: userData.name,
          last_name: "",
          numero_telefono: userData.phone || "",
          direccion_exacta: userData.address || "",
          municipio: userData.municipalityId || null, // Ahora enviamos el ID real de Postgres
          rol: "cliente"
        }),
      }),
  },

  products: {
    getAll: () => api.fetch("/apiProducto/Producto/"),
    create: (data) =>
      api.fetch("/apiProducto/Producto/", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      api.fetch(`/apiProducto/Producto/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id) => api.fetch(`/apiProducto/Producto/${id}/`, { method: "DELETE" }),
  },

  orders: {
    create: (data) =>
      api.fetch("/apiPedidos/Pedido/", { method: "POST", body: JSON.stringify(data) }),
    getMy: () => api.fetch("/apiPedidos/Pedido/mis_pedidos/"),
    getMyItems: (id) => api.fetch(`/apiPedidos/Pedido/${id}/get_detalles/`),
    adminGetAll: () => api.fetch("/apiPedidos/Pedido/"),
    adminUpdateStatus: (id, status) =>
      api.fetch(`/apiPedidos/Pedido/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  admin: {
    getStats: () => ({ revenue: 0, orders: 0, products: 0, lowStock: 0 }), // Temporal
  },

  upload: async (file, type) => {
    // Las subidas de archivos en Django requieren una configuración diferente (FormData)
    // Dejamos el endpoint como estaba pero apuntando a la estructura de Django
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
    getFurnitures: () => [], // Desactivado hasta que exista en Django
    getColors: () => [],
  },

  marketing: {
    subscribeNewsletter: (email) => 
      api.fetch("/apiSuscripcion/Suscripcion/", { method: "POST", body: JSON.stringify({ email }) }),
    validateDiscount: (code) => 
      api.fetch("/apiSuscripcion/Suscripcion/validate-discount/", { method: "POST", body: JSON.stringify({ code }) }),
  },

  locations: {
    getDepartments: () => api.fetch("/apiDepartamento/Departamento/"),
    getMunicipalities: () => api.fetch("/apiMunicipio/Municipio/"),
  }
};
