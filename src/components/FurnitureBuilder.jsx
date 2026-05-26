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
  Trash2,
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
  const [savedDesigns, setSavedDesigns] = useState([]);

  const modelRef = useRef(null);

  const loadSavedDesigns = () => {
    const list = JSON.parse(localStorage.getItem('saved_designs') || '[]');
    setSavedDesigns(list);
  };

  useEffect(() => {
    loadSavedDesigns();
  }, []);

  const handleReset = () => {
    setMaterial(null);
    setFabric(null);
    setSize("medium");
  };

  const handleSaveDesign = () => {
    const activeWood = materials.find(m => m.id === material);
    const activeFabric = fabrics.find(f => f.id === fabric);
    const is3d = selectedFurniture?.image_url?.endsWith('.glb');
    
    const saved = {
      id: Date.now().toString(),
      furniture: selectedFurniture,
      wood: activeWood,
      fabric: is3d ? null : activeFabric,
      size: size,
      totalPrice: Number(selectedFurniture?.base_price || 0) + Number(activeWood?.price_modifier || 0) + (is3d ? 0 : Number(activeFabric?.price_modifier || 0)),
      date: new Date().toLocaleDateString()
    };

    const existing = JSON.parse(localStorage.getItem('saved_designs') || '[]');
    localStorage.setItem('saved_designs', JSON.stringify([saved, ...existing]));
    alert("¡Diseño guardado con éxito! Puedes revisarlo en la galería de inicio.");
    loadSavedDesigns();
  };

  const handleQuote = () => {
    const activeWood = materials.find(m => m.id === material);
    const is3d = selectedFurniture?.image_url?.endsWith('.glb');
    const activeFabric = is3d ? null : fabrics.find(f => f.id === fabric);
    
    const price = Number(selectedFurniture?.base_price || 0) + Number(activeWood?.price_modifier || 0) + (is3d ? 0 : Number(activeFabric?.price_modifier || 0));

    let text = `Hola, me gustaría cotizar el siguiente diseño personalizado:\n\n`;
    text += `*Mueble:* ${selectedFurniture.name}\n`;
    text += `*Acabado/Pintura:* ${activeWood ? activeWood.name : 'Color original'}\n`;
    if (!is3d) {
      text += `*Tapizado:* ${activeFabric ? activeFabric.name : 'Material original'}\n`;
    }
    text += `*Dimensiones:* ${selectedFurniture.dimensions || 'Medidas estándar'}\n`;
    text += `*Precio Estimado:* C$${price.toLocaleString()}\n\n`;
    text += `¿Me podrían dar más detalles para realizar el pedido?`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/50588888888?text=${encodedText}`, '_blank');
  };

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

    const is3d = selectedFurniture?.image_url?.endsWith('.glb');
    let matchedAny = false;

    mats.forEach(mat => {
      const name = mat.name.toLowerCase();
      const isFabricMat = name.includes('fabric') || name.includes('tela') || name.includes('cushion') || name.includes('cojin') || name.includes('seat') || name.includes('asiento') || name.includes('respaldo') || name.includes('cuero') || name.includes('leather');
      const isContrastMat = name.includes('news') || name.includes('paper') || name.includes('print') || name.includes('centro') || name.includes('backrest') || name.includes('decor') || name.includes('pattern') || name.includes('decal') || name.includes('picture') || name.includes('image') || name.includes('text') || name.includes('texture') || name.includes('contraste') || name.includes('interior') || name.includes('medallion') || name.includes('central');

      if (is3d) {
        // En modelos 3D, si no es explícitamente un cojín/tela ni parte del diseño de contraste central (newspaper), le aplicamos woodColor
        if (!isFabricMat && !isContrastMat && woodColor) {
          mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
          matchedAny = true;
        }
      } else {
        const isWoodMat = name.includes('wood') || name.includes('madera') || name.includes('leg') || name.includes('base') || name.includes('estructura') || name.includes('palo') || name.includes('soporte');
        if (isWoodMat && woodColor) {
          mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
          matchedAny = true;
        } else if (isFabricMat && fabricColor) {
          mat.pbrMetallicRoughness.setBaseColorFactor(fabricColor);
          matchedAny = true;
        }
      }
    });

    if (!matchedAny && woodColor) {
      if (is3d) {
        // Fallback para modelos 3D: aplicamos el color de pintura a todos los materiales no-telas y no-contrastes
        mats.forEach(mat => {
          const name = mat.name.toLowerCase();
          const isFabricMat = name.includes('fabric') || name.includes('tela') || name.includes('cushion') || name.includes('cojin') || name.includes('seat') || name.includes('asiento') || name.includes('respaldo') || name.includes('cuero') || name.includes('leather');
          const isContrastMat = name.includes('news') || name.includes('paper') || name.includes('print') || name.includes('centro') || name.includes('backrest') || name.includes('decor') || name.includes('pattern') || name.includes('decal') || name.includes('picture') || name.includes('image') || name.includes('text') || name.includes('texture') || name.includes('contraste') || name.includes('interior') || name.includes('medallion') || name.includes('central');
          if (!isFabricMat && !isContrastMat) {
            mat.pbrMetallicRoughness.setBaseColorFactor(woodColor);
          }
        });
      } else {
        if (mats.length === 1) {
          mats[0].pbrMetallicRoughness.setBaseColorFactor(woodColor);
        } else if (mats.length >= 2) {
          mats[0].pbrMetallicRoughness.setBaseColorFactor(woodColor);
          if (fabricColor) mats[1].pbrMetallicRoughness.setBaseColorFactor(fabricColor);
        }
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
        
        // No seleccionar colores por defecto automáticamente
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
                {type.image_url?.endsWith('.glb') ? (
                  <div className="w-full h-full pointer-events-none">
                    <model-viewer
                      src={api.getImageUrl(type.image_url)}
                      alt={type.name}
                      auto-rotate
                      camera-orbit="45deg 75deg 105%"
                      field-of-view="auto"
                      shadow-intensity="1"
                      style={{ width: "100%", height: "100%", pointerEvents: "none", outline: "none" }}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <img
                    src={type.image_url ? api.getImageUrl(type.image_url) : type.image}
                    alt={type.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                )}

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

        {savedDesigns.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-brand-accent/10">
            <h2 className="text-3xl font-serif font-bold text-center">
              Mis Diseños <span className="italic text-brand-accent">Guardados</span>
            </h2>
            <p className="text-gray-500 text-center max-w-2xl mx-auto -mt-4">
              Tus configuraciones personalizadas guardadas localmente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
              {savedDesigns.map((sd) => (
                <div key={sd.id} className="bg-white border border-brand-accent/15 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
                  <div className="flex gap-4">
                    {sd.furniture.image_url?.endsWith('.glb') ? (
                      <div className="w-20 h-20 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                        <Box size={32} />
                      </div>
                    ) : (
                      <img src={api.getImageUrl(sd.furniture.image_url) || sd.furniture.image} className="w-20 h-20 object-cover rounded-2xl border" />
                    )}
                    <div className="space-y-1 flex-1">
                      <h4 className="font-serif font-bold text-lg">{sd.furniture.name}</h4>
                      <p className="text-xs text-gray-500">Madera: {sd.wood?.name || 'N/A'}</p>
                      {!sd.furniture.image_url?.endsWith('.glb') && (
                        <p className="text-xs text-gray-500">Tapizado: {sd.fabric?.name || 'N/A'}</p>
                      )}
                      {sd.furniture.dimensions && (
                        <p className="text-xs text-gray-400">Medidas: {sd.furniture.dimensions}</p>
                      )}
                      <p className="text-base font-bold text-brand-accent mt-1">C${sd.totalPrice?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t border-dashed">
                    <button
                      onClick={() => {
                        setSelectedFurniture(sd.furniture);
                        setMaterial(sd.wood?.id || null);
                        if (sd.fabric) setFabric(sd.fabric.id);
                        setSize(sd.size || "medium");
                      }}
                      className="flex-1 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-accent transition-all text-center"
                    >
                      Cargar en Diseñador
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este diseño guardado?")) {
                          const updated = savedDesigns.filter(item => item.id !== sd.id);
                          localStorage.setItem('saved_designs', JSON.stringify(updated));
                          loadSavedDesigns();
                        }
                      }}
                      className="px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-brand-accent/5 pb-6">
        <div className="space-y-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedFurniture(null)}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-accent transition-colors"
          >
            <ChevronLeft size={14} /> Volver a Galería
          </button>
          <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight">
            Personalizando:{" "}
            <span className="italic text-brand-accent block md:inline-block">
              {selectedFurniture.name}
            </span>
          </h1>
          <p className="text-xs text-gray-400">
            Ajusta los materiales para que se adapten a tu espacio.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 border border-brand-accent/20 rounded-full text-xs font-bold hover:bg-paper transition-all"
          >
            <RotateCcw size={14} /> Reiniciar
          </button>
          <button
            onClick={handleSaveDesign}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-full text-xs font-bold hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/10"
          >
            <Save size={14} /> Guardar Diseño
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Renderizado del Mueble (Simulado 3D) */}
        <div className="lg:col-span-2 aspect-square md:aspect-video bg-paper rounded-3xl relative overflow-hidden flex items-center justify-center border border-brand-accent/10 shadow-inner">
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
              key={selectedFurniture.id + "_" + (material ? "custom" : "original")}
              ref={modelRef}
              src={api.getImageUrl(selectedFurniture.image_url)}
              alt={selectedFurniture.name}
              camera-controls
              auto-rotate
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-placement="floor"
              ar-scale="fixed"
              touch-action="pan-y"
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
                    {Number(m.price_modifier) > 0 && <p className="text-[10px] text-brand-accent font-bold">+C${Number(m.price_modifier).toLocaleString()}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Ocultamos tapizado para modelos 3D */}
          {!selectedFurniture.image_url?.endsWith('.glb') && (
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
                      {Number(f.price_modifier) > 0 && <p className="text-[10px] text-brand-accent font-bold">+C${Number(f.price_modifier).toLocaleString()}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-brand-accent">
              Dimensiones
            </h3>
            <p className="text-sm font-medium text-gray-700 bg-paper p-3 rounded-xl border border-brand-accent/5">
              {selectedFurniture?.dimensions || "Medida estándar (N/A)"}
            </p>
          </section>

          <div className="pt-6 border-t border-dashed">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">Precio Estimado</p>
              <p className="text-lg font-serif font-bold">
                C${(
                  Number(selectedFurniture?.base_price || 0) +
                  Number(materials.find(m => m.id === material)?.price_modifier || 0) +
                  (selectedFurniture.image_url?.endsWith('.glb') ? 0 : Number(fabrics.find(f => f.id === fabric)?.price_modifier || 0))
                ).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={handleQuote}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-accent transition-all"
            >
              Cotizar Diseño
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
