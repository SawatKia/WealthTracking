import React from 'react';
import { View, Button } from 'react-native';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View>
      <Button title={t('changeLanguage')} onPress={() => changeLanguage(i18n.language === 'en' ? 'th' : 'en')} />
    </View>
  );
}
