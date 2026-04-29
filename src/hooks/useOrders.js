import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.orders.getMy();
      setOrders(data);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getOrderItems = async (orderId) => {
    try {
      return await api.orders.getMyItems(orderId);
    } catch (e) {
      throw new Error(e.message);
    }
  };

  return {
    orders,
    loading,
    error,
    refresh: loadOrders,
    getOrderItems,
  };
}
