import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/styles.css';
import _ from 'lodash';
import axios from 'axios';
import onChange from 'on-change';
import i18next from 'i18next';
import runLocalizationApp from './i18next.js';
import isUrlValid from './urlCheking.js';

const state = {
  processState: 'valid',
  typedUrlValid: null,
  approvedRssList: {},
  errors: [],
};

const form = document.querySelector('form');
const input = form.querySelector('input');
const submitButton = form.querySelector('button');
const renderLoadingInfo = (text) => {
  document.querySelector('.loadingInfo').textContent = text;
};

const renderFeedsList = () => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = 'Feeds';
  div.appendChild(h2);
  const ul = document.createElement('ul');
  const rssListData = _.values(state.approvedRssList);
  rssListData.forEach(({ title, description }) => {
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
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = div.innerHTML;
};

const renderPostsList = () => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  h2.textContent = 'Posts';
  div.appendChild(h2);
  const urls = _.keys(state.approvedRssList);
  const posts = urls.reduce((acc, url) => {
    const postsFromUrl = _.values(state.approvedRssList[url].posts);
    return [...postsFromUrl, ...acc];
  }, []);
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

const processStateHandler = (processState) => {
  switch (processState) {
    case 'networkErorr':
      submitButton.disabled = false;
      renderLoadingInfo(i18next.t('networkErrorMessage'));
      break;
    case 'alreadyExists':
      submitButton.disabled = false;
      renderLoadingInfo(i18next.t('alreadyExistsMessage'));
      break;
    case 'filling':
      submitButton.disabled = false;
      break;
    case 'sending':
      submitButton.disabled = true;
      break;
    case 'finished':
      submitButton.disabled = false;
      renderLoadingInfo(i18next.t('finishedMessage'));
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
        renderLoadingInfo('Must be valid url');
      }
      break;
    case `approvedRssList.${urlFromRssList}`:
      if (!_.isEmpty(state.approvedRssList)) {
        renderFeedsList();
        renderPostsList();
      }
      break;
    case 'processState':
      processStateHandler(value);
      break;
    default:
      throw new Error(`Unknown path: ${path}`);
  }
});

const parseRssData = (dataObj, urlFromInput) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(dataObj.data, 'text/xml');
  const channel = rssDataDocument.querySelector('channel');
  const items = channel.querySelectorAll('item');
  const posts = {};

  items.forEach((el) => {
    const pubDate = Date.parse(el.querySelector('pubDate').textContent);
    const title = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    posts[pubDate] = {
      title,
      link,
    };
  });

  watchedState.approvedRssList[urlFromInput] = {
    title: channel.querySelector('title').textContent,
    description: channel.querySelector('description').textContent,
    posts,
  };
};

// eslint-disable-next-line max-len
const checkRssData = (urlFromInput, timerId, isRssListHasUrl = _.has(state.approvedRssList, urlFromInput)) => {
  console.log('STATE BEGIN', state.processState);
  let timeId;

  if (!isRssListHasUrl) {
    const proxy = 'cors-anywhere.herokuapp.com';
    axios.get(`https://${proxy}/${urlFromInput}`)
      .then((obj) => {
        parseRssData(obj, urlFromInput);
        timeId = setTimeout(() => checkRssData(urlFromInput, timeId, false), 5000);
      })
      .catch((error) => {
        console.log('ERRRRRRRR', error);
        watchedState.processState = 'networkErorr';
        clearTimeout(timerId);
      })
      .finally(() => {
        if (state.processState === 'sending') {
          watchedState.processState = 'finished';
          watchedState.typedUrlValid = true;
        }
        console.log('STATE FINALLY', state.processState);
        console.log('------------------');
      });
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

runLocalizationApp();
const formTitle = document.querySelector('.formTitle');
formTitle.innerHTML = i18next.t('formTitle');

const lead = document.querySelector('.lead');
lead.innerHTML = i18next.t('lead');

const button = document.querySelector('button');
button.innerHTML = i18next.t('button');

const exampleBlock = document.querySelector('.exampleBlock');
exampleBlock.innerHTML = i18next.t('exampleBlock');
