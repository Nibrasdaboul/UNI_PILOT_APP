import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "aos/dist/aos.css";
import "./index.css";

const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn && typeof window !== "undefined") {
  import(/* @vite-ignore */ "@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        environment: import.meta.env.MODE,
      });
    })
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
