import React from "react";
import { motion } from "motion/react";
import { Edit3, Trash2, Box } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "../services/api";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const ProductCard = ({
  product,
  onAddToCart,
  isAdmin,
  onEdit,
  onDelete,
  onView3D,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="product-card"
    >
      <div className="product-image-container animate-in fade-in zoom-in-95 duration-300">
        <img
          src={
            api.getImageUrl(product.image_url) ||
            `https://picsum.photos/seed/${product.name}/500/500`
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {product.model_3d_url && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onView3D && onView3D(product);
            }}
            className="absolute top-3 right-3 bg-white/95 backdrop-blur-md hover:bg-brand-accent hover:text-white text-brand-primary px-3.5 py-2 rounded-full shadow-xl transition-all duration-300 flex items-center gap-2 z-10 border border-brand-accent/20 cursor-pointer hover:scale-105 active:scale-95"
            title="Ver en 3D interactivo"
          >
            <Box size={14} className="text-brand-accent animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Ver en 3D</span>
          </button>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-brand-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg leading-tight">{product.name}</h3>
          <span className="font-mono text-brand-accent text-sm font-bold">
            C${product.price.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
        {product.dimensions && (
          <p className="text-xs text-gray-400 font-medium">
            Medidas: {product.dimensions}
          </p>
        )}
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
            {product.category || product.category_read}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              product.stock < 5 ? "text-red-500" : "text-gray-400",
            )}
          >
            {product.stock} disponibles
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          disabled={product.stock <= 0}
          onClick={() => onAddToCart(product)}
          className="btn-primary flex-1"
        >
          Añadir al Carrito
        </button>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(product)} className="btn-outline p-2">
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
