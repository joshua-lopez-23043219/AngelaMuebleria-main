import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { api } from "../services/api";

export const ResetPasswordPage = ({ onChangePage }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get("uid") || "");
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!uid || !token) {
      setError("Faltan parámetros de seguridad obligatorios. Por favor, solicita un nuevo enlace.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(uid, token, password);
      setSuccess(true);
      // Limpiar URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white border border-brand-accent/20 rounded-2xl p-8 shadow-xl shadow-brand-accent/5"
      >
        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-200">
              <CheckCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-gray-800">¡Contraseña Cambiada!</h3>
              <p className="text-sm text-gray-500">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <button
              onClick={() => onChangePage("login")}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg"
            >
              Iniciar Sesión
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold">Nueva Contraseña</h2>
              <p className="text-xs text-gray-500 mt-2">
                Ingresa y confirma tu nueva contraseña de acceso.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    className="w-full pl-10 pr-10 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Actualizando..." : "Restablecer Contraseña"}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
