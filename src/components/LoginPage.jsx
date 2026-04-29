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
    municipality: "Masatepe",
  });
  const [error, setError] = useState("");

  const nicaraguaData = {
    Boaco: [
      "Boaco",
      "Camoapa",
      "San José de los Remates",
      "San Lorenzo",
      "Santa Lucía",
      "Teustepe",
    ],
    Carazo: [
      "Jinotepe",
      "Diriamba",
      "San Marcos",
      "Dolores",
      "El Rosario",
      "La Paz de Carazo",
      "Santa Teresa",
      "La Conquista",
    ],
    Chinandega: [
      "Chinandega",
      "El Viejo",
      "Corinto",
      "Chichigalpa",
      "Posoltega",
      "Somotillo",
      "Villa Nueva",
    ],
    Chontales: [
      "Juigalpa",
      "Acoyapa",
      "Santo Tomás",
      "La Libertad",
      "San Pedro de Lóvago",
    ],
    Estelí: [
      "Estelí",
      "Condega",
      "Pueblo Nuevo",
      "La Trinidad",
      "San Juan de Limay",
    ],
    Granada: ["Granada", "Nandaime", "Diriomo", "Diriá"],
    Jinotega: [
      "Jinotega",
      "San Rafael del Norte",
      "San Sebastián de Yalí",
      "Wiwilí",
      "El Cuá",
    ],
    León: [
      "León",
      "La Paz Centro",
      "Nagarote",
      "Telica",
      "El Sauce",
      "Larreynaga",
    ],
    Madriz: [
      "Somoto",
      "Totogalpa",
      "Telpaneca",
      "Palacagüina",
      "Yalagüina",
      "San Juan del Río Coco",
    ],
    Managua: [
      "Managua",
      "Ciudad Sandino",
      "Tipitapa",
      "Ticuantepe",
      "San Rafael del Sur",
      "Mateare",
    ],
    Masaya: [
      "Masaya",
      "Masatepe",
      "Nindirí",
      "La Concepción",
      "Catarina",
      "Niquinohomo",
      "Nandasmo",
      "Tisma",
      "San Juan de Oriente",
    ],
    Matagalpa: [
      "Matagalpa",
      "Sébaco",
      "Ciudad Darío",
      "San Ramón",
      "Matiguás",
      "Muy Muy",
    ],
    "Nueva Segovia": ["Ocotal", "Jalapa", "Quilalí", "El Jícaro", "Dipilto"],
    "Río San Juan": [
      "San Carlos",
      "San Miguelito",
      "El Castillo",
      "El Almendro",
    ],
    Rivas: [
      "Rivas",
      "San Juan del Sur",
      "Tola",
      "San Jorge",
      "Moyogalpa",
      "Altagracia",
    ],
    RACCN: ["Bilwi", "Waspam", "Siuna", "Rosita", "Bonanza"],
    RACCS: [
      "Bluefields",
      "Nueva Guinea",
      "El Rama",
      "Muelle de los Bueyes",
      "Corn Island",
    ],
  };

  const departments = Object.keys(nicaraguaData);

  const handleDepartmentChange = (dept) => {
    const municipalities = nicaraguaData[dept] || [];
    setFormData({
      ...formData,
      department: dept,
      municipality: municipalities[0] || "",
    });
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
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
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
                  value={formData.municipality}
                  onChange={(e) =>
                    setFormData({ ...formData, municipality: e.target.value })
                  }
                >
                  {(nicaraguaData[formData.department] || []).map((muni) => (
                    <option key={muni} value={muni}>
                      {muni}
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
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 font-bold text-brand-accent hover:underline"
          >
            {isRegister ? "Inicia Sesión" : "Regístrate aquí"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
