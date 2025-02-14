import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/app";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
