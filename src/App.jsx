import React, { useState } from "react";

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
  // Custom Hooks to separate functionality (JS) from layout (HTML)
  const auth = useAuth();
  const prod = useProducts();
  const cart = useCart(auth.user);

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
          <HomeView onStartShopping={() => setCurrentPage("catalog")} />
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
              {prod.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={cart.addToCart}
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
                .filter((p) => p.stock > 0)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={cart.addToCart}
                  />
                ))}
            </div>
            {prod.products.filter((p) => p.stock > 0).length === 0 && (
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
        onCheckout={handleCheckout}
        total={cart.cartTotal}
        rawTotal={cart.cartRawTotal}
        discount={cart.discount}
        onApplyDiscount={cart.applyDiscount}
        onClearDiscount={cart.clearDiscount}
      />

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
