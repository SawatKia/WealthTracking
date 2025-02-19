import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      change_language: "Change Language",
      profile_title: "Profile",
    },
  },
  th: {
    translation: {
      change_language: "เปลี่ยนภาษา",
      profile_title: "โปรไฟล์",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", 
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
