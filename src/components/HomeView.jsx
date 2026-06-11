import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Heart,
  History,
  Target,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Users,
  Gift,
  Sparkles,
  ShoppingBag,
  MapPin,
  Mail,
  MessageCircle,
  Facebook
} from "lucide-react";
import { api } from "../services/api";

export const HomeView = ({ onStartShopping, onAddToCart }) => {
  const [email, setEmail] = useState("");
  const [newsStatus, setNewsStatus] = useState("idle");
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const trackContactClick = (type) => {
    if (window.gtag) {
      window.gtag("event", `clic_${type}`);
    }
  };

  useEffect(() => {
    const fetchActiveCombos = async () => {
      try {
        const data = await api.combos.getAll();
        setCombos(data.filter(c => c.activo && (c.productos_detalle?.length > 0 || c.producto_requerido)));
      } catch (e) {
        console.error("Error loading active combos in HomeView:", e);
      } finally {
        setLoadingCombos(false);
      }
    };
    fetchActiveCombos();
  }, []);

  const handlePrevCombo = () => {
    setCurrentIndex(prev => (prev === 0 ? combos.length - 1 : prev - 1));
  };

  const handleNextCombo = () => {
    setCurrentIndex(prev => (prev === combos.length - 1 ? 0 : prev + 1));
  };

  const handleAddComboToCart = (combo) => {
    if (!onAddToCart) return;
    const details = combo.productos_detalle || [];
    if (details.length > 0) {
      details.forEach(item => {
        const productToAdd = {
          id: item.id,
          name: item.nombre,
          price: item.precio_base,
          image_url: item.url_miniatura,
          stock: 99
        };
        for (let i = 0; i < item.cantidad; i++) {
          onAddToCart(productToAdd);
        }
      });
      alert(`¡Se han añadido los elementos del combo "${combo.nombre}" al carrito!`);
    } else if (combo.producto_requerido) {
      onAddToCart({
        id: combo.producto_requerido,
        name: combo.producto_requerido_nombre,
        price: combo.precio_combo || 0,
        image_url: null,
        stock: 99
      });
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setNewsStatus("loading");
    try {
      await api.marketing.subscribeNewsletter(email);
      setNewsStatus("success");
      setEmail("");
    } catch(err) {
      alert(err.message);
      setNewsStatus("idle");
    }
  };

  const stats = [
    { label: "Años de Tradición", value: "18+" },
    { label: "Diseños Únicos", value: "20+" },
    { label: "Familias Nicaragüenses", value: "10k+" },
    { label: "Departamentos", value: "15" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-[95vh] flex items-center justify-center overflow-x-hidden pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0">
          <img
            src="/imagenes/hero-banner.jpg"
            alt="Muebles de Mimbre Angela Mueblería"
            className="w-full h-full object-cover grayscale-[10%] brightness-[0.65]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brand-accent font-mono text-xs md:text-sm uppercase tracking-[0.3em] font-bold">
              Artesanía que Trasciende
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mt-4 leading-tight">
              Tradición y estilo en cada <span className="italic">Detalle</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mt-4 md:mt-6 font-light leading-relaxed">
              En Angela Mueblería, convertimos espacios ordinarios en santuarios
              de diseño y confort con piezas fabricadas a mano por maestros
              artesanos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 md:pt-6"
          >
            <button
              onClick={onStartShopping}
              className="bg-brand-accent text-brand-primary px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-white transition-all shadow-2xl flex items-center justify-center gap-2"
            >
              Explorar Catálogo <ChevronRight size={18} />
            </button>
            <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-white/20 transition-all">
              Nuestra Historia
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="-mt-12 md:-mt-16 relative z-20 max-w-7xl mx-auto w-full px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0 bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-brand-accent/10 divide-y sm:divide-y-0 md:divide-x divide-brand-accent/10">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="p-8 text-center"
            >
              <p className="text-4xl font-serif font-bold text-brand-primary">
                {stat.value}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-accent mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* History & Origin */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-paper border border-brand-accent/20 rounded-full text-brand-accent">
              <History size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Desde 2005
              </span>
            </div>
            <h2 className="text-5xl font-serif font-bold text-brand-primary leading-tight">
              Origen en el Corazón de{" "}
              <span className="italic text-brand-accent">Masatepe</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Angela Mueblería nació en un pequeño taller familiar en
                Masatepe, Masaya, con una meta clara: demostrar que el
                mobiliario nicaragüense de lujo puede competir con los
                estándares internacionales más exigentes.
              </p>
              <p>
                Lo que comenzó como un sueño local, hoy es un referente nacional
                en diseño de interiores, manteniendo siempre la esencia
                artesanal que nos vio nacer en las tierras blancas de Masatepe.
                Cada pieza cuenta una historia de dedicación y orgullo
                nicaragüense.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xl">
                  Calidad Certificada
                </h4>
                <p className="text-xs text-gray-500">
                  Maderas seleccionadas de bosques sustentables y textiles
                  premium.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xl">Artesanía Pura</h4>
                <p className="text-xs text-gray-500">
                  Procesos manuales que garantizan la durabilidad de por vida.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl animate-pulse" />
            <div className="relative grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=800"
                className="rounded-3xl shadow-xl translate-y-8"
                alt="Artesano trabajando"
                referrerPolicy="no-referrer"
              />

              <img
                src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=800"
                className="rounded-3xl shadow-xl"
                alt="Mueble finalizado"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Bento */}
      <section className="bg-paper py-24 px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-serif font-bold">Nuestra Identidad</h2>
            <p className="text-gray-500">
              Los pilares que sostienen cada decisión y creación en nuestra casa
              de diseño.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mision */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-12 rounded-[3rem] shadow-xl border border-brand-accent/5 flex flex-col items-center text-center space-y-6"
            >
              <div className="p-6 bg-brand-accent/10 text-brand-accent rounded-full">
                <Target size={42} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-serif font-bold">Nuestra Misión</h3>
              <p className="text-gray-600 leading-relaxed font-light">
                Somos una mueblería dedicada a la fabricación y venta de muebles de mimbre para hogares y negocios, ofreciendo productos personalizados, accesibles y de calidad artesanal, con un servicio confiable y orientado a la satisfacción del cliente.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#e6d8cc] p-12 rounded-[3rem] shadow-xl border border-[#d1bfb1] flex flex-col items-center text-center space-y-6"
            >
              <div className="p-6 bg-white/50 text-brand-primary rounded-full">
                <Eye size={42} strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-serif font-bold text-brand-primary">Nuestra Visión</h3>
              <p className="text-gray-800 leading-relaxed font-light">
                Ser una mueblería reconocida en los próximos años a nivel local y nacional por la calidad e innovación en muebles de mimbre, destacándose como una marca confiable y competitiva en el mercado.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4">
            Valores Innegociables
          </h2>
          <div className="w-24 h-1 bg-brand-accent mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[
            {
              title: "Calidad",
              desc: "Compromiso con productos bien elaborados y duraderos.",
              icon: Award,
            },
            {
              title: "Responsabilidad",
              desc: "Cumplimiento en tiempos de entrega y acuerdos con el cliente.",
              icon: Clock,
            },
            {
              title: "Compromiso",
              desc: "Dedicación en cada trabajo realizado.",
              icon: Heart,
            },
            {
              title: "Creatividad",
              desc: "Innovación en diseños y personalización de muebles.",
              icon: Lightbulb,
            },
            {
              title: "Atención al cliente",
              desc: "Trato amable y orientación según las necesidades del cliente.",
              icon: Users,
            },
          ].map((v) => (
            <div key={v.title} className="space-y-4 group">
              <div className="w-12 h-12 bg-paper rounded-2xl flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all duration-500">
                <v.icon size={24} />
              </div>
              <h4 className="text-2xl font-serif font-bold">{v.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Promo Combos Carousel */}
      {!loadingCombos && combos.length > 0 && (
        <section className="px-8 pb-16">
          <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2.5rem] bg-brand-primary p-8 md:p-14 shadow-2xl shadow-brand-primary/20">
            {/* Background layers */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#c5a05925_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#c5a05912_0%,_transparent_60%)]" />
            
            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div className="space-y-2">
                <span className="text-brand-accent font-mono text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="animate-pulse" /> Promociones Exclusivas
                </span>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                  Ahorra con nuestros <span className="italic text-brand-accent">Combos Especiales</span>
                </h3>
                <p className="text-white/60 font-light text-sm max-w-xl">
                  Lleva combinaciones diseñadas especialmente por nuestros decoradores con un precio exclusivo.
                </p>
              </div>
              
              {combos.length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCombo}
                    className="w-10 h-10 rounded-full border border-white/20 hover:border-brand-accent hover:text-brand-accent text-white flex items-center justify-center transition-all bg-white/5 backdrop-blur-sm cursor-pointer"
                    aria-label="Anterior combo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextCombo}
                    className="w-10 h-10 rounded-full border border-white/20 hover:border-brand-accent hover:text-brand-accent text-white flex items-center justify-center transition-all bg-white/5 backdrop-blur-sm cursor-pointer"
                    aria-label="Siguiente combo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Carousel Body */}
            <div className="relative z-10 min-h-[380px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  {/* Product grid / list or Custom combo image */}
                  <div className="lg:col-span-7">
                    {combos[currentIndex].imagen_url ? (
                      <div className="relative w-full h-[320px] sm:h-[400px] rounded-3xl overflow-hidden border border-white/10 group shadow-2xl bg-black/40">
                        <img
                          src={api.getImageUrl(combos[currentIndex].imagen_url)}
                          alt={combos[currentIndex].nombre}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Overlay with list of items */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 sm:p-6 flex flex-col justify-end">
                          <p className="text-[10px] font-bold text-brand-accent uppercase tracking-wider mb-2">Elementos Incluidos:</p>
                          <div className="flex flex-wrap gap-2">
                            {combos[currentIndex].productos_detalle?.map((prod, pIdx) => (
                              <span
                                key={pIdx}
                                className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-full text-xs font-medium"
                              >
                                {prod.cantidad}x {prod.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {combos[currentIndex].productos_detalle?.map((prod, pIdx) => (
                          <motion.div
                            key={pIdx}
                            whileHover={{ y: -5 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center space-y-2 relative"
                          >
                            <span className="absolute top-2 right-2 bg-brand-accent text-brand-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                              {prod.cantidad}x
                            </span>
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                              {prod.url_miniatura ? (
                                <img
                                  src={api.getImageUrl(prod.url_miniatura)}
                                  alt={prod.nombre}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-white/40 text-xs">Sin foto</span>
                              )}
                            </div>
                            <p className="text-white text-xs font-medium line-clamp-2 w-full pt-1">
                              {prod.nombre}
                            </p>
                            <p className="text-brand-accent/80 font-mono text-[10px]">
                              C$ {prod.precio_base.toLocaleString()} c/u
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Offer details & action */}
                  <div className="lg:col-span-5 bg-white/5 backdrop-blur-lg border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="inline-block bg-brand-accent/20 border border-brand-accent/30 text-brand-accent px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                        ¡Oferta de Temporada!
                      </div>
                      <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                        {combos[currentIndex].nombre}
                      </h4>
                      
                      {/* Price display */}
                      <div className="space-y-1">
                        {(() => {
                          const costoNormal = combos[currentIndex].productos_detalle?.reduce((acc, curr) => acc + curr.precio_base * curr.cantidad, 0) || 0;
                          const costoCombo = Number(combos[currentIndex].precio_combo) || 0;
                          const descuento = costoNormal - costoCombo;
                          const pct = costoNormal > 0 ? Math.round((descuento / costoNormal) * 100) : 0;
                          
                          return (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-brand-accent font-serif text-3xl sm:text-4xl font-bold">
                                  C$ {costoCombo.toLocaleString()}
                                </span>
                                {costoNormal > costoCombo && (
                                  <span className="text-white/40 line-through text-sm sm:text-base font-light">
                                    C$ {costoNormal.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {descuento > 0 && (
                                <div className="text-green-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                                  <span>¡Ahorras C$ {descuento.toLocaleString()} ({pct}% OFF)!</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddComboToCart(combos[currentIndex])}
                      className="w-full bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold py-4 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 cursor-pointer group active:scale-95"
                    >
                      <ShoppingBag size={18} className="transition-transform group-hover:scale-110" />
                      Llevar Combo Completo
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel indicators */}
            {combos.length > 1 && (
              <div className="flex justify-center gap-2 mt-8 z-10 relative">
                {combos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx ? "w-8 bg-brand-accent" : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Ir al combo ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sección de Contacto y Ubicación */}
      <section className="py-12 px-8 bg-paper">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-brand-accent font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
              Contacto y Ubicación
            </span>
            <h2 className="text-3xl font-serif font-bold text-brand-primary">
              Visítanos o ponte en contacto
            </h2>
            <p className="text-gray-500 text-xs">
              Estamos ubicados en Masatepe, Masaya. Con gusto atenderemos todas tus consultas y cotizaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dirección */}
            <motion.div
              whileHover={{ y: -3 }}
              onClick={() => {
                trackContactClick("direccion");
                window.open("https://www.google.com/maps/search/?api=1&query=Del+centro+de+Salud+2c+al+norte,+Masatepe,+Nicaragua", "_blank");
              }}
              className="bg-white p-5 rounded-2xl border border-brand-accent/5 shadow-sm flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-full">
                <MapPin size={22} />
              </div>
              <h4 className="text-sm font-bold text-brand-primary">Nuestra Dirección</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Del centro de Salud 2c al norte,<br />Masatepe, Nicaragua
              </p>
            </motion.div>

            {/* WhatsApp */}
            <motion.div
              whileHover={{ y: -3 }}
              onClick={() => {
                trackContactClick("whatsapp");
                window.open("https://wa.me/50587489573", "_blank");
              }}
              className="bg-white p-5 rounded-2xl border border-brand-accent/5 shadow-sm flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-green-50 text-green-600 rounded-full">
                <MessageCircle size={22} />
              </div>
              <h4 className="text-sm font-bold text-brand-primary">WhatsApp</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Escríbenos directamente para cotizar:<br /><strong>+505 8748 9573</strong>
              </p>
            </motion.div>

            {/* Facebook */}
            <motion.div
              whileHover={{ y: -3 }}
              onClick={() => {
                trackContactClick("facebook");
                window.open("https://www.facebook.com/share/1Db8EC4GYX/", "_blank");
              }}
              className="bg-white p-5 rounded-2xl border border-brand-accent/5 shadow-sm flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <Facebook size={22} />
              </div>
              <h4 className="text-sm font-bold text-brand-primary">Facebook</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Síguenos en nuestra página oficial:<br /><strong>Angela Mueblería</strong>
              </p>
            </motion.div>

            {/* Correo */}
            <motion.div
              whileHover={{ y: -3 }}
              onClick={() => {
                trackContactClick("correo");
                window.open("mailto:angelamuebleria29@gmail.com", "_blank");
              }}
              className="bg-white p-5 rounded-2xl border border-brand-accent/5 shadow-sm flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-amber-50 text-brand-accent rounded-full">
                <Mail size={22} />
              </div>
              <h4 className="text-sm font-bold text-brand-primary">Correo Electrónico</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Envíanos tus propuestas o sugerencias:<br /><strong>angelamuebleria29@gmail.com</strong>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 md:px-8 pb-24">
        <div className="max-w-7xl mx-auto bg-brand-accent/10 rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 text-center space-y-6 md:space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-primary leading-tight">
            ¿Listo para transformar <span className="italic">tu espacio?</span>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Únete a las miles de familias que ya disfrutan de la experiencia de
            vivir en un hogar diseñado por Angela Mueblería.
          </p>
          <button
            onClick={onStartShopping}
            className="relative z-10 inline-block bg-brand-primary text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-brand-accent transition-all shadow-xl shadow-brand-primary/20 cursor-pointer"
          >
            Comenzar Experiencia
          </button>
        </div>
      </section>
    </div>
  );
};
