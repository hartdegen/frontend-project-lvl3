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

const parseRssData = (dataObj, id) => {
  const url = dataObj.headers['x-final-url'];
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
    feeds: {
      id,
      url,
      title: channel.querySelector('title').textContent,
      description: channel.querySelector('description').textContent,
    },
    posts: {
      feedId: id,
      postsList: posts,
    },
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
    urls: [],
    feeds: [],
    posts: [],
  };
  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };
  const watchedState = watcher(state, elems);

  const makeHttpRequests = (urlFromInput, timeout, timerId = null, feedId = _.uniqueId()) => {
    if (!state.urls.includes(urlFromInput)) state.urls.push(urlFromInput);
    const proxy = 'cors-anywhere.herokuapp.com';
    let timeId;
    const actualUrls = state.urls.map((url) => axios.get(`https://${proxy}/${url}`));
    const promise = Promise.all(actualUrls);
    promise
      .catch((err) => { throw err; })
      .then((urls) => {
        urls.forEach((url, i) => {
          const data = parseRssData(url, feedId);
          if (_.isEmpty(state.posts[i])) {
            state.posts[i] = data.posts;
            state.feeds[i] = data.feeds;
          } else if (!_.isEqual(state.posts[i], data.posts)) {
            state.posts[i].postsList = { ...state.posts[i].postsList, ...data.posts.postsList };
          }
        });
      })
      .then(() => {
        watchedState.feeds = [...state.feeds];
        watchedState.posts = [...state.posts];
      })
      .then(() => {
        timeId = setTimeout(() => makeHttpRequests(urlFromInput, timeout, timeId, feedId), timeout);
        watchedState.loadingProcess.status = 'succeed';
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
    const url = e.target.querySelector('input').value;
    watchedState.loadingProcess.status = 'loading';
    const listOfLoadedUrls = state.urls;
    const isValid = isUrlValid(url, listOfLoadedUrls);
    if (!isValid.booleanValue) {
      watchedState.loadingProcess.status = isValid.stateValue;
    } else {
      makeHttpRequests(url, 5000);
    }
  });
};
