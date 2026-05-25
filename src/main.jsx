import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Control de versiones y limpieza de caché automática al iniciar
try {
  const localVersion = localStorage.getItem("app_version");
  const currentVersion = __APP_VERSION__;

  if (localVersion && localVersion !== currentVersion) {
    console.log("Nueva versión del sistema detectada. Limpiando caché y recargando...");
    
    // Limpiar caches de activos del navegador
    if ("caches" in window) {
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    
    // Desregistrar cualquier service worker para evitar assets obsoletos
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    localStorage.setItem("app_version", currentVersion);
    
    // Forzar recarga dura del navegador
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  } else {
    localStorage.setItem("app_version", currentVersion);
  }
} catch (e) {
  console.error("Error en verificación de versión:", e);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
