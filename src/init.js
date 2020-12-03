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
      error: null,
    },
    form: {
      status: 'filling',
      error: null,
    },
    loadedUrls: [],
    feeds: [],
    posts: [],
  };
  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };
  const watchedState = watcher(state, elems);

  const makeHttpRequests = (urlFromInput, timeout, feedId = _.uniqueId()) => {
    if (!state.loadedUrls.includes(urlFromInput)) state.loadedUrls.push(urlFromInput);
    const proxy = 'cors-anywhere.herokuapp.com';
    let timerId;

    const actualUrls = state.loadedUrls.map((url) => axios.get(`https://${proxy}/${url}`));
    const promise = Promise.all(actualUrls);
    promise.catch((err) => { throw err; })
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
        timerId = setTimeout(() => makeHttpRequests(urlFromInput, timeout, feedId), timeout);
      })
      .catch((error) => {
        clearTimeout(timerId);
        console.log('ERR CATCH', error);
      });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.querySelector('input').value;
    watchedState.form.status = 'loading';
    const listOfLoadedUrls = state.loadedUrls;
    const isValid = isUrlValid(url, listOfLoadedUrls);

    if (!isValid.booleanValue) {
      watchedState.form.status = isValid.stateValue;
      watchedState.form.error = isValid.errorValue;
    }

    try {
      makeHttpRequests(url, 5000);
      watchedState.form.status = 'succeed';
    } catch (err) {
      watchedState.form.status = 'failed';
      throw err;
    }
  });
};
