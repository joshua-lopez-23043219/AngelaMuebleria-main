import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Download,
  Percent,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AnalyticsTab = ({ orders, products, stats }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredDept, setHoveredDept] = useState(null);
  const [hoveredDonut, setHoveredDonut] = useState(null);

  // 1. KPI Calculations
  const metrics = useMemo(() => {
    const activeStates = ['pendiente', 'en_proceso', 'listo', 'payment_review', 'payment_validated'];
    const nonCancelled = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
    
    const netSales = nonCancelled.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrders = orders.filter(o => activeStates.includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'entregado').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;
    const avgTicket = nonCancelled.length > 0 ? netSales / nonCancelled.length : 0;
    
    // Low stock count
    const lowStockCount = products.filter(p => (Number(p.stock) || 0) < 5).length;

    return {
      netSales,
      activeOrders,
      completedOrders,
      cancelledOrders,
      avgTicket,
      lowStockCount
    };
  }, [orders, products]);

  // 2. Trend Calculations (Last 7 Days)
  const salesTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      days.push({ dateString, label, sales: 0, count: 0 });
    }

    orders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'refunded') return;
      const oDate = o.creado_en ? o.creado_en.split('T')[0] : '';
      const dayObj = days.find(d => d.dateString === oDate);
      if (dayObj) {
        dayObj.sales += Number(o.total) || 0;
        dayObj.count += 1;
      }
    });

    // Make SVG coordinates (width 600, height 200, padding 40)
    const paddingX = 50;
    const paddingY = 30;
    const width = 600;
    const height = 200;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxSales = Math.max(...days.map(d => d.sales), 1000);

    const points = days.map((d, index) => {
      const x = paddingX + (index * (chartW / (days.length - 1)));
      const y = paddingY + chartH - (d.sales / maxSales) * chartH;
      return { ...d, x, y };
    });

    // Generate path d
    let linePath = "";
    let areaPath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
      areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${paddingY + chartH} Z`;
    }

    return {
      points,
      linePath,
      areaPath,
      maxSales,
      width,
      height,
      chartW,
      chartH,
      paddingX,
      paddingY
    };
  }, [orders]);

  // 3. Status Distribution
  const statusData = useMemo(() => {
    const counts = {
      pending: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(o => {
      const state = o.status || 'pending';
      if (state === 'pending' || state === 'pendiente' || state === 'payment_review') counts.pending++;
      else if (state === 'processing' || state === 'en_proceso' || state === 'payment_validated') counts.processing++;
      else if (state === 'ready' || state === 'listo') counts.ready++;
      else if (state === 'delivered' || state === 'entregado') counts.delivered++;
      else if (state === 'cancelled' || state === 'cancelled' || state === 'refunded') counts.cancelled++;
    });

    const categories = [
      { key: 'pending', label: 'Pendientes', count: counts.pending, color: '#F59E0B', bg: 'bg-amber-500' },
      { key: 'processing', label: 'En Proceso', count: counts.processing, color: '#3B82F6', bg: 'bg-blue-500' },
      { key: 'ready', label: 'Listos', count: counts.ready, color: '#8B5CF6', bg: 'bg-purple-500' },
      { key: 'delivered', label: 'Entregados', count: counts.delivered, color: '#10B981', bg: 'bg-emerald-500' },
      { key: 'cancelled', label: 'Cancelados', count: counts.cancelled, color: '#EF4444', bg: 'bg-red-500' }
    ];

    const maxCount = Math.max(...categories.map(c => c.count), 1);

    return { categories, maxCount };
  }, [orders]);

  // 4. Department Sales ranking
  const departmentData = useMemo(() => {
    const depts = {};
    orders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'refunded') return;
      const dept = o.user_department || "No registrado";
      if (!depts[dept]) {
        depts[dept] = { sales: 0, count: 0 };
      }
      depts[dept].sales += Number(o.total) || 0;
      depts[dept].count += 1;
    });

    const list = Object.entries(depts).map(([name, val]) => ({
      name,
      sales: val.sales,
      count: val.count
    })).sort((a, b) => b.sales - a.sales).slice(0, 5); // top 5

    const maxSales = list.length > 0 ? list[0].sales : 1;

    return { list, maxSales };
  }, [orders]);

  // 5. Payment Methods Distribution
  const paymentData = useMemo(() => {
    let paypalSales = 0;
    let paypalCount = 0;
    let receiptSales = 0;
    let receiptCount = 0;

    orders.forEach(o => {
      if (o.status === 'cancelled' || o.status === 'refunded') return;
      const method = o.payment_method || 'receipt';
      const amt = Number(o.total) || 0;
      if (method === 'paypal') {
        paypalSales += amt;
        paypalCount++;
      } else {
        receiptSales += amt;
        receiptCount++;
      }
    });

    const totalSales = paypalSales + receiptSales || 1;
    const paypalPct = (paypalSales / totalSales) * 100;
    const receiptPct = (receiptSales / totalSales) * 100;

    return [
      { key: 'paypal', label: 'PayPal', sales: paypalSales, count: paypalCount, pct: paypalPct, color: '#2563EB', hoverColor: '#1D4ED8' },
      { key: 'receipt', label: 'Transferencia', sales: receiptSales, count: receiptCount, pct: receiptPct, color: '#14B8A6', hoverColor: '#0F766E' }
    ];
  }, [orders]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Ingresos Netos",
            value: `C$${metrics.netSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            desc: "Pedidos no cancelados",
            icon: DollarSign,
            color: "text-brand-accent bg-brand-accent/5 border-brand-accent/10"
          },
          {
            title: "Ticket Promedio",
            value: `C$${metrics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            desc: "Valor medio por orden",
            icon: TrendingUp,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
          },
          {
            title: "Pedidos Activos",
            value: String(metrics.activeOrders),
            desc: "En cola de fabricación/pago",
            icon: Clock,
            color: "text-blue-600 bg-blue-50 border-blue-100"
          },
          {
            title: "Stock Crítico",
            value: String(metrics.lowStockCount),
            desc: "Productos con stock < 5",
            icon: AlertCircle,
            color: metrics.lowStockCount > 0 ? "text-red-600 bg-red-50 border-red-100 animate-pulse" : "text-gray-500 bg-gray-50 border-gray-100"
          }
        ].map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm bg-white ${m.color}`}
          >
            <div className="space-y-1 text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">{m.title}</span>
              <span className="text-2xl font-serif font-bold text-gray-900 block">{m.value}</span>
              <span className="text-xs text-gray-400 block">{m.desc}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white shadow-sm border border-gray-100">
              <m.icon size={22} className="shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. Visual Charts Row 1: Line & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-accent/10 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-4 border-brand-accent/5">
            <div className="text-left">
              <h3 className="text-lg font-serif font-bold text-gray-900">Tendencia de Ventas Diarias</h3>
              <p className="text-xs text-gray-400">Ingresos netos generados en los últimos 7 días</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-full border border-brand-primary/10">
              <Calendar size={12} /> Última Semana
            </div>
          </div>

          <div className="relative pt-4">
            <svg 
              viewBox={`0 0 ${salesTrend.width} ${salesTrend.height}`}
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A4B3C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1A4B3C" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                const y = salesTrend.paddingY + salesTrend.chartH * r;
                const valueLabel = Math.round(salesTrend.maxSales * (1 - r));
                return (
                  <g key={idx} className="opacity-40">
                    <line 
                      x1={salesTrend.paddingX} 
                      y1={y} 
                      x2={salesTrend.width - salesTrend.paddingX} 
                      y2={y} 
                      stroke="#E5E7EB" 
                      strokeWidth="1" 
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={salesTrend.paddingX - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="text-[9px] fill-gray-400 font-mono"
                    >
                      {valueLabel > 0 ? `C$${valueLabel}` : 'C$0'}
                    </text>
                  </g>
                );
              })}

              {/* Area Path */}
              {salesTrend.points.length > 0 && (
                <path 
                  d={salesTrend.areaPath} 
                  fill="url(#chartGrad)" 
                />
              )}

              {/* Line Path */}
              {salesTrend.points.length > 0 && (
                <path 
                  d={salesTrend.linePath} 
                  fill="none" 
                  stroke="#1A4B3C" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Circles & Hover Hotspots */}
              {salesTrend.points.map((p, idx) => {
                const isHovered = hoveredPoint === idx;
                return (
                  <g key={idx}>
                    {/* Invisible large hover hotspot */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="18" 
                      fill="transparent" 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Visible dots */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={isHovered ? "6" : "4"} 
                      fill={isHovered ? "#DF9F35" : "#1A4B3C"} 
                      stroke="#FFFFFF" 
                      strokeWidth="2"
                      className="transition-all duration-200 pointer-events-none"
                    />
                    {/* X axis labels */}
                    <text 
                      x={p.x} 
                      y={salesTrend.height - 5} 
                      textAnchor="middle" 
                      className="text-[10px] fill-gray-500 font-medium"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Line Tooltip Card */}
            <AnimatePresence>
              {hoveredPoint !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bg-white/95 backdrop-blur-md p-3 rounded-xl border border-brand-accent/20 shadow-lg text-xs space-y-1 text-left"
                  style={{
                    left: `${(salesTrend.points[hoveredPoint].x / salesTrend.width) * 100}%`,
                    top: `10%`,
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <p className="font-bold text-gray-500">{salesTrend.points[hoveredPoint].dateString}</p>
                  <p className="text-sm font-serif font-bold text-brand-primary">
                    Ventas: C${salesTrend.points[hoveredPoint].sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-brand-accent font-medium">
                    {salesTrend.points[hoveredPoint].count} pedidos completados
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Payment Preference Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-brand-accent/10 shadow-sm flex flex-col justify-between">
          <div className="text-left border-b pb-4 border-brand-accent/5">
            <h3 className="text-lg font-serif font-bold text-gray-900">Métodos de Pago</h3>
            <p className="text-xs text-gray-400">Distribución de ingresos por plataforma</p>
          </div>

          <div className="relative flex justify-center items-center py-6">
            <svg viewBox="0 0 160 160" className="w-40 h-40 transform -rotate-90 overflow-visible">
              {/* Inner details */}
              <circle cx="80" cy="80" r="50" fill="#FFFFFF" />

              {/* Slices */}
              {(() => {
                let accumulatedPercent = 0;
                return paymentData.map((d, index) => {
                  const isHovered = hoveredDonut === index;
                  const strokeDash = `${d.pct} ${100 - d.pct}`;
                  const strokeOffset = 100 - accumulatedPercent;
                  accumulatedPercent += d.pct;
                  
                  return (
                    <circle
                      key={d.key}
                      cx="80"
                      cy="80"
                      r="60"
                      fill="transparent"
                      stroke={isHovered ? d.hoverColor : d.color}
                      strokeWidth={isHovered ? "18" : "14"}
                      strokeDasharray={strokeDash}
                      strokeDashoffset={strokeOffset}
                      pathLength="100"
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setHoveredDonut(index)}
                      onMouseLeave={() => setHoveredDonut(null)}
                    />
                  );
                });
              })()}
            </svg>

            {/* Absolute Center Text Label */}
            <div className="absolute text-center pointer-events-none space-y-0.5">
              <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider">Total</span>
              <span className="text-sm font-serif font-bold text-gray-800 block">
                C${(paymentData[0].sales + paymentData[1].sales).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Donut Legend Info */}
          <div className="space-y-2 border-t pt-4 border-brand-accent/5">
            {paymentData.map((d, index) => {
              const isHovered = hoveredDonut === index;
              return (
                <div 
                  key={d.key}
                  onMouseEnter={() => setHoveredDonut(index)}
                  onMouseLeave={() => setHoveredDonut(null)}
                  className={`flex justify-between items-center p-2 rounded-xl border transition-all cursor-pointer ${isHovered ? 'bg-paper border-brand-accent/15 scale-[1.02]' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-bold text-gray-700">{d.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-gray-900 block">C${d.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{d.pct.toFixed(1)}% ({d.count} ord.)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Visual Charts Row 2: Bar & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Volume by Status Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-brand-accent/10 shadow-sm space-y-4">
          <div className="text-left border-b pb-4 border-brand-accent/5">
            <h3 className="text-lg font-serif font-bold text-gray-900">Pedidos por Estado</h3>
            <p className="text-xs text-gray-400">Cantidad de órdenes en cada etapa del proceso</p>
          </div>

          <div className="relative pt-6 min-h-[220px] flex items-end">
            <div className="w-full flex justify-around items-end h-40">
              {statusData.categories.map((c, idx) => {
                const heightPct = (c.count / statusData.maxCount) * 100;
                const isHovered = hoveredBar === idx;
                return (
                  <div 
                    key={c.key} 
                    className="flex flex-col items-center group relative w-1/5"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip on top of bar */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: -10 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute -top-12 bg-gray-900 text-white font-bold text-[10px] px-2 py-1 rounded shadow-md pointer-events-none z-10"
                        >
                          {c.count} Pedido(s)
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar Pillar */}
                    <div className="w-8 md:w-12 bg-gray-100 rounded-t-lg h-32 flex items-end overflow-hidden border border-gray-100 shadow-inner">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ delay: idx * 0.05, type: 'spring', stiffness: 80 }}
                        className={`w-full rounded-t-md cursor-pointer transition-all duration-300 ${c.bg} ${isHovered ? 'brightness-95 scale-x-105' : ''}`}
                      />
                    </div>

                    {/* Label */}
                    <span className="text-[10px] font-bold text-gray-500 mt-2 text-center truncate w-full">
                      {c.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">
                      {c.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Regional Ranking Horizontal Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-brand-accent/10 shadow-sm flex flex-col justify-between">
          <div className="text-left border-b pb-4 border-brand-accent/5">
            <h3 className="text-lg font-serif font-bold text-gray-900">Ventas Regionales (Top 5)</h3>
            <p className="text-xs text-gray-400">Principales departamentos por volumen de facturación</p>
          </div>

          <div className="space-y-4 py-4 flex-1 flex flex-col justify-center">
            {departmentData.list.length === 0 ? (
              <p className="text-center italic text-gray-400 text-sm py-12">No hay datos de ubicación disponibles</p>
            ) : (
              departmentData.list.map((dept, idx) => {
                const widthPct = (dept.sales / departmentData.maxSales) * 100;
                const isHovered = hoveredDept === idx;
                return (
                  <div 
                    key={dept.name}
                    className="space-y-1.5"
                    onMouseEnter={() => setHoveredDept(idx)}
                    onMouseLeave={() => setHoveredDept(null)}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-700 flex items-center gap-1">
                        <MapPin size={12} className="text-brand-accent shrink-0" />
                        {dept.name}
                      </span>
                      <span className="text-gray-900 font-mono">
                        C${dept.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-[10px] text-gray-400 font-normal ml-1">({dept.count} ped.)</span>
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner border border-gray-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ delay: idx * 0.08, type: 'spring', stiffness: 50 }}
                        className={`h-full rounded-full transition-all duration-300 ${isHovered ? 'bg-[#DF9F35]' : 'bg-[#1A4B3C]'}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 4. Strategic Advice Corner */}
      <div className="bg-[#1A4B3C]/5 border border-[#1A4B3C]/10 p-6 rounded-3xl text-left space-y-3">
        <h4 className="font-serif font-bold text-gray-900 text-lg flex items-center gap-2">
          💡 Centro de Decisiones Estratégicas
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          Tus datos indican las siguientes sugerencias tácticas para tu negocio:
        </p>
        <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside pl-1">
          {metrics.lowStockCount > 0 && (
            <li>Tienes <strong className="text-red-600">{metrics.lowStockCount} artículos con stock crítico (bajo 5 unidades)</strong>. Repón existencias para evitar pérdidas de venta.</li>
          )}
          <li>
            El departamento de <strong>{departmentData.list[0]?.name || "N/A"}</strong> es tu mercado líder con mayor facturación. Considera realizar promociones de entrega gratuita o campañas dirigidas ahí.
          </li>
          <li>
            El pago preferido de tus clientes es a través de <strong>{paymentData.sort((a,b) => b.sales - a.sales)[0]?.label}</strong>. Optimiza la validación de estos flujos de cobro para agilizar la producción artesanal.
          </li>
        </ul>
      </div>

    </div>
  );
};
