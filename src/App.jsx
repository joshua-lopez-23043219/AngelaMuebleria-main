import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Box, ShoppingCart, Sparkles, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { api } from "./services/api";

// Hooks (JS Logic)
import { useAuth } from "./hooks/useAuth";
import { useCart } from "./hooks/useCart";
import { useProducts } from "./hooks/useProducts";

// Components (Layout/HTML)
import { Navbar } from "./components/Navbar";
import { ProductCard } from "./components/ProductCard";
import { CartDropdown } from "./components/CartDropdown";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginPage } from "./components/LoginPage";
import { OrdersList } from "./components/OrdersList";
import { FurnitureBuilder } from "./components/FurnitureBuilder";
import { HomeView } from "./components/HomeView";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { FAQView } from "./components/FAQView";
import { SupportWidget } from "./components/SupportWidget";

// Canvas Confetti Celebration Emitter
const fireConfetti = () => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  const colors = ["#1A4B3C", "#d97706", "#2563eb", "#9333ea", "#16a34a", "#e11d48"];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 150,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      velocity: {
        x: Math.random() * 3 - 1.5,
        y: Math.random() * 3 + 2
      }
    });
  }

  let animationFrameId;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.velocity.y;
      p.x += p.velocity.x;
      p.tilt = Math.sin(p.tiltAngle) * 12;

      if (p.y <= height) {
        active = true;
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    if (active) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      if (canvas.parentNode) {
        document.body.removeChild(canvas);
      }
      window.removeEventListener("resize", handleResize);
    }
  };

  draw();

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      document.body.removeChild(canvas);
    }
    window.removeEventListener("resize", handleResize);
  }, 6000);
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selected3dProduct, setSelected3dProduct] = useState(null);
  const [customAlert, setCustomAlert] = useState(null); // { message, title, type }

  // Custom Hooks to separate functionality (JS) from layout (HTML)
  const auth = useAuth();
  const prod = useProducts();
  const cart = useCart(auth.user);

  // Set up custom notification listener & override window.alert
  React.useEffect(() => {
    const handleCustomAlert = (e) => {
      const { message, title, type } = e.detail;
      setCustomAlert({ message, title, type: type || "info" });
    };

    const getLocalImageFallback = (name) => {
      const norm = String(name || "").toLowerCase();
      
      // 1. Specific matches
      if (norm.includes("trevol") || norm.includes("trébol")) {
        if (norm.includes("sofa") || norm.includes("sofá")) {
          return "/imagenes/sofas de 3 trebol.png";
        }
        if (norm.includes("blanca") || norm.includes("blanco")) {
          return "/imagenes/silla trebol, blanca.png";
        }
        return "/imagenes/sillas trebol, naturales encolochadas.png";
      }
      
      if (norm.includes("comedor")) {
        return "/imagenes/sillas para comedor.png";
      }
      
      if (norm.includes("cinco pico")) {
        if (norm.includes("mecedora")) {
          return "/imagenes/silla cinco pico mecedora.png";
        }
        return "/imagenes/silla cinco pico.png";
      }
      
      if (norm.includes("especial")) {
        return "/imagenes/sillas especial, natural.png";
      }
      
      if (norm.includes("granadina")) {
        return "/imagenes/sillas granadinas solas.png";
      }
      
      if (norm.includes("bulungo")) {
        return "/imagenes/sofas de 2.png";
      }

      // 2. Generic category fallback based on product keywords (using high quality local images)
      if (norm.includes("mecedora") || norm.includes("columpio")) {
        return "/imagenes/sillas trebol natural, encolochadas, mecedoras.png";
      }
      
      if (norm.includes("silla") || norm.includes("sillón") || norm.includes("sillon")) {
        return "/imagenes/sillas especial, natural.png";
      }

      if (norm.includes("sofa") || norm.includes("sofá")) {
        return "/imagenes/sofas de 3.png";
      }

      if (norm.includes("mesa")) {
        return "/imagenes/sillas para comedor.png"; // Dining set with table
      }
      
      // 3. Absolute default if no keyword matches (using a beautiful Unsplash furniture studio shot instead of picsum)
      return "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800";
    };

    const handleImageError = (e) => {
      if (e.target && e.target.tagName === "IMG") {
        if (e.target.dataset.fallbackTriggered) return;
        e.target.dataset.fallbackTriggered = "true";
        
        const name = e.target.alt || "";
        e.target.src = getLocalImageFallback(name);
      }
    };

    window.addEventListener("show-custom-alert", handleCustomAlert);
    window.addEventListener("error", handleImageError, true);
    
    // Override window.alert globally!
    const originalAlert = window.alert;
    window.alert = (message, title = "Notificación") => {
      let type = "info";
      const lowercaseMsg = String(message || "").toLowerCase();
      if (
        lowercaseMsg.includes("éxito") || 
        lowercaseMsg.includes("exitosamente") || 
        lowercaseMsg.includes("guardado con éxito") || 
        lowercaseMsg.includes("registrada correctamente") || 
        lowercaseMsg.includes("enviado exitosamente") ||
        lowercaseMsg.includes("completado con éxito")
      ) {
        type = "success";
      } else if (
        lowercaseMsg.includes("error") || 
        lowercaseMsg.includes("falló") || 
        lowercaseMsg.includes("incorrecta") || 
        lowercaseMsg.includes("debe iniciar sesión") || 
        lowercaseMsg.includes("por favor") ||
        lowercaseMsg.includes("inválido") ||
        lowercaseMsg.includes("ingresa")
      ) {
        type = "warning";
      }
      
      const event = new CustomEvent("show-custom-alert", {
        detail: { message, title, type }
      });
      window.dispatchEvent(event);
    };

    return () => {
      window.removeEventListener("show-custom-alert", handleCustomAlert);
      window.removeEventListener("error", handleImageError, true);
      window.alert = originalAlert;
    };
  }, []);
  
  // Check for reset-password query param on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action === "reset-password") {
      setCurrentPage("reset-password");
    }
  }, []);

  // Force scroll to top on every page change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Refresh products whenever we navigate to a public listing page
  React.useEffect(() => {
    if (currentPage === "catalog" || currentPage === "designs") {
      prod.refreshProducts();
    }
  }, [currentPage, prod.refreshProducts]);

  const handleCheckoutSuccess = () => {
    setCurrentPage("orders");
    prod.refreshProducts(); // Update stock in UI
    alert("¡Pedido realizado con éxito!");
    fireConfetti();
  };

  const handleCheckout = async (paymentData) => {
    try {
      await cart.checkout(paymentData, handleCheckoutSuccess);
    } catch (e) {
      if (e.message === "Debe iniciar sesión para realizar un pedido") {
        setCurrentPage("login");
      } else {
        alert(e.message);
      }
    }
  };

  if (prod.loading && prod.products.length === 0) {
    return (
      <div className="h-screen grid place-items-center font-serif text-2xl animate-pulse">
        Cargando Angela Mueblería...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <Navbar
        onCartOpen={() => cart.setIsCartOpen(true)}
        cartCount={cart.cartCount}
        user={auth.user}
        onLogout={() => {
          auth.handleLogout();
          setCurrentPage("catalog");
        }}
        onChangePage={setCurrentPage}
      />

      {/* Main Content Section (Structure/HTML) */}
      <main className="flex-1 w-full">
        {currentPage === "home" && (
          <HomeView onStartShopping={() => setCurrentPage("catalog")} onAddToCart={cart.addToCart} />
        )}

        {currentPage === "catalog" && (
          <div className="max-w-7xl mx-auto p-8 space-y-12">
            <header className="text-center space-y-4">
              <h1 className="text-6xl font-serif font-bold tracking-tight">
                Catálogo{" "}
                <span className="italic text-brand-accent">Completo</span>
              </h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Explora nuestra colección completa de mobiliario diseñado para
                elevar tu espacio personal.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {prod.products
                .filter(p => p.esta_activo !== false)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={cart.addToCart}
                    onView3D={setSelected3dProduct}
                  />
                ))}
            </div>

            {prod.error && (
              <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl">
                Error al cargar el catálogo: {prod.error}
              </div>
            )}
          </div>
        )}

        {currentPage === "designs" && (
          <div className="max-w-7xl mx-auto p-8 space-y-12">
            <header className="text-center space-y-4">
              <h1 className="text-5xl font-serif font-bold tracking-tight">
                Diseños en{" "}
                <span className="italic text-brand-accent">Existencia</span>
              </h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Explora las piezas disponibles para entrega inmediata. Calidad
                Angela Mueblería.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {prod.products
                .filter((p) => (Number(p.stock) || 0) > 0 && p.esta_activo !== false)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={cart.addToCart}
                    onView3D={setSelected3dProduct}
                  />
                ))}
            </div>
            {prod.products.filter((p) => (Number(p.stock) || 0) > 0).length === 0 && (
              <p className="text-center py-20 text-gray-400 italic font-serif text-xl">
                Lo sentimos, no hay productos en stock en este momento.
              </p>
            )}
          </div>
        )}

        {currentPage === "builder" && <FurnitureBuilder onAddToCart={cart.addToCart} />}

        {currentPage === "faq" && (
          <FAQView onStartShopping={() => setCurrentPage("catalog")} />
        )}

        {currentPage === "login" && (
          <div className="max-w-md mx-auto">
            <LoginPage
              onAuth={(data) => {
                auth.handleAuth(data);
                setCurrentPage("catalog");
              }}
            />
          </div>
        )}

        {currentPage === "reset-password" && (
          <div className="max-w-md mx-auto">
            <ResetPasswordPage onChangePage={setCurrentPage} />
          </div>
        )}

        {currentPage === "admin" && auth.isAdmin && (
          <div className="max-w-7xl mx-auto">
            <AdminDashboard />
          </div>
        )}

        {currentPage === "orders" && auth.user && (
          <div className="p-8 space-y-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-serif font-bold">Mis Pedidos</h1>
            <OrdersList />
          </div>
        )}
      </main>

      {/* Cart Modal Section */}
      <CartDropdown
        isOpen={cart.isCartOpen}
        onClose={() => cart.setIsCartOpen(false)}
        items={cart.cart}
        onRemove={cart.removeFromCart}
        onUpdateQuantity={cart.updateQuantity}
        onCheckout={handleCheckout}
        total={cart.cartTotal}
        rawTotal={cart.cartRawTotal}
        discount={cart.discount}
        onApplyDiscount={cart.applyDiscount}
        onClearDiscount={cart.clearDiscount}
        comboDiscounts={cart.comboDiscounts}
        comboDiscountTotal={cart.comboDiscountTotal}
        onAddToCart={cart.addToCart}
        products={prod.products}
      />

      {/* 3D Model Viewer Modal */}
      <AnimatePresence>
        {selected3dProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Dark glassmorphism background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected3dProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-brand-accent/10"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-paper/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-accent/10 text-brand-accent rounded-xl">
                    <Box size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-gray-800">
                      {selected3dProduct.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Vista 3D Interactiva & Realidad Aumentada (AR)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected3dProduct(null)}
                  className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all duration-200 cursor-pointer"
                  title="Cerrar vista"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body: Model Viewer */}
              <div className="relative flex-1 bg-gray-50/50 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[480px]">
                {/* Embedded model-viewer */}
                <model-viewer
                  src={api.getImageUrl(selected3dProduct.model_3d_url)}
                  alt={selected3dProduct.name}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  auto-rotate
                  shadow-intensity="1"
                  shadow-softness="0.8"
                  exposure="1.2"
                  interaction-prompt="auto"
                  style={{ width: "100%", height: "450px", outline: "none" }}
                  className="w-full h-full"
                >
                  {/* Custom AR Button */}
                  <button
                    slot="ar-button"
                    className="absolute bottom-4 right-4 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-brand-accent transition-all flex items-center gap-2 border border-white/20 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    Ver en mi Espacio (AR)
                  </button>
                  
                  {/* Loading indicator */}
                  <div slot="poster" className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm gap-3">
                    <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-gray-500 tracking-wider uppercase animate-pulse">Cargando Modelo 3D...</span>
                  </div>
                </model-viewer>
              </div>

              {/* Footer / Controls Instruction / Add to Cart CTA */}
              <div className="p-6 bg-paper/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Controles</p>
                  <p className="text-xs text-gray-600 font-medium">
                    Gira con un dedo · Zoom con dos dedos · Desplaza con dos dedos
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Precio Unitario</p>
                    <p className="font-mono text-lg font-bold text-brand-accent">
                      C${selected3dProduct.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    disabled={selected3dProduct.stock <= 0}
                    onClick={() => {
                      cart.addToCart(selected3dProduct);
                      setSelected3dProduct(null);
                    }}
                    className="flex-1 sm:flex-none bg-brand-primary hover:bg-brand-accent text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart size={16} />
                    Añadir al Carrito
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Section */}
      <footer className="border-t border-brand-accent/10 py-12 px-8 bg-white mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentPage("home")}
          >
            <span 
              className="text-[#1A4B3C] text-4xl"
              style={{ fontFamily: "'Great Vibes', cursive", transform: 'translateY(-2px)' }}
            >
              Angela
            </span>
            <span 
              className="text-brand-accent tracking-[0.25em] text-xs font-bold uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Mueblería
            </span>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
            <button
              onClick={() => setCurrentPage("catalog")}
              className="hover:text-brand-accent transition-colors"
            >
              Diseño
            </button>
            <button
              onClick={() => setCurrentPage("home")}
              className="hover:text-brand-accent transition-colors"
            >
              Historia
            </button>
            <button
              onClick={() => setCurrentPage("builder")}
              className="hover:text-brand-accent transition-colors"
            >
              Personalizar
            </button>
            <button
              onClick={() => setCurrentPage("faq")}
              className="hover:text-brand-accent transition-colors"
            >
              FAQ
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            © 2024 ANGELA MUEBLERÍA. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </footer>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {customAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomAlert(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />
            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-accent/10 flex flex-col items-center p-6 text-center"
            >
              {/* Icon Container based on type */}
              <div className={`p-4 rounded-full mb-4 ${
                customAlert.type === "success" ? "bg-green-50 text-green-500 animate-pulse" :
                customAlert.type === "warning" ? "bg-amber-50 text-amber-500" :
                customAlert.type === "error" ? "bg-red-50 text-red-500" :
                "bg-blue-50 text-blue-500"
              }`}>
                {customAlert.type === "success" && <CheckCircle size={36} />}
                {customAlert.type === "warning" && <AlertTriangle size={36} />}
                {customAlert.type === "error" && <AlertCircle size={36} />}
                {customAlert.type === "info" && <Info size={36} />}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-800 font-serif mb-2">
                {customAlert.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">
                {customAlert.message}
              </p>

              {/* Button */}
              <button
                onClick={() => setCustomAlert(null)}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  customAlert.type === "success" ? "bg-green-500 hover:bg-green-600 text-white shadow-green-100" :
                  customAlert.type === "warning" ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100" :
                  customAlert.type === "error" ? "bg-red-500 hover:bg-red-600 text-white shadow-red-100" :
                  "bg-brand-primary hover:bg-brand-accent text-white shadow-brand-accent/20"
                }`}
              >
                Aceptar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Support Widget */}
      <SupportWidget onNavigate={setCurrentPage} />
    </div>
  );
}
