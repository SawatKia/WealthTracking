import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import th from './translations/th';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th }
    },
    lng: 'en', // ภาษาเริ่มต้น
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

// // Example Inside to use your Profile component ฟังก์ชั่น
// const { t, i18n } = useTranslation();
// const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

// const toggleLanguage = () => {
//   const newLang = currentLanguage === 'en' ? 'th' : 'en';
//   i18n.changeLanguage(newLang);
//   setCurrentLanguage(newLang);
// };

// // The language switch button in โปรไฟล์
// <TouchableOpacity
//   style={styles.languageButton}
//   onPress={toggleLanguage}
// >
//   <Text style={styles.languageButtonText}>
//     {currentLanguage === 'en' ? 'TH' : 'EN'}
//   </Text>
// </TouchableOpacity>

// ทำแบบนี้แล้วใหทุกคนดึงไปใช้แบบตัวอย่าง ดีสุดแล้ว(แปลรอบคลุมไม่ตกหล่น) แก้ของไฟล์ตัวเองเพราะครอบไว้ให้หมดแล้ว ถ้าทำเป็นkeyแล้วให้ทุกคนดึงไปใช้มันลำบากกว่า
// // Example of using translations
// วิธีคือ ดึงอิมพอต > const > คลุม {t('xxxxxxxxx')} ง่ายสุดแล้ว 
// <Text style={styles.label}>{t('profile.username')}</Text>
// <Text style={styles.label}>{t('profile.email')}</Text>
// <Text style={styles.label}>{t('profile.password')}</Text>

// Button Styles
// const styles = StyleSheet.create({
//   languageButton: {
//     position: 'absolute',
//     right: 20,
//     top: 20,
//     backgroundColor: '#4957AA',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   languageButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
// });

// ตกแต่งสวิตซ์บนหน้าโปรไฟล์





