import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales.js';
import watcher from './watcher.js';
import isUrlValid from './isUrlValid.js';

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
  console.log('something went wrong loading');
  throw err;
});

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
  const state = {
    loadingProcess: {
      status: 'idle',
    },
    form: {
      status: 'filling',
    },
    approvedRssList: {},
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
    let timerId;
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
        if (state.loadingProcess.status === 'loading') watchedState.loadingProcess.status = 'succeed';
        console.log('STATE FINALLY -', state.loadingProcess, '- in', new Date().toLocaleTimeString());
      })
      .catch((error) => {
        clearTimeout(timerId);
        watchedState.loadingProcess.status = 'failed';
        console.log('ERR CATCH 322', error); throw error;
      });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.loadingProcess.status = 'loading';
    const url = e.target.querySelector('input').value;
    const urlsList = _.keys(state.approvedRssList);
    const isValid = isUrlValid(url, urlsList);

    if (!isValid.booleanValue) {
      watchedState.loadingProcess.status = isValid.stateValue;
    } else {
      state.approvedRssList[url] = {};
      const urls = _.keys(state.approvedRssList);
      makeHttpRequests(url, urls);
    }
  });
};
