import i18next from 'i18next';
import resources from './locales.js';

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    const formTitle = document.querySelector('.formTitle');
    formTitle.innerHTML = i18next.t('formTitle');

    const lead = document.querySelector('.lead');
    lead.innerHTML = i18next.t('lead');

    const button = document.querySelector('button');
    button.innerHTML = i18next.t('button');

    const exampleBlock = document.querySelector('.exampleBlock');
    exampleBlock.innerHTML = i18next.t('exampleBlock');
  }).catch((err) => {
    console.log('something went wrong loading', err);
  });
};
