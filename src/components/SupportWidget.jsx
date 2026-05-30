import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Facebook, Send, HelpCircle, PhoneCall } from "lucide-react";

export const SupportWidget = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-brand-accent/10 overflow-hidden mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-serif text-lg font-bold">
                    AM
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-brand-primary rounded-full animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-bold text-sm">Angela Mueblería</h4>
                  <p className="text-[10px] text-white/70">Asesor de ventas en línea • Activo</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages / Info */}
            <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto bg-gray-50/50">
              {/* Bot Message */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-primary flex items-center justify-center font-serif text-xs font-bold shrink-0">
                  AM
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-brand-accent/5 max-w-[80%] text-left">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    ¡Hola! Bienvenido a <strong>Angela Mueblería</strong>. ¿En qué te podemos ayudar hoy? Puedes explorar nuestro catálogo o escribirnos directamente:
                  </p>
                </div>
              </div>

              {/* Bot Message 2 - Quick Links */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-primary flex items-center justify-center font-serif text-xs font-bold shrink-0">
                  AM
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-brand-accent/5 w-full space-y-2 text-left">
                  <p className="text-xs font-bold text-gray-800">Opciones rápidas de atención:</p>
                  
                  {/* WhatsApp Button */}
                  <a
                    href="https://wa.me/+50558637953?text=Hola%20,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20muebles."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-green-50 hover:bg-green-100/80 border border-green-200/50 rounded-xl text-green-700 font-bold text-xs transition-all w-full cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Send size={14} className="rotate-45" /> Chatear por WhatsApp
                    </span>
                    <span className="text-[9px] bg-green-200/60 px-2 py-0.5 rounded-full uppercase">Chatbot</span>
                  </a>

                  {/* Facebook Button */}
                  <a
                    href="https://www.facebook.com/share/14TiVmFanLB/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 rounded-xl text-blue-700 font-bold text-xs transition-all w-full cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Facebook size={14} /> Visitar Facebook
                    </span>
                    <span className="text-[9px] bg-blue-200/60 px-2 py-0.5 rounded-full uppercase">Página</span>
                  </a>

                  {/* FAQ Page Button */}
                  <button
                    onClick={() => {
                      onNavigate("faq");
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/50 rounded-xl text-purple-700 font-bold text-xs transition-all w-full text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={14} /> Preguntas Frecuentes (FAQ)
                    </span>
                    <span className="text-[9px] bg-purple-200/60 px-2 py-0.5 rounded-full uppercase">Autoayuda</span>
                  </button>

                  {/* Tel Button */}
                  <a
                    href="tel:+50558637953"
                    className="flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/50 rounded-xl text-amber-700 font-bold text-xs transition-all w-full cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <PhoneCall size={14} /> Llamar Directamente
                    </span>
                    <span className="text-[9px] bg-amber-200/60 px-2 py-0.5 rounded-full uppercase">+505</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Footer / Input placeholder */}
            <div className="p-3 border-t bg-white flex items-center justify-between gap-2">
              <input 
                type="text" 
                placeholder="Preguntar en WhatsApp..." 
                className="flex-1 text-xs border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-brand-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    const txt = encodeURIComponent(e.target.value);
                    window.open(`https://wa.me/+50558637953?text=${txt}`, "_blank");
                    e.target.value = "";
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const inputEl = e.currentTarget.previousSibling;
                  const val = inputEl ? inputEl.value.trim() : "";
                  const txt = val ? encodeURIComponent(val) : "Hola%20,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20muebles.";
                  window.open(`https://wa.me/+50558637953?text=${txt}`, "_blank");
                  if (inputEl) inputEl.value = "";
                }}
                className="p-2 bg-brand-primary hover:bg-brand-accent text-white rounded-xl transition-all cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-accent hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer border-2 border-white/20 relative"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
};
