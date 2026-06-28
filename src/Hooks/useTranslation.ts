import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  const currentLanguage = i18n.language;
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    i18n,
  };
};

export default useTranslation;
