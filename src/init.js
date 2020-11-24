import _ from 'lodash';
import axios from 'axios';
import watcher from './watcher.js';
import runLocalizationApp from './localizationApp.js';
import { isUrlValid, isRssListHasUrl } from './isUrlValid.js';

const parseRssData = (dataObj) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(dataObj.data, 'text/xml');
  const channel = rssDataDocument.querySelector('channel');
  const items = channel.querySelectorAll('item');
  const posts = {};

  items.forEach((el) => {
    const pubDate = Date.parse(el.querySelector('pubDate').textContent);
    const title = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    posts[pubDate] = { title, link };
  });

  return {
    title: channel.querySelector('title').textContent,
    description: channel.querySelector('description').textContent,
    posts,
  };
};

export default () => {
  runLocalizationApp();

  const state = {
    loadingState: 'idle',
    approvedRssList: {},
    // при попытках нормализации данных возникало очень много ошибок по рендерингу, состояниям и тд
    // если сейчас выстрою неверную структуру с ошибками в деталях, то перестройки обойдутся дорого
    // ниже набросок, после проверки свяжусь по поводу спорных моментов, чтобы исправить
    rssData: {
      urls: ['url1', 'url2'],

      feeds: [{ id: 'url1', description: '...', title: '...' },
        { id: 'url2', description: '...', title: '...' }],

      posts: [{ id: 'url1', posts: { date1: 'post1', date2: 'post2' } },
        { id: 'url2', posts: { date1: 'post1', date2: 'post2' } }],
    },
  };

  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  const watchedState = watcher(state, elems);

  const makeHttpRequests = (urlFromInput, oldUrls) => {
    const timeOut = 5000;
    const proxy = 'cors-anywhere.herokuapp.com';

    const newUrls = _.keys(state.approvedRssList);
    if (!_.isEqual(oldUrls, newUrls)) return;

    axios.all(newUrls.map((url) => axios.get(`https://${proxy}/${url}`)))
      .then((results) => {
        results.forEach((result, index) => {
          watchedState.approvedRssList[newUrls[index]] = parseRssData(result);
        });
      })
      .then(() => {
        setTimeout(() => makeHttpRequests(urlFromInput, newUrls), timeOut);
        if (state.loadingState === 'loading') watchedState.loadingState = 'succeed';
        console.log('STATE FINALLY -', state.loadingState, '- in', new Date().toLocaleTimeString());
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        console.log('ERR CATCH 2', error); throw error;
      });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.loadingState = 'loading';
    const url = e.target.querySelector('input').value;
    const urlsList = _.keys(state.approvedRssList);

    if (!isUrlValid(url)) {
      watchedState.loadingState = 'urlNotValid';
    } else if (!isRssListHasUrl(url, urlsList)) {
      watchedState.loadingState = 'alreadyExists';
    } else {
      state.approvedRssList[url] = {};
      const urls = _.keys(state.approvedRssList);
      makeHttpRequests(url, urls);
    }
  });
};
