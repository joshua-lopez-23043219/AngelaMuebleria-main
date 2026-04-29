import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "muebleria-secret-key-2024";
const PORT = 3000;

// Database Setup
const db = new Database("muebleria.db");
db.pragma("journal_mode = WAL");

// Initialize Schema — non-destructive (preserves data between restarts)
db.exec(`
  CREATE TABLE IF NOT EXISTS newsletter_subs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS discount_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    percentage REAL NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS custom_furnitures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    base_price REAL NOT NULL,
    image_url TEXT,
    wood_type TEXT
  );

  CREATE TABLE IF NOT EXISTS custom_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL,
    type TEXT,
    price_modifier REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    municipality TEXT,
    role TEXT DEFAULT 'client'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    wood_type TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'receipt',
    payment_receipt_url TEXT,
    paypal_order_id TEXT,
    discount_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Safe migrations — add new columns only if they don't exist yet
try { db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'receipt'"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN payment_receipt_url TEXT"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN paypal_order_id TEXT"); } catch(e){}
try { db.exec("ALTER TABLE orders ADD COLUMN discount_code TEXT"); } catch(e){}
try { db.exec("ALTER TABLE products ADD COLUMN wood_type TEXT"); } catch(e){}
try { db.exec("ALTER TABLE custom_furnitures ADD COLUMN wood_type TEXT"); } catch(e){}

const seedCustomizations = () => {
  const furnCount = db.prepare("SELECT COUNT(*) as count FROM custom_furnitures").get();
  if (furnCount.count === 0) {
    const furns = [
      { name: "Sofá Ethereal", base_price: 1200, image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800", wood_type: "Roble" },
      { name: "Cama Imperial", base_price: 3200, image_url: "https://images.unsplash.com/photo-1505693419148-43306071f56e?auto=format&fit=crop&q=80&w=800", wood_type: "Pino" },
      { name: "Silla Master", base_price: 450, image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800", wood_type: "Nogal" }
    ];
    const insertF = db.prepare("INSERT INTO custom_furnitures (name, base_price, image_url, wood_type) VALUES (?, ?, ?, ?)");
    furns.forEach(f => insertF.run(f.name, f.base_price, f.image_url, f.wood_type));
    
    const colors = [
      { name: "Pintura Blanca", hex_code: "#f0f0f0", type: "paint", price_modifier: 0 },
      { name: "Pintura Negra", hex_code: "#1a1a1a", type: "paint", price_modifier: 100 },
      { name: "Barniz Natural", hex_code: "#d4a373", type: "paint", price_modifier: 0 },
      { name: "Lino Gris", hex_code: "#9e9e9e", type: "fabric", price_modifier: 0 },
      { name: "Terciopelo Azul", hex_code: "#1a237e", type: "fabric", price_modifier: 250 },
      { name: "Cuero Tabaco", hex_code: "#795548", type: "fabric", price_modifier: 500 }
    ];
    const insertC = db.prepare("INSERT INTO custom_colors (name, hex_code, type, price_modifier) VALUES (?, ?, ?, ?)");
    colors.forEach(c => insertC.run(c.name, c.hex_code, c.type, c.price_modifier));
  }

  const codeCount = db.prepare("SELECT COUNT(*) as count FROM discount_codes").get();
  if (codeCount.count === 0) {
    db.prepare("INSERT INTO discount_codes (code, percentage) VALUES (?, ?)").run("BIENVENIDO10", 10);
  }
};
seedCustomizations();

// Seed Admin if not exists
const seedAdmin = () => {
  const adminEmail = "admin@muebleria.com";
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(adminEmail);
  if (!existing) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare(
      "INSERT INTO users (name, email, password, role, phone, department, municipality) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "Administrador Principal",
      adminEmail,
      hashedPassword,
      "admin",
      "88888888",
      "Masaya",
      "Masatepe",
    );
    console.log("Admin user seeded");
  }
};
seedAdmin();

// Seed Products if not exists
const seedProducts = () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM products").get();
  if (count.count === 0) {
    const products = [
      {
        name: "Silla Cinco Pico Mecedora",
        description: "Mecedora clásica de cinco picos con tejido de mimbre artesanal.",
        price: 1500,
        stock: 10,
        category: "Sillas",
        image_url: "/imagenes/silla cinco pico mecedora.png",
      },
      {
        name: "Silla Cinco Pico",
        description: "Silla de cinco picos tradicional, ideal para exteriores e interiores.",
        price: 1200,
        stock: 15,
        category: "Sillas",
        image_url: "/imagenes/silla cinco pico.png",
      },
      {
        name: "Silla Trébol Blanca",
        description: "Elegante silla trébol pintada de blanco con finos acabados.",
        price: 1300,
        stock: 8,
        category: "Sillas",
        image_url: "/imagenes/silla trebol, blanca.png",
      },
      {
        name: "Sillas Especial Natural",
        description: "Sillas de diseño especial en color natural, tejidas a mano.",
        price: 1400,
        stock: 12,
        category: "Sillas",
        image_url: "/imagenes/sillas especial, natural.png",
      },
      {
        name: "Sillas Granadinas Solas",
        description: "Sillas estilo granadino, robustas y de gran durabilidad.",
        price: 1100,
        stock: 20,
        category: "Sillas",
        image_url: "/imagenes/sillas granadinas solas.png",
      },
      {
        name: "Sillas para Comedor",
        description: "Juego de sillas diseñadas ergonómicamente para el comedor.",
        price: 1600,
        stock: 24,
        category: "Sillas",
        image_url: "/imagenes/sillas para comedor.png",
      },
      {
        name: "Sillas Trébol Natural Encolochadas Mecedoras",
        description: "Mecedoras trébol natural con acabado encolochado premium.",
        price: 1800,
        stock: 6,
        category: "Mecedoras",
        image_url: "/imagenes/sillas trebol natural, encolochadas, mecedoras.png",
      },
      {
        name: "Sillas Trébol Naturales Encolochadas",
        description: "Sillas fijas trébol natural con detalles encolochados.",
        price: 1700,
        stock: 10,
        category: "Sillas",
        image_url: "/imagenes/sillas trebol, naturales encolochadas.png",
      },
      {
        name: "Sofá de 2 Plazas",
        description: "Sofá compacto de 2 plazas, tejido resistente para uso diario.",
        price: 3500,
        stock: 5,
        category: "Sofás",
        image_url: "/imagenes/sofas de 2.png",
      },
      {
        name: "Sofá de 3 Plazas Trébol",
        description: "Sofá amplio de 3 plazas con hermoso diseño trébol en el respaldo.",
        price: 4500,
        stock: 3,
        category: "Sofás",
        image_url: "/imagenes/sofas de 3 trebol.png",
      },
      {
        name: "Sofá de 3 Plazas",
        description: "Clásico sofá de 3 plazas ideal para la sala de estar o terraza.",
        price: 4200,
        stock: 4,
        category: "Sofás",
        image_url: "/imagenes/sofas de 3.png",
      },
    ];

    const insert = db.prepare(
      "INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const p of products) {
      insert.run(
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        p.image_url,
      );
    }
    console.log("Products seeded");
  }
};
seedProducts();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Middleware for Authentication
  const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    next();
  };

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let dest = path.join(__dirname, 'public', 'imagenes');
      if (req.body.type === 'receipt') {
        dest = path.join(__dirname, 'public', 'comprobantes');
      }
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
  });
  const upload = multer({ storage: storage });

  app.post("/api/upload", authMiddleware, upload.single('file'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const folder = req.body.type === 'receipt' ? 'comprobantes' : 'imagenes';
      res.json({ url: `/${folder}/${req.file.filename}` });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Customizations
  app.get("/api/custom-furnitures", (req, res) => {
    res.json(db.prepare("SELECT * FROM custom_furnitures").all());
  });
  app.post("/api/custom-furnitures", authMiddleware, adminMiddleware, (req, res) => {
    const { name, base_price, image_url, wood_type } = req.body;
    const result = db.prepare("INSERT INTO custom_furnitures (name, base_price, image_url, wood_type) VALUES (?, ?, ?, ?)").run(name, base_price, image_url, wood_type);
    res.json({ id: result.lastInsertRowid });
  });
  app.delete("/api/custom-furnitures/:id", authMiddleware, adminMiddleware, (req, res) => {
    db.prepare("DELETE FROM custom_furnitures WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/custom-colors", (req, res) => {
    res.json(db.prepare("SELECT * FROM custom_colors").all());
  });
  app.post("/api/custom-colors", authMiddleware, adminMiddleware, (req, res) => {
    const { name, hex_code, type, price_modifier } = req.body;
    const result = db.prepare("INSERT INTO custom_colors (name, hex_code, type, price_modifier) VALUES (?, ?, ?, ?)").run(name, hex_code, type, price_modifier);
    res.json({ id: result.lastInsertRowid });
  });
  app.delete("/api/custom-colors/:id", authMiddleware, adminMiddleware, (req, res) => {
    db.prepare("DELETE FROM custom_colors WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, department, municipality } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db
        .prepare(
          "INSERT INTO users (name, email, password, phone, department, municipality) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(name, email, hashedPassword, phone, department, municipality);
      const userId = Number(result.lastInsertRowid);
      const token = jwt.sign({ id: userId, role: "client" }, JWT_SECRET);
      res.json({
        token,
        user: {
          id: userId,
          name,
          email,
          role: "client",
          phone,
          department,
          municipality,
        },
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      const token = jwt.sign(
        { id: Number(user.id), role: user.role },
        JWT_SECRET,
      );
      res.json({
        token,
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          municipality: user.municipality,
        },
      });
    } catch (e) {
      res.status(500).json({ error: "Error en el login: " + e.message });
    }
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", authMiddleware, adminMiddleware, (req, res) => {
    const { name, description, price, stock, category, image_url, wood_type } = req.body;
    const result = db
      .prepare(
        "INSERT INTO products (name, description, price, stock, category, image_url, wood_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(name, description, price, stock, category, image_url, wood_type);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch(
    "/api/products/:id",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const { name, description, price, stock, category, image_url, wood_type } = req.body;
      db.prepare(
        "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?, wood_type = ? WHERE id = ?",
      ).run(
        name,
        description,
        price,
        stock,
        category,
        image_url,
        wood_type,
        req.params.id,
      );
      res.json({ success: true });
    },
  );

  app.delete(
    "/api/products/:id",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    },
  );

  // Newsletter & Discounts
  app.post("/api/newsletter", (req, res) => {
    try {
      db.prepare("INSERT INTO newsletter_subs (email) VALUES (?)").run(req.body.email);
      res.json({ success: true, message: "¡Suscripción exitosa!" });
    } catch (e) {
      if (e.message.includes("UNIQUE")) {
        res.status(400).json({ error: "Este correo ya está suscrito." });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  app.post("/api/discount/validate", (req, res) => {
    const code = db.prepare("SELECT * FROM discount_codes WHERE code = ? AND active = 1").get(req.body.code);
    if (code) {
      res.json({ valid: true, percentage: code.percentage });
    } else {
      res.status(400).json({ error: "Código inválido o expirado." });
    }
  });

  // Orders
  app.post("/api/orders", authMiddleware, (req, res) => {
    const { items, total, payment_method, payment_receipt_url, paypal_order_id, discount_code } = req.body;
    const transaction = db.transaction(() => {
      const orderResult = db
        .prepare("INSERT INTO orders (user_id, total, payment_method, payment_receipt_url, paypal_order_id, discount_code) VALUES (?, ?, ?, ?, ?, ?)")
        .run(req.user.id, total, payment_method, payment_receipt_url, paypal_order_id, discount_code);
      const orderId = orderResult.lastInsertRowid;
      for (const item of items) {
        db.prepare(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        ).run(orderId, item.id, item.quantity, item.price);
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
          item.quantity,
          item.id,
        );
      }
      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ id: orderId });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/orders/my", authMiddleware, (req, res) => {
    const orders = db
      .prepare(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(req.user.id);
    res.json(orders);
  });

  app.get("/api/orders/:id/items", authMiddleware, (req, res) => {
    try {
      // Verificar que el pedido pertenezca al usuario
      const order = db
        .prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?")
        .get(req.params.id, req.user.id);
      if (!order) return res.status(403).json({ error: "Acceso denegado" });

      const items = db
        .prepare(
          `
        SELECT order_items.*, products.name, products.image_url
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_id = ?
      `,
        )
        .all(req.params.id);
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/orders", authMiddleware, adminMiddleware, (req, res) => {
    try {
      console.log("Fetching all orders for admin...");
      const orders = db
        .prepare(
          `
        SELECT 
          orders.id,
          orders.user_id,
          orders.total,
          orders.status,
          orders.payment_method,
          orders.payment_receipt_url,
          orders.paypal_order_id,
          orders.created_at,
          users.name as user_name,
          users.email as user_email,
          users.phone as user_phone,
          users.department as user_department,
          users.municipality as user_municipality
        FROM orders 
        LEFT JOIN users ON orders.user_id = users.id 
        ORDER BY orders.created_at DESC
      `,
        )
        .all();
      console.log(`Found ${orders.length} orders`);
      res.json(orders);
    } catch (e) {
      console.error("Error fetching admin orders:", e);
      res.status(500).json({ error: "Error al obtener pedidos: " + e.message });
    }
  });

  app.get(
    "/api/admin/orders/:id/items",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      try {
        const items = db
          .prepare(
            `
        SELECT order_items.*, products.name, products.image_url
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_id = ?
      `,
          )
          .all(req.params.id);
        res.json(items);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  app.patch(
    "/api/admin/orders/:id/status",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const { status } = req.body;
      const validStatuses = ['pending', 'payment_review', 'payment_validated', 'processing', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      try {
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(
          status,
          req.params.id,
        );
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  );

  // Dashboard Stats
  app.get("/api/admin/stats", authMiddleware, adminMiddleware, (req, res) => {
    try {
      const orders = db.prepare("SELECT total, status FROM orders").all();
      const products = db.prepare("SELECT stock FROM products").all();
      
      const totalSales = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const lowStock = products.filter(p => (Number(p.stock) || 0) < 5).length;
      
      const stats = {
        revenue: totalSales,
        orders: totalOrders,
        products: totalProducts,
        lowStock: lowStock
      };
      
      res.json(stats);
    } catch (e) {
      console.error("Error generating stats:", e);
      res.status(500).json({ error: "Error al generar estadísticas: " + e.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
