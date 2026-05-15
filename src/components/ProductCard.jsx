import React from "react";
import { motion } from "motion/react";
import { Edit3, Trash2 } from "lucide-react";
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
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="product-card"
    >
      <div className="product-image-container">
        <img
          src={
            api.getImageUrl(product.image_url) ||
            `https://picsum.photos/seed/${product.name}/500/500`
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-brand-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg leading-tight">{product.name}</h3>
          <span className="font-mono text-brand-accent text-sm font-bold">
            ${product.price.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
            {product.category}
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
