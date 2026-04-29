import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";

export function useAdmin() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        api.admin.getStats(),
        api.orders.adminGetAll(),
        api.products.getAll(),
      ]);

      // Stats
      if (results[0].status === "fulfilled") {
        setStats(results[0].value);
      } else {
        console.error("Stats error:", results[0].reason);
        setError("Error stats: " + (results[0].reason?.message || "desconocido"));
      }

      // Orders
      if (results[1].status === "fulfilled") {
        setOrders(results[1].value);
      } else {
        console.error("Orders error:", results[1].reason);
        setError("Error pedidos: " + (results[1].reason?.message || "desconocido"));
      }

      // Products
      if (results[2].status === "fulfilled") {
        setProducts(results[2].value);
      } else {
        console.error("Products error:", results[2].reason);
      }

      setLastUpdated(new Date());
    } catch (e) {
      console.error("Admin loadData critical error:", e);
      setError("Error crítico: " + e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds (silent — no loading spinner)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [loadData]);

  const updateOrderStatus = async (id, status) => {
    try {
      await api.orders.adminUpdateStatus(id, status);
      await loadData(true);
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.products.delete(id);
      await loadData(true);
    } catch (e) {
      throw new Error(e.message);
    }
  };

  return {
    stats,
    orders,
    products,
    loading,
    error,
    lastUpdated,
    refresh: () => loadData(false),
    updateOrderStatus,
    deleteProduct,
  };
}
