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

  const makeRepeatingHttpRequest = (urlFromInput, oldTimerId = null) => {
    clearTimeout(oldTimerId);
    let newTimerId;
    const timeOut = 5000;
    const proxy = 'cors-anywhere.herokuapp.com';
    state.approvedRssList[urlFromInput] = {};
    const urls = _.keys(state.approvedRssList);

    axios.all(urls.map((url) => axios.get(`https://${proxy}/${url}`)))
      .then((results) => {
        results.forEach((res, i) => { watchedState.approvedRssList[urls[i]] = parseRssData(res); });
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        console.log('ERR CATCH', error); throw error;
      })
      .finally(() => {
        newTimerId = setTimeout(() => makeRepeatingHttpRequest(urlFromInput, newTimerId), timeOut);
        if (state.loadingState === 'sending') watchedState.loadingState = 'succeed';
        console.log('STATE FINALLY -', state.loadingState, '- in', new Date().toLocaleTimeString());
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        console.log('ERR CATCH', error); throw error;
      });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.loadingState = 'sending';
    const url = e.target.querySelector('input').value;
    const urlsList = _.keys(state.approvedRssList);

    if (!isUrlValid(url)) {
      watchedState.loadingState = 'urlNotValid';
    } else if (!isRssListHasUrl(url, urlsList)) {
      watchedState.loadingState = 'alreadyExists';
    } else {
      makeRepeatingHttpRequest(url);
    }
  });
};
