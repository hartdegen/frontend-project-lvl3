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
    approvedRssList: {},
    // rssData: {
    //   urls: [],
    //   feeds: [],
    //   posts: [],
    // },
  };

  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  const watchedState = watcher(state, elems);

  const makeRepeatingHttpRequest = (urlFromInput, oldTimerId = null) => {
    console.log(11111, oldTimerId);
    clearTimeout(oldTimerId);
    const proxy = 'cors-anywhere.herokuapp.com';
    const timeOut = 5000;
    let newTimerId;
    state.approvedRssList[urlFromInput] = {};
    const urls = _.keys(state.approvedRssList);

    axios.all(urls.map((url) => axios.get(`https://${proxy}/${url}`)))
      .then((results) => {
        results.forEach((res, i) => { watchedState.approvedRssList[urls[i]] = parseRssData(res); });
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        console.log('ERR CATCH № 1', error); throw error;
      })
      .finally(() => {
        newTimerId = setTimeout(() => makeRepeatingHttpRequest(urlFromInput, newTimerId), timeOut);
        if (state.loadingState === 'sending') {
          watchedState.loadingState = 'succeed';
        }
        console.log('STATE FINALLY -', state.loadingState, '- in', new Date().toLocaleTimeString());
      })
      .catch((error) => {
        watchedState.loadingState = 'failed';
        clearTimeout(newTimerId);
        console.log('ERR CATCH № 2', error); throw error;
      });
  };

  const hasUrl = (url) => _.has(state.approvedRssList, url);
  const checkRssData = (urlFromInput, isRssListHasUrl = hasUrl(urlFromInput)) => {
    if (!isRssListHasUrl) {
      makeRepeatingHttpRequest(urlFromInput);
    } else {
      watchedState.loadingState = 'alreadyExists';
    }
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.loadingState = 'sending';
    const urlFromInput = e.target.querySelector('input').value;
    if (!isUrlValid(urlFromInput)) {
      watchedState.loadingState = 'urlNotValid';
    } else {
      checkRssData(urlFromInput);
    }
  });
};
