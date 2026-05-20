import React from "react";
import {
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ShoppingCart,
  ChevronDown,
  Palette,
  Box,
  Menu,
  X,
} from "lucide-react";

export const Navbar = ({
  onCartOpen,
  cartCount,
  user,
  onLogout,
  onChangePage,
}) => {
  const [isServicesOpen, setIsServicesOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigateTo = (page) => {
    onChangePage(page);
    setIsMobileMenuOpen(false);
    setIsServicesOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-accent/20 px-4 md:px-8 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer select-none"
          onClick={() => navigateTo("home")}
        >
          <span 
            className="text-[#1A4B3C] text-3xl md:text-5xl"
            style={{ fontFamily: "'Great Vibes', cursive", transform: 'translateY(-2px)' }}
          >
            Angela
          </span>
          <span 
            className="text-brand-accent tracking-[0.2em] md:tracking-[0.25em] text-[10px] md:text-sm font-bold uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Mueblería
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigateTo("home")}
            className="text-sm font-medium hover:text-brand-accent transition-colors"
          >
            Inicio
          </button>
          
          {/* Dropdown - Catálogo */}
          <div className="relative group">
            <button
              onMouseEnter={() => setIsServicesOpen(true)}
              onClick={() => {
                onChangePage("catalog");
                setIsServicesOpen(!isServicesOpen);
              }}
              className="flex items-center gap-1 text-sm font-medium hover:text-brand-accent transition-colors"
            >
              Catálogo{" "}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${isServicesOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              onMouseLeave={() => setIsServicesOpen(false)}
              className={`absolute top-full left-0 mt-2 w-48 bg-white border border-brand-accent/10 rounded-2xl shadow-xl p-2 transition-all duration-300 origin-top ${isServicesOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
            >
              <button
                onClick={() => navigateTo("designs")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-paper rounded-xl transition-colors text-left"
              >
                <Palette size={16} className="text-brand-accent" />
                <div>
                  <p className="font-bold">Diseños</p>
                  <p className="text-[10px] text-gray-400">
                    Modelos en existencia
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigateTo("builder")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-paper rounded-xl transition-colors text-left"
              >
                <Box size={16} className="text-brand-accent" />
                <div>
                  <p className="font-bold">Crea tu diseño</p>
                  <p className="text-[10px] text-gray-400">Configurador 3D</p>
                </div>
              </button>
            </div>
          </div>

          {user?.role === "admin" && (
            <button
              onClick={() => navigateTo("admin")}
              className="text-sm font-medium text-brand-accent hover:underline flex items-center gap-1"
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo("orders")}
                className="text-sm font-medium hover:text-brand-accent"
              >
                Mis Pedidos
              </button>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigateTo("login")}
              className="flex items-center gap-2 text-sm font-medium bg-brand-primary text-white px-4 py-2 rounded-full hover:bg-brand-accent transition-all"
            >
              <UserIcon size={16} /> Entrar
            </button>
          )}

          <button
            className="relative p-2 hover:bg-paper rounded-full transition-colors"
            onClick={onCartOpen}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="relative p-2 hover:bg-paper rounded-full transition-colors"
            onClick={onCartOpen}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          
          <button
            className="p-2 hover:bg-paper rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 max-h-0 ${isMobileMenuOpen ? "max-h-[400px] border-t border-brand-accent/10 mt-3 pt-3" : ""}`}
      >
        <div className="flex flex-col gap-2 pb-4">
          <button
            onClick={() => navigateTo("home")}
            className="text-left py-2 px-4 text-sm font-medium hover:bg-paper rounded-xl transition-colors"
          >
            Inicio
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          <p className="px-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">Catálogo</p>
          
          <button
            onClick={() => navigateTo("catalog")}
            className="text-left py-2 px-6 text-sm hover:bg-paper rounded-xl transition-colors flex items-center gap-2"
          >
            <Box size={14} className="text-brand-accent" /> Todos los Productos
          </button>
          <button
            onClick={() => navigateTo("designs")}
            className="text-left py-2 px-6 text-sm hover:bg-paper rounded-xl transition-colors flex items-center gap-2"
          >
            <Palette size={14} className="text-brand-accent" /> Diseños en Existencia
          </button>
          <button
            onClick={() => navigateTo("builder")}
            className="text-left py-2 px-6 text-sm hover:bg-paper rounded-xl transition-colors flex items-center gap-2"
          >
            <Box size={14} className="text-brand-accent" /> Crea tu diseño (3D)
          </button>

          <div className="border-t border-gray-100 my-1" />

          {user?.role === "admin" && (
            <button
              onClick={() => navigateTo("admin")}
              className="text-left py-2 px-4 text-sm font-bold text-brand-accent hover:bg-paper rounded-xl transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={14} /> Dashboard Admin
            </button>
          )}

          {user ? (
            <>
              <button
                onClick={() => navigateTo("orders")}
                className="text-left py-2 px-4 text-sm font-medium hover:bg-paper rounded-xl transition-colors"
              >
                Mis Pedidos
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-2 px-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => navigateTo("login")}
              className="mt-2 mx-4 py-3 text-center text-sm font-medium bg-brand-primary text-white rounded-xl hover:bg-brand-accent transition-all flex items-center justify-center gap-2"
            >
              <UserIcon size={14} /> Entrar / Crear Cuenta
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
