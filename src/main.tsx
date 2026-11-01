import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { publishDailySnapshot, registerSW, startScheduler } from "./lib/notify";
import { startCloud } from "./lib/cloud";
import { onChange } from "./state/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW();
startScheduler();
publishDailySnapshot();
onChange(() => publishDailySnapshot());
startCloud().catch(() => undefined);
