import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { BusinessProvider } from "./context/BusinessContext";
import "./index.css";
import { enableConsoleBuffer } from "./utils/consoleBuffer";

import { registerSW } from "virtual:pwa-register";

// Registrar Service Worker (VitePWA) con auto-update
registerSW({ immediate: true });

enableConsoleBuffer();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ErrorBoundary>
      <BusinessProvider>
        <App />
      </BusinessProvider>
    </ErrorBoundary>
  </BrowserRouter>
);
