import React from "react";
import {
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ShoppingCart,
  ChevronDown,
  Palette,
  Box,
} from "lucide-react";

export const Navbar = ({
  onCartOpen,
  cartCount,
  user,
  onLogout,
  onChangePage,
}) => {
  const [isServicesOpen, setIsServicesOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-accent/20 px-6 py-4 flex justify-between items-center">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => onChangePage("home")}
      >
        <span 
          className="text-[#1A4B3C] text-5xl"
          style={{ fontFamily: "'Great Vibes', cursive", transform: 'translateY(-4px)' }}
        >
          Angela
        </span>
        <span 
          className="text-brand-accent tracking-[0.25em] text-sm font-bold uppercase"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Mueblería
        </span>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => onChangePage("home")}
          className="text-sm font-medium hover:text-brand-accent transition-colors"
        >
          Inicio
        </button>
        {/* Dropdown - Catálogo */}
        <div className="relative group">
          <button
            onMouseEnter={() => setIsServicesOpen(true)}
            onClick={() => setIsServicesOpen(!isServicesOpen)}
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
              onClick={() => {
                onChangePage("designs");
                setIsServicesOpen(false);
              }}
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
              onClick={() => {
                onChangePage("builder");
                setIsServicesOpen(false);
              }}
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
            onClick={() => onChangePage("admin")}
            className="text-sm font-medium text-brand-accent hover:underline flex items-center gap-1"
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
        )}
        {user ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => onChangePage("orders")}
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
            onClick={() => onChangePage("login")}
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
    </nav>
  );
};
