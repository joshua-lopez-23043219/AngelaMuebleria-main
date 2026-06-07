import React, { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Eye, EyeOff, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { api } from "../services/api";

export const LoginPage = ({ onAuth }) => {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    municipalityId: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [dbDepartments, setDbDepartments] = useState([]);
  const [dbMunicipalities, setDbMunicipalities] = useState([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState([]);

  React.useEffect(() => {
    if (mode === "register") {
      const loadLocations = async () => {
        try {
          const depts = await api.locations.getDepartments();
          const munis = await api.locations.getMunicipalities();
          setDbDepartments(depts);
          setDbMunicipalities(munis);
          
          if (depts.length > 0) {
            updateSelection(depts[0].id, munis);
          }
        } catch (e) {
          console.error("Error loading locations", e);
        }
      };
      loadLocations();
    }
  }, [mode]);

  const updateSelection = (deptId, allMunis) => {
    const filtered = allMunis.filter(m => m.departamento === parseInt(deptId));
    setFilteredMunicipalities(filtered);
    setFormData(prev => ({
      ...prev,
      department: deptId,
      municipalityId: filtered.length > 0 ? filtered[0].id : ""
    }));
  };

  const handleDepartmentChange = (deptId) => {
    updateSelection(deptId, dbMunicipalities);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    
    try {
      if (mode === "forgot") {
        const res = await api.auth.recoverPassword(formData.email);
        setSuccessMessage(res.detail || "Se ha enviado un enlace para restablecer la contraseña a su correo.");
        setFormData(prev => ({ ...prev, email: "" }));
      } else {
        const data = mode === "register"
          ? await api.auth.register(formData)
          : await api.auth.login({
              email: formData.email,
              password: formData.password,
            });
        
        // Google Analytics event tracking
        if (window.gtag) {
          if (mode === "register") {
            window.gtag("event", "sign_up", {
              method: "email"
            });
          } else {
            window.gtag("event", "login", {
              method: "email"
            });
          }
        }
        
        onAuth(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccessMessage("");
    setShowPassword(false);
    setFormData(prev => ({ ...prev, password: "" }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white border border-brand-accent/20 rounded-2xl p-8 shadow-xl shadow-brand-accent/5"
      >
        {/* Title */}
        <h2 className="text-3xl font-serif font-bold mb-6 text-center">
          {mode === "login" && "Bienvenido de Nuevo"}
          {mode === "register" && "Crear Cuenta"}
          {mode === "forgot" && "Recuperar Contraseña"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle size={16} className="shrink-0" /> {successMessage}
          </div>
        )}

        {mode === "forgot" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </button>
            </form>

            <button
              onClick={() => changeMode("login")}
              className="mt-4 flex items-center justify-center gap-2 w-full text-sm font-bold text-gray-500 hover:text-brand-accent transition-colors"
            >
              <ArrowLeft size={16} /> Volver al Inicio de Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                    Nombre Completo
                  </label>
                  <input
                    required
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2 text-center text-[10px] text-brand-accent font-bold uppercase tracking-widest mb-2 border-b pb-1">
                  Información de Contacto (Nicaragua)
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                    Teléfono
                  </label>
                  <input
                    required
                    placeholder="Ej: 8888 8888"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                    Departamento
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm appearance-none"
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                  >
                    {dbDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                    Municipio
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm appearance-none"
                    value={formData.municipalityId}
                    onChange={(e) =>
                      setFormData({ ...formData, municipalityId: e.target.value })
                    }
                  >
                    {filteredMunicipalities.map((muni) => (
                      <option key={muni.id} value={muni.id}>
                        {muni.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className={`${mode === "register" ? "pt-4 border-t border-dashed" : ""}`}>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                Correo Electrónico
              </label>
              <input
                required
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="off"
                className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Contraseña
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => changeMode("forgot")}
                    className="text-xs font-bold text-brand-accent hover:underline focus:outline-none cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  className="w-full pl-4 pr-10 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-sm"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/10 disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? "Procesando..." : mode === "register" ? "Registrarse" : "Iniciar Sesión"}
            </button>
          </form>
        )}

        {mode !== "forgot" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === "register" ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}
            <button
              onClick={() => changeMode(mode === "register" ? "login" : "register")}
              className="ml-2 font-bold text-brand-accent hover:underline focus:outline-none cursor-pointer"
            >
              {mode === "register" ? "Inicia Sesión" : "Regístrate aquí"}
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};
