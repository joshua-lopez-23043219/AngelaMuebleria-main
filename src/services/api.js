const API_BASE = "/api";

export const api = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem("muebleria_token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Request failed");
    }
    return res.json();
  },

  auth: {
    login: (credentials) =>
      api.fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      api.fetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
  },

  products: {
    getAll: () => api.fetch("/products"),
    create: (data) =>
      api.fetch("/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      api.fetch(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id) => api.fetch(`/products/${id}`, { method: "DELETE" }),
  },

  orders: {
    create: (data) =>
      api.fetch("/orders", { method: "POST", body: JSON.stringify(data) }),
    getMy: () => api.fetch("/orders/my"),
    getMyItems: (id) => api.fetch(`/orders/${id}/items`),
    adminGetAll: () => api.fetch("/admin/orders"),
    adminUpdateStatus: (id, status) =>
      api.fetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    adminGetItems: (id) => api.fetch(`/admin/orders/${id}/items`),
    adminSetShippingCost: (id, shipping_cost) =>
      api.fetch(`/admin/orders/${id}/shipping`, {
        method: "PATCH",
        body: JSON.stringify({ shipping_cost }),
      }),
    payOrder: (id, data) =>
      api.fetch(`/orders/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  admin: {
    getStats: () => api.fetch("/admin/stats"),
  },

  upload: async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    const token = localStorage.getItem("muebleria_token");
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  customizations: {
    getFurnitures: () => api.fetch("/custom-furnitures"),
    createFurniture: (data) => api.fetch("/custom-furnitures", { method: "POST", body: JSON.stringify(data) }),
    deleteFurniture: (id) => api.fetch(`/custom-furnitures/${id}`, { method: "DELETE" }),
    
    getColors: () => api.fetch("/custom-colors"),
    createColor: (data) => api.fetch("/custom-colors", { method: "POST", body: JSON.stringify(data) }),
    deleteColor: (id) => api.fetch(`/custom-colors/${id}`, { method: "DELETE" }),
  },

  marketing: {
    subscribeNewsletter: (email) => api.fetch("/newsletter", { method: "POST", body: JSON.stringify({ email }) }),
    validateDiscount: (code) => api.fetch("/discount/validate", { method: "POST", body: JSON.stringify({ code }) })
  }
};
