import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { BusinessProvider } from "./context/BusinessContext";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

// Registrar Service Worker (VitePWA) con auto-update
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <BusinessProvider>
      <App />
    </BusinessProvider>
  </BrowserRouter>
);
