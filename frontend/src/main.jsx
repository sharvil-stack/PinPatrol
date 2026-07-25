import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./utils/fixLeafletIcons";
import { AuthProvider } from "./context/AuthContext";
import "leaflet/dist/leaflet.css";
ReactDOM.createRoot(document.getElementById("root")).render(
 <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
