import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown, Search, HelpCircle as HelpIcon, ArrowRight } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Configurador 3D y Personalización",
    questions: [
      {
        q: "¿Cómo puedo personalizar un mueble a mi gusto?",
        a: "Es muy sencillo. Dirígete a la sección 'Crea tu diseño' del menú. Elige el mueble base que prefieras (silla, sofá, mesa, etc.) y podrás cambiar interactivamente los acabados de madera, tipos de pintura y materiales de tapizado. Verás los cambios reflejados de inmediato en nuestro visualizador 3D interactivo."
      },
      {
        q: "¿Puedo ver el diseño personalizado en mi propia casa?",
        a: "¡Sí! Si entras a nuestra web desde tu teléfono celular, el visualizador 3D habilitará la función de cámara de Realidad Aumentada (AR). Presiona el botón de visualización con cámara, apunta al suelo de tu habitación y el mueble aparecerá a tamaño real (escala 1:1) anclado firmemente al piso para que veas cómo luce antes de comprar."
      },
      {
        q: "¿Cómo solicito una cotización de mi diseño personalizado?",
        a: "Una vez que termines de configurar tu mueble en el modelador 3D, haz clic en el botón 'Cotizar Diseño'. El sistema compilará automáticamente las dimensiones, tipo de pintura, tapizado y precio aproximado, abriendo un chat directo de WhatsApp con nuestro equipo comercial para concretar tu pedido."
      }
    ]
  },
  {
    category: "Pagos y Pedidos",
    questions: [
      {
        q: "¿Qué métodos de pago tienen disponibles?",
        a: "Aceptamos pagos rápidos mediante PayPal para una confirmación inmediata de tu pedido. También admitimos transferencias bancarias nacionales o Pago Móvil. Si pagas por transferencia, solo debes subir una fotografía del comprobante de pago desde tu panel de 'Mis Pedidos' para que nuestro equipo lo valide."
      },
      {
        q: "¿Cuál es el tiempo estimado de entrega?",
        a: "Para productos estándar disponibles en stock (pestaña 'Diseños en Existencia'), la entrega se coordina en 2 a 5 días hábiles. Para pedidos personalizados elaborados a través de nuestro configurador 3D, el tiempo de fabricación artesanal ronda los 10 a 15 días hábiles a partir de la confirmación de tu pago."
      }
    ]
  },
  {
    category: "Envíos y Fletes",
    questions: [
      {
        q: "¿Realizan envíos a domicilio?",
        a: "Sí, realizamos envíos a todo el país. Al realizar tu pedido, puedes seleccionar entre 'Retiro en el local' (sin costo) o 'Envío a domicilio'. El costo de flete/delivery se calcula con base en la dirección de entrega y es cotizado por la administración posterior al registro de la compra."
      },
      {
        q: "¿Cómo pago el costo de envío una vez cotizado?",
        a: "Una vez que el administrador cotice el costo del flete, recibirás una notificación y el monto aparecerá reflejado en tu sección de 'Mis Pedidos'. Podrás realizar el pago del envío de forma segura mediante PayPal o subiendo un comprobante de transferencia por separado."
      }
    ]
  },
  {
    category: "Garantías y Devoluciones",
    questions: [
      {
        q: "¿Cuál es la política de cancelación y reembolsos por penalización?",
        a: "Nuestros pedidos requieren un anticipo del 50% para iniciar la fabricación y el 50% restante contra entrega. En caso de cancelación de un pedido en producción: si se realiza dentro de los primeros 5 días de fabricación, se devuelve el total depositado. Si la cancelación ocurre después de los 5 días, se aplica una penalización por materiales y trabajo iniciado, devolviéndose únicamente el 25% del total depositado."
      },
      {
        q: "¿Cuál es la política de devoluciones una vez recibido el mueble?",
        a: "En Mueblería Angela nos enfocamos en que adores tu mobiliario. Si necesitas solicitar una devolución tras la entrega, puedes hacer efectiva la solicitud directamente ingresando a tu panel de 'Mis Pedidos' y presionando el botón 'Solicitar Devolución'. Al registrar la solicitud de devolución, se inicia un proceso de revisión y el reembolso se completará en un lapso estimado de 3 a 5 días hábiles."
      },
      {
        q: "¿Qué pasa con el stock y el dinero de un pedido devuelto?",
        a: "Al aprobarse la devolución por la administración, el importe abonado se marca como 'Reembolsado' en el registro financiero y las piezas de mobiliario se reintegran de forma automática al stock del inventario."
      }
    ]
  }
];

export const FAQView = ({ onStartShopping }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Filter FAQs based on search
  const filteredFaqs = FAQ_DATA.map(category => {
    const questions = category.questions.filter(
      item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, questions };
  }).filter(category => category.questions.length > 0);

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-500">
      {/* FAQ Header */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest">
          <HelpCircle size={12} className="text-brand-accent animate-pulse" /> Soporte al Cliente
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-gray-900">
          Dudas y <span className="italic text-brand-accent">Respuestas</span>
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          ¿Tienes preguntas sobre el configurador 3D, envíos, métodos de pago o políticas de devolución? Encuentra las respuestas al instante aquí.
        </p>
      </header>

      {/* Search Input Box */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar dudas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-6 py-3.5 border border-brand-accent/10 rounded-2xl shadow-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm transition-all bg-white"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* FAQ Accordions */}
      <div className="space-y-8">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-paper/30 rounded-3xl border border-dashed border-gray-200">
            <HelpIcon className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-serif italic">No encontramos respuestas para "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-brand-accent mt-2 hover:underline"
            >
              Mostrar todas las preguntas
            </button>
          </div>
        ) : (
          filteredFaqs.map((cat, catIdx) => (
            <section key={cat.category} className="space-y-4">
              <h2 className="text-xs uppercase font-extrabold text-gray-400 tracking-wider text-left border-b pb-2 border-brand-accent/5">
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.questions.map((faq, faqIdx) => {
                  const uniqueIdx = `${catIdx}-${faqIdx}`;
                  const isOpen = activeQuestion === uniqueIdx;
                  return (
                    <div 
                      key={faq.q}
                      className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-brand-accent/30 shadow-md ring-1 ring-brand-accent/5' : 'border-brand-accent/10 hover:border-brand-accent/20 shadow-sm'}`}
                    >
                      <button
                        onClick={() => toggleQuestion(uniqueIdx)}
                        className="w-full flex justify-between items-center px-6 py-4.5 text-left font-serif text-base md:text-lg text-gray-900 cursor-pointer"
                      >
                        <span className="pr-4 leading-tight">{faq.q}</span>
                        <ChevronDown 
                          size={18} 
                          className={`text-brand-accent shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed border-t border-brand-accent/5 mt-1">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Start Shopping CTA */}
      <div className="bg-[#1A4B3C]/5 border border-[#1A4B3C]/10 p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
        <h3 className="text-xl font-serif font-bold text-gray-900">¿Listo para renovar tu hogar?</h3>
        <p className="text-xs text-gray-500">Explora nuestro configurador y dale vida a tus ideas con el visualizador 3D.</p>
        <button
          onClick={onStartShopping}
          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
        >
          Ir al catálogo <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
