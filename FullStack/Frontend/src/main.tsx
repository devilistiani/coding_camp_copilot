import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

// Entry point aplikasi — mount React ke div#root di index.html
createRoot(document.getElementById("root")!).render(<App />);
