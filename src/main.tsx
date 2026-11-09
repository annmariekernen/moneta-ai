import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css";
import "./index.css";
import App from "./App.tsx";

// The phone is laid out at the Figma size (402 × 874) and scaled to fit the
// window. On a real phone it fills the screen; in a narrow embed (the
// portfolio) the device frame is dropped but the phone's chrome stays.
const PHONE_W = 402;
const PHONE_H = 874;

// On an actual phone (narrow, and not inside the portfolio's embed), the
// prototype simply fills the screen: no device frame, fake status bar or
// home indicator, since the real phone has its own.
const embedded = window.self !== window.top;

function fit() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const device = w < 500 && !embedded;
  document.documentElement.classList.toggle("is-device", device);
  const bare = w < 500;
  const pad = bare ? 0 : 48;
  const scale = Math.min((w - pad) / PHONE_W, (h - pad) / PHONE_H, bare ? Infinity : 1);
  document.documentElement.style.setProperty("--scale", String(scale));
  document.documentElement.classList.toggle("is-bare", bare);
  // The About card sits to the right of the phone, the two centered as a
  // group, whenever both fit side by side. It narrows (300 down to 220px) to
  // fit smaller windows; below that the pop-up in the app says it instead.
  const room = w - PHONE_W * scale - 40 - 64; // gap + side margins
  const cardW = Math.min(300, room);
  const withCard = !bare && cardW >= 220;
  document.documentElement.classList.toggle("has-card", withCard);
  document.documentElement.style.setProperty("--card-w", `${Math.max(220, cardW)}px`);
}
fit();
window.addEventListener("resize", fit);

// On a real phone, the keyboard covers the bottom of the page and iOS slides
// the page around to keep the field in view. Instead, the app fills only the
// part of the screen above the keyboard (the "visual viewport"), so the chat
// input and bottom sheets sit right on top of it, and the page stays put.
const vv = window.visualViewport;
function fitKeyboard() {
  if (!vv) return;
  const root = document.documentElement;
  root.style.setProperty("--vv-h", `${vv.height}px`);
  root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
  root.classList.toggle("real-kb", vv.height < window.innerHeight - 120);
}
vv?.addEventListener("resize", fitKeyboard);
vv?.addEventListener("scroll", fitKeyboard);
fitKeyboard();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
