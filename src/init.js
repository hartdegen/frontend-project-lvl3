import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import isUrlValid from './urlCheking.js';
import runLocalizationApp from './localizationApp.js';

const renderFeedsList = (feeds) => {
  console.log(111, feeds);
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

  const form = document.querySelector('form');
  const input = form.querySelector('input');
  const submitButton = form.querySelector('button');
  const renderLoadingInfo = (text) => {
    document.querySelector('.loadingInfo').textContent = text;
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'networkErorr':
        submitButton.disabled = false;
        renderLoadingInfo(i18next.t('networkError'));
        break;
      case 'alreadyExists':
        submitButton.disabled = false;
        renderLoadingInfo(i18next.t('alreadyExists'));
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        renderLoadingInfo(i18next.t('finished'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    const urlFromRssList = path.split('approvedRssList.')[1];
    switch (path) {
      case 'typedUrlValid':
        if (value) {
          submitButton.disabled = false;
          input.style.border = null;
        } else {
          submitButton.disabled = false;
          input.style.border = 'thick solid red';
          renderLoadingInfo(i18next.t('notValid'));
        }
        break;

      case `approvedRssList.${urlFromRssList}`:
        if (!_.isEmpty(state.approvedRssList)) {
          const feeds = _.values(state.approvedRssList);
          const posts = _.keys(state.approvedRssList).reduce((acc, url) => {
            const postsFromUrl = _.values(state.approvedRssList[url].posts);
            return [...postsFromUrl, ...acc];
          }, []);

          renderFeedsList(feeds);
          renderPostsList(posts);
        }
        break;

      case 'processState':
        processStateHandler(value);
        break;

      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

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
  const checkRssData = (urlFromInput, oldTimerId, isRssListHasUrl = _.has(state.approvedRssList, urlFromInput)) => {
    console.log('STATE BEGIN', state.processState);

    if (!isRssListHasUrl) {
      makeHttpRequestEvery5Secs(urlFromInput, checkRssData, oldTimerId);
    } else {
      watchedState.typedUrlValid = true;
      watchedState.processState = 'alreadyExists';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.processState = 'sending';
    const urlFromInput = e.target.querySelector('input').value;
    if (!isUrlValid(urlFromInput)) {
      watchedState.typedUrlValid = false;
      watchedState.processState = 'filling';
    } else {
      setTimeout(() => checkRssData(urlFromInput), 1);
    }
  });
};
