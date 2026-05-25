import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Box, ShoppingCart, Sparkles } from "lucide-react";
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

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selected3dProduct, setSelected3dProduct] = useState(null);
  // Custom Hooks to separate functionality (JS) from layout (HTML)
  const auth = useAuth();
  const prod = useProducts();
  const cart = useCart(auth.user);
  
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

        {currentPage === "builder" && <FurnitureBuilder />}

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
          </div>
          <p className="text-[10px] text-gray-400">
            © 2024 ANGELA MUEBLERÍA. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </footer>
    </div>
  );
}
