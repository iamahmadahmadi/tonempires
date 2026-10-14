import React, { useEffect, useState } from "react";
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

const fonts = {
  de: `"Open Sans", sans-serif`,
  en: `"Roboto", sans-serif`,
  es: `"Lato", sans-serif`,
  fr: `"Montserrat", sans-serif`,
  id: `"Poppins", sans-serif`,
  tr: `"Rubik", sans-serif`,
  fa: `"Vazirmatn", sans-serif`,
  ar: `"Cairo", sans-serif`,
  ru: `"PT Sans", sans-serif`,
  hy: `"Noto Sans Armenian", sans-serif`,
  zh: `"Noto Sans SC", sans-serif`,
  ja: `"Noto Sans JP", sans-serif`,
  ko: `"Noto Sans KR", sans-serif`,
  hi: `"Noto Sans Devanagari", sans-serif`,
  bn: `"Noto Sans Bengali", sans-serif`,
};

function LocaleFrame({ children }) {
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (nextLanguage) => setLanguage(nextLanguage);
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, []);

  const normalizedLanguage = language?.split("-")[0] || "en";
  return <div style={{ fontFamily: fonts[normalizedLanguage] || fonts.en }}>{children}</div>;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <DiscountProvider>
          <LocaleFrame>
            <App />
          </LocaleFrame>
        </DiscountProvider>
      </PersistGate>
    </Provider>
  </I18nextProvider>
);
