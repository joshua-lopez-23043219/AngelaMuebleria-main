import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Award,
  Heart,
  History,
  Target,
  Eye,
  ChevronRight,
  Clock,
  Lightbulb,
  Users,
  Gift
} from "lucide-react";
import { api } from "../services/api";

export const HomeView = ({ onStartShopping }) => {
  const [email, setEmail] = useState("");
  const [newsStatus, setNewsStatus] = useState("idle");

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
      <section className="relative min-h-[90vh] md:h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-28 md:pt-0 md:pb-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000"
            alt="Interior Lujoso"
            className="w-full h-full object-cover grayscale-[20%] brightness-[0.7]"
            referrerPolicy="no-referrer"
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
      <section className="-mt-16 relative z-20 max-w-7xl mx-auto w-full px-8">
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

      {/* Newsletter Banner */}
      <section className="px-8 pb-12">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-brand-primary/20">
          {/* Background layers */}
          <div className="absolute inset-0 bg-brand-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#c5a05930_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#c5a05918_0%,_transparent_60%)]" />
          {/* Decorative ring */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full border border-brand-accent/10" />
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-brand-accent/20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 p-10 md:p-14">
            {/* Icon */}
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
              <Gift size={40} strokeWidth={1.5} className="text-brand-accent" />
            </div>

            {/* Copy */}
            <div className="flex-1 space-y-2 text-center lg:text-left">
              <span className="text-brand-accent font-mono text-xs uppercase tracking-[0.3em] font-bold">
                Promociones Exclusivas
              </span>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                ¡Recibe descuentos antes <span className="italic text-brand-accent">que nadie!</span>
              </h3>
              <p className="text-white/50 font-light text-sm max-w-md">
                Suscríbete y obtén al instante tu cupón de bienvenida para estrenar en tu próxima compra.
              </p>
            </div>

            {/* Form / Success */}
            <div className="w-full lg:w-auto shrink-0">
              {newsStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-accent/10 border border-brand-accent/40 px-8 py-6 rounded-2xl text-center space-y-2"
                >
                  <p className="text-brand-accent font-bold text-lg">¡Suscripción exitosa! 🎉</p>
                  <p className="text-white/70 text-sm">Tu código de descuento:</p>
                  <div className="bg-brand-accent text-brand-primary px-6 py-2 rounded-xl font-mono font-bold tracking-[0.3em] text-xl shadow-lg">
                    BIENVENIDO10
                  </div>
                  <p className="text-white/50 text-xs">10% de descuento en tu primer pedido</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent/60 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="pl-11 pr-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 w-full sm:w-72 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30 transition-all"
                      disabled={newsStatus === "loading"}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={newsStatus === "loading"}
                    className="bg-brand-accent text-brand-primary px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-brand-accent/20 whitespace-nowrap disabled:opacity-60"
                  >
                    {newsStatus === "loading" ? "Enviando..." : "Suscribirme"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-8 pb-24">
        <div className="max-w-7xl mx-auto bg-brand-accent/10 rounded-[4rem] p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 blur-[120px] rounded-full" />
          <h2 className="text-5xl font-serif font-bold text-brand-primary">
            ¿Listo para transformar <span className="italic">tu espacio?</span>
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Únete a las miles de familias que ya disfrutan de la experiencia de
            vivir en un hogar diseñado por Angela Mueblería.
          </p>
          <button
            onClick={onStartShopping}
            className="inline-block bg-brand-primary text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-brand-accent transition-all shadow-xl shadow-brand-primary/20"
          >
            Comenzar Experiencia
          </button>
        </div>
      </section>
    </div>
  );
};
