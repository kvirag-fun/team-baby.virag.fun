import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { startViewportSettle } from "./lib/viewportSettle";
import "./index.css";

// Before the first render, not in an effect: effects run after paint, so the
// bottom bar was painted in the wrong place and then seen jumping into the
// right one.
startViewportSettle();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
