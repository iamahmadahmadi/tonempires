import React from "react";
import ReactDOM from "react-dom/client";
import { PersistGate } from "redux-persist/integration/react";
import "slick-carousel/slick/slick.css";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import "normalize.css";
import "./index.css";
import App from "./App";
import { DiscountProvider } from "./DiscountContext";

// 1) Define a mapping from each locale to its font‑family stack
const fonts = {
  de: `"Open Sans", sans-serif`,              // supports German umlauts :contentReference[oaicite:2]{index=2}
  en: `"Roboto", sans-serif`,                 // Google’s go‑to English font :contentReference[oaicite:3]{index=3}
  es: `"Lato", sans-serif`,                   // excellent Spanish support :contentReference[oaicite:4]{index=4}
  fr: `"Montserrat", sans-serif`,              // clear French accents :contentReference[oaicite:5]{index=5}
  id: `"Poppins", sans-serif`,                // works for Indonesian :contentReference[oaicite:6]{index=6}
  tr: `"Rubik", sans-serif`,                  // includes Ğ,İ,Ş etc. :contentReference[oaicite:7]{index=7}
  fa: `"Vazirmatn", sans-serif`,              // Persian‑optimized :contentReference[oaicite:8]{index=8}
  ar: `"Cairo", sans-serif`,                  // Arabic‑script Kufi style :contentReference[oaicite:9]{index=9}
  ru: `"PT Sans", sans-serif`,                // pan‑Cyrillic humanist :contentReference[oaicite:10]{index=10}
  hy: `"Noto Sans Armenian", sans-serif`,     // Armenian support :contentReference[oaicite:11]{index=11}
  zh: `"Noto Sans SC", sans-serif`,           // Simplified Chinese :contentReference[oaicite:12]{index=12}
  ja: `"Noto Sans JP", sans-serif`,           // Japanese Hiragana/Kanji :contentReference[oaicite:13]{index=13}
  ko: `"Noto Sans KR", sans-serif`,           // Hangul & Hanja :contentReference[oaicite:14]{index=14}
  hi: `"Noto Sans Devanagari", sans-serif`,   // Devanagari script :contentReference[oaicite:15]{index=15}
  bn: `"Noto Sans Bengali", sans-serif`,      // Bengali script :contentReference[oaicite:16]{index=16}
};

// 2) Pick based on current i18n.language, default to English
var fontFamily = fonts[i18n.language] || fonts.en;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/*
         * Wrap the application in the DiscountProvider so that any
         * component can access the current daily discount.  The provider
         * persists the discount to localStorage, ensuring that a page
         * refresh retains the value until a new secret word is entered.
         */}
        <DiscountProvider>
          <div style={{ fontFamily }}>
            <App />
          </div>
        </DiscountProvider>
      </PersistGate>
    </Provider>
  </I18nextProvider>
);
