import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Box,
  Layers,
  Palette,
  Save,
  RotateCcw,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

export const FurnitureBuilder = () => {
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [material, setMaterial] = useState(null);
  const [fabric, setFabric] = useState(null);
  const [size, setSize] = useState("medium");

  const [furnitureTypes, setFurnitureTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const modelRef = useRef(null);

  const applyColors = () => {
    const modelViewer = modelRef.current;
    if (!modelViewer || !modelViewer.model) return;

    const activeWood = materials.find(m => m.id === material);
    const activeFabric = fabrics.find(f => f.id === fabric);

    const hexToRgb = (hex) => {
      if (!hex) return null;
      const sh = hex.replace('#', '');
      if (sh.length !== 6) return null;
      const r = parseInt(sh.substring(0, 2), 16) / 255;
      const g = parseInt(sh.substring(2, 4), 16) / 255;
      const b = parseInt(sh.substring(4, 6), 16) / 255;
      return [r, g, b, 1.0];
    };

    const woodColor = hexToRgb(activeWood?.hex_code);
    const fabricColor = hexToRgb(activeFabric?.hex_code);

    const mats = modelViewer.model.materials;
    if (mats.length === 0) return;

    let matchedAny = false;
    mats.forEach(mat => {
      const name = mat.name.toLowerCase();
      const isWood = name.includes('wood') || name.includes('madera') || name.includes('leg') || name.includes('base') || name.includes('estructura') || name.includes('palo') || name.includes('soporte');
      const isFabric = name.includes('fabric') || name.includes('tela') || name.includes('cushion') || name.includes('cojin') || name.includes('seat') || name.includes('asiento') || name.includes('respaldo') || name.includes('cuero') || name.includes('leather');
      
      if (isWood && woodColor) {
        mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
        matchedAny = true;
      } else if (isFabric && fabricColor) {
        mat.pbrMetallicRoughness.setBaseColorFactor(fabricColor);
        matchedAny = true;
      }
    });

    if (!matchedAny) {
      if (mats.length === 1 && fabricColor) {
        mats[0].pbrMetallicRoughness.setBaseColorFactor(fabricColor);
      } else if (mats.length >= 2) {
        if (fabricColor) mats[0].pbrMetallicRoughness.setBaseColorFactor(fabricColor);
        if (woodColor) mats[1].pbrMetallicRoughness.setBaseColorFactor(woodColor);
      }
    }
  };

  useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      applyColors();
    };
    modelViewer.addEventListener('load', handleLoad);
    
    if (modelViewer.model) {
      applyColors();
    }

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
    };
  }, [material, fabric, selectedFurniture, materials, fabrics]);

  useEffect(() => {
    const load = async () => {
      try {
        const f = await api.customizations.getFurnitures();
        const colors = await api.customizations.getColors();
        setFurnitureTypes(f);
        
        const woods = colors.filter(c => c.type === 'paint');
        const fabs = colors.filter(c => c.type === 'fabric');
        
        setMaterials(woods);
        setFabrics(fabs);
        
        if (woods.length > 0) setMaterial(woods[0].id);
        if (fabs.length > 0) setFabric(fabs[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 mt-20">Cargando catálogo de personalización...</div>;
  }

  if (!selectedFurniture) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-serif font-bold">
            Crea tu <span className="italic text-brand-accent">Diseño</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Selecciona una pieza base y transfórmala en algo único con nuestro
            configurador artesanal.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {furnitureTypes.map((type) => (
            <motion.div
              key={type.id}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedFurniture(type)}
              className="group cursor-pointer bg-white border border-brand-accent/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={type.image_url || type.image}
                  alt={type.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                  <Sparkles size={14} className="text-brand-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                    Personalizable
                  </span>
                </div>
              </div>
              <div className="p-6 flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold">{type.name}</h3>
                <button className="p-3 bg-paper rounded-full group-hover:bg-brand-accent group-hover:text-white transition-all">
                  <Box size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <button
            onClick={() => setSelectedFurniture(null)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-accent mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Volver a Galería
          </button>
          <h1 className="text-4xl font-serif font-bold">
            Personalizando:{" "}
            <span className="italic text-brand-accent">
              {selectedFurniture.name}
            </span>
          </h1>
          <p className="text-gray-500 text-sm">
            Ajusta los materiales para que se adapten a tu espacio.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-2 border border-brand-accent/20 rounded-full text-sm font-bold hover:bg-paper transition-all">
            <RotateCcw size={16} /> Reiniciar
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-full text-sm font-bold hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/10">
            <Save size={16} /> Guardar Diseño
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Renderizado del Mueble (Simulado 3D) */}
        <div className="lg:col-span-2 aspect-video bg-paper rounded-3xl relative overflow-hidden flex items-center justify-center border border-brand-accent/10 shadow-inner">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, #c5a059 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>

          {selectedFurniture.image_url?.endsWith('.glb') ? (
            <model-viewer
              ref={modelRef}
              src={api.getImageUrl(selectedFurniture.image_url)}
              alt={selectedFurniture.name}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: "100%", height: "100%", outline: "none" }}
              className="w-full h-full"
            >
              <div slot="poster" className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm gap-3">
                <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Cargando Modelo 3D...</span>
              </div>
            </model-viewer>
          ) : (
            <motion.div
              key={`${material}-${fabric}`}
              initial={{ scale: 0.8, opacity: 0, rotateY: -20 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative z-10 w-64 h-64 flex flex-col items-center"
            >
              {/* Representación visual abstracta adaptada */}
              <div
                className="w-full h-32 rounded-t-3xl shadow-2xl relative transition-colors duration-500"
                style={{
                  backgroundColor: fabrics.find((f) => f.id === fabric)?.hex_code,
                }}
              >
                <div className="absolute -top-4 -right-4 bg-brand-accent/20 w-12 h-12 rounded-full blur-xl animate-pulse" />
              </div>
              <div
                className="w-[110%] h-12 -mt-2 rounded-xl shadow-lg transition-colors duration-500"
                style={{
                  backgroundColor: fabrics.find((f) => f.id === fabric)?.hex_code,
                }}
              ></div>
              <div className="flex gap-16 mt-0">
                <div
                  className="w-6 h-12 rounded-b-lg shadow-md transition-colors duration-500"
                  style={{
                    backgroundColor: materials.find((m) => m.id === material)
                      ?.hex_code,
                  }}
                ></div>
                <div
                  className="w-6 h-12 rounded-b-lg shadow-md transition-colors duration-500"
                  style={{
                    backgroundColor: materials.find((m) => m.id === material)
                      ?.hex_code,
                  }}
                ></div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-accent">
                  Vista Previa Configurador
                </p>
                <p className="text-sm text-gray-400">
                  Artesanía personalizada por Angela Mueblería
                </p>
              </div>
            </motion.div>
          )}

          <div className="absolute bottom-6 right-6 flex gap-2">
            <button className="p-3 bg-white shadow-xl rounded-full hover:bg-brand-accent hover:text-white transition-all">
              <Box size={20} />
            </button>
            <button className="p-3 bg-white shadow-xl rounded-full hover:bg-brand-accent hover:text-white transition-all">
              <Layers size={20} />
            </button>
          </div>
        </div>

        {/* Panel de Control */}
        <div className="space-y-8 bg-white border border-brand-accent/10 p-8 rounded-3xl shadow-xl shadow-brand-accent/5">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-accent">
              <Palette size={18} />
              <h3 className="font-bold text-sm uppercase tracking-widest">
                Acabado / Pintura
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterial(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${material === m.id ? "border-brand-accent bg-paper" : "border-paper hover:border-brand-accent/30"}`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: m.hex_code }}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.price_modifier > 0 && <p className="text-[10px] text-brand-accent font-bold">+C${m.price_modifier}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-brand-accent">
              <Layers size={18} />
              <h3 className="font-bold text-sm uppercase tracking-widest">
                Tapizado
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {fabrics.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFabric(f.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${fabric === f.id ? "border-brand-accent bg-paper" : "border-paper hover:border-brand-accent/30"}`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: f.hex_code }}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{f.name}</p>
                    {f.price_modifier > 0 && <p className="text-[10px] text-brand-accent font-bold">+C${f.price_modifier}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-brand-accent">
              Dimensiones
            </h3>
            <div className="flex gap-2">
              {["small", "medium", "large"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${size === s ? "bg-brand-primary text-white" : "bg-paper text-gray-400 hover:text-brand-primary"}`}
                >
                  {s === "small" ? "P" : s === "medium" ? "M" : "G"}
                </button>
              ))}
            </div>
          </section>

          <div className="pt-6 border-t border-dashed">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">Precio Estimado</p>
              <p className="text-lg font-serif font-bold">C${((selectedFurniture?.base_price || 0) + (materials.find(m => m.id === material)?.price_modifier || 0) + (fabrics.find(f => f.id === fabric)?.price_modifier || 0)).toLocaleString()}</p>
            </div>
            <button className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-accent transition-all">
              Cotizar Diseño
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
