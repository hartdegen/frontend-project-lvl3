import _ from 'lodash';
import axios from 'axios';
import isUrlValid from './isUrlValid.js';
import watcher from './watcher.js';
import runLocalizationApp from './localizationApp.js';

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
    typedUrlValid: true,
    approvedRssList: {},
  };

  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  const watchedState = watcher(state, elems);

  const makeRepeatingHttpRequest = (urlFromInput, checkDataFunc, oldTimerId) => {
    const proxy = 'cors-anywhere.herokuapp.com';
    let newTimerId;
    const timeOut = 5000;

    axios.get(`https://${proxy}/${urlFromInput}`)
      .then((obj) => {
        watchedState.approvedRssList[urlFromInput] = parseRssData(obj);
        newTimerId = setTimeout(() => checkDataFunc(urlFromInput, newTimerId, false), timeOut);
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        clearTimeout(oldTimerId);
        console.log('ERRRRRRRR', error); throw error;
      })
      .finally(() => {
        if (state.loadingState === 'sending') {
          watchedState.loadingState = 'succeed';
          watchedState.typedUrlValid = true;
        }
        console.log('STATE FINALLY -', state.loadingState, '- in', new Date().toLocaleTimeString());
      });
  };

  // eslint-disable-next-line max-len
  const checkForNewRssData = (urlFromInput, oldTimerId, isRssListHasUrl = _.has(state.approvedRssList, urlFromInput)) => {
    console.log('STATE BEGIN', state.loadingState);

    if (!isRssListHasUrl) {
      makeRepeatingHttpRequest(urlFromInput, checkForNewRssData, oldTimerId);
    } else {
      watchedState.typedUrlValid = true;
      watchedState.loadingState = 'alreadyExists';
    }
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.loadingState = 'sending';
    const urlFromInput = e.target.querySelector('input').value;
    if (!isUrlValid(urlFromInput)) {
      watchedState.typedUrlValid = false;
      watchedState.loadingState = 'idle';
    } else {
      setTimeout(() => checkForNewRssData(urlFromInput), 1);
    }
  });
};
