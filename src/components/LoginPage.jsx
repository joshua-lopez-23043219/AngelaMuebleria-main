import React, { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { api } from "../services/api";

export const LoginPage = ({ onAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "Masaya",
    municipalityId: "",
  });
  const [error, setError] = useState("");

  const [dbDepartments, setDbDepartments] = useState([]);
  const [dbMunicipalities, setDbMunicipalities] = useState([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState([]);

  React.useEffect(() => {
    if (isRegister) {
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
  }, [isRegister]);

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
    try {
      const data = isRegister
        ? await api.auth.register(formData)
        : await api.auth.login({
            email: formData.email,
            password: formData.password,
          });
      onAuth(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white border border-brand-accent/20 rounded-2xl p-8 shadow-xl shadow-brand-accent/5"
      >
        <h2 className="text-3xl font-serif font-bold mb-6 text-center">
          {isRegister ? "Crear Cuenta" : "Bienvenido de Nuevo"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                  Nombre Completo
                </label>
                <input
                  required
                  className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2 text-center text-[10px] text-brand-accent font-bold uppercase tracking-widest mb-2">
                Información de Contacto (Nicaragua)
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
                  Teléfono
                </label>
                <input
                  required
                  placeholder="Ej: 8888 8888"
                  className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
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
                  className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all appearance-none"
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
                  className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all appearance-none"
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
          <div className={`${isRegister ? "pt-4 border-t border-dashed" : ""}`}>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
              Correo Electrónico
            </label>
            <input
              required
              type="email"
              className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
              Contraseña
            </label>
            <input
              required
              type="password"
              className="w-full px-4 py-3 bg-paper rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <button className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/10">
            {isRegister ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(""); // Limpiamos el error al cambiar de modo
              setFormData((prev) => ({ ...prev, password: "" })); // Limpiamos la contraseña
            }}
            className="ml-2 font-bold text-brand-accent hover:underline"
          >
            {isRegister ? "Inicia Sesión" : "Regístrate aquí"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
