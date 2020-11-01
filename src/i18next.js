import i18next from 'i18next';

const runApp = () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: {
      ru: {
        translation: {
          formTitle: `RSS Reader`,
          lead: `Start reading RSS today! It is easy, it is nicely.`,
          button: `Add`,
          exampleBlock: `Example: https://news.yandex.ru/auto.rss`,
        },
      },
    },
  });
};

runApp();

const formTitle = document.querySelector(`.formTitle`);
formTitle.innerHTML = i18next.t('formTitle');

const lead = document.querySelector(`.lead`);
lead.innerHTML = i18next.t('lead');

const button = document.querySelector(`button`);
button.innerHTML = i18next.t('button');

const exampleBlock = document.querySelector(`.exampleBlock`);
exampleBlock.innerHTML = i18next.t('exampleBlock');