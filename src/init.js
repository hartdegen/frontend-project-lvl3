import _ from 'lodash';
import axios from 'axios';
import isUrlValid from './isUrlValid.js';
import watcher from './watcher.js';
import runLocalizationApp from './localizationApp.js';

const renderFeedsList = (feeds) => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = 'Feeds';
  div.appendChild(h2);
  const ul = document.createElement('ul');
  feeds.forEach(({ title, description }) => {
    const h3 = document.createElement('h3');
    const p = document.createElement('p');
    h3.textContent = title;
    p.textContent = description;
    const li = document.createElement('li');
    li.appendChild(h3);
    li.appendChild(p);
    ul.prepend(li);
  });
  div.append(ul);
  const feedsElement = document.querySelector('.feeds');
  feedsElement.innerHTML = div.innerHTML;
};

const renderPostsList = (posts) => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  h2.textContent = 'Posts';
  div.appendChild(h2);
  posts.forEach(({ title, link }) => {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.append(ul);
  const postsElement = document.querySelector('.posts');
  postsElement.innerHTML = div.innerHTML;
};

const renderLoadingStatus = (text) => {
  document.querySelector('.loadingInfo').textContent = text;
};

const functionsOfRendering = { renderFeedsList, renderPostsList, renderLoadingStatus };

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
    processState: 'valid',
    typedUrlValid: null,
    approvedRssList: {},
  };

  const elems = {
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  const watchedState = watcher(state, elems, functionsOfRendering);

  const makeHttpRequestEvery5Secs = (urlFromInput, checkDataFunc, oldTimerId) => {
    const proxy = 'cors-anywhere.herokuapp.com';
    let newTimerId;

    axios.get(`https://${proxy}/${urlFromInput}`)
      .then((obj) => {
        watchedState.approvedRssList[urlFromInput] = parseRssData(obj);
        newTimerId = setTimeout(() => checkDataFunc(urlFromInput, newTimerId, false), 5000);
      })
      .catch((error) => {
        console.log('ERRRRRRRR', error);
        watchedState.processState = 'networkErorr';
        clearTimeout(oldTimerId);
      })
      .finally(() => {
        if (state.processState === 'sending') {
          watchedState.processState = 'finished';
          watchedState.typedUrlValid = true;
        }
        console.log('STATE FINALLY -', state.processState, '- in', new Date().toLocaleTimeString());
        console.log('------------------');
      });
  };

  // eslint-disable-next-line max-len
  const checkForNewRssData = (urlFromInput, oldTimerId, isRssListHasUrl = _.has(state.approvedRssList, urlFromInput)) => {
    console.log('STATE BEGIN', state.processState);

    if (!isRssListHasUrl) {
      makeHttpRequestEvery5Secs(urlFromInput, checkForNewRssData, oldTimerId);
    } else {
      watchedState.typedUrlValid = true;
      watchedState.processState = 'alreadyExists';
    }
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'sending';
    const urlFromInput = e.target.querySelector('input').value;
    if (!isUrlValid(urlFromInput)) {
      watchedState.typedUrlValid = false;
      watchedState.processState = 'filling';
    } else {
      setTimeout(() => checkForNewRssData(urlFromInput), 1);
    }
  });
};
