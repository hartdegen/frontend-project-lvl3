import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/styles.css';
import _ from 'lodash';
import axios from 'axios';
import onChange from 'on-change';
import isUrlValid from './urlCheking.js';

const state = {
  processState: 'filling',
  typedUrlValid: null,
  approvedRssList: {},
  errors: [],
};

const form = document.querySelector('form');
const input = form.querySelector('input');
const submitButton = form.querySelector('button');

const renderFeedsList = () => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = 'Feeds';
  div.appendChild(h2);
  const ul = document.createElement('ul');
  const rssListData = _.values(state.approvedRssList);
  rssListData.forEach(({
    title,
    description,
  }) => {
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
  const lastAddedUrl = urls[urls.length - 1];
  const newestPosts = _.values(state.approvedRssList[lastAddedUrl].posts);
  newestPosts.forEach(({
    title,
    link,
  }) => {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.append(ul);
  const posts = document.querySelector('.posts');
  posts.innerHTML = div.innerHTML;
};

const watchedState = onChange(state, (path, value) => {
  const urlFromRssList = path.split('approvedRssList.')[1];
  switch (path) {
    case 'typedUrlValid':
      if (value) {
        input.style.border = null;
        input.value = '';
      } else {
        input.style.border = 'thick solid red';
      }
      break;
    case `approvedRssList.${urlFromRssList}`:
      if (!_.isEmpty(state.approvedRssList)) {
        renderFeedsList();
        renderPostsList();
      }
      break;
    case 'processState':
      if (value === 'sending') {
        submitButton.disabled = true;
      } else {
        submitButton.disabled = false;
      }
      break;
    default:
      throw new Error('SOMETHINGS WRONG');
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

const checkRssData = (urlFromInput, isRssListUnused = !state.approvedRssList[urlFromInput]) => {
  if (isUrlValid(urlFromInput) && isRssListUnused) {
    let timerId;
    watchedState.typedUrlValid = true;
    const proxy = 'cors-anywhere.herokuapp.com';
    axios.get(`https://${proxy}/${urlFromInput}`)
      .then((obj) => {
        console.log('REPEATING TEST', Math.random());
        parseRssData(obj, urlFromInput);
        timerId = setTimeout(() => checkRssData(urlFromInput, true), 5000);
      })
      .catch((error) => {
        console.log('ERRRRRRRR', error);
        clearTimeout(timerId);
      })
      .finally(() => {
        watchedState.processState = 'filling';
      });
  } else {
    watchedState.typedUrlValid = false;
    watchedState.processState = 'filling';
  }
};
form.addEventListener('submit', (e) => {
  e.preventDefault();
  watchedState.processState = 'sending';
  const urlFromInput = e.target.querySelector('input').value;
  setTimeout(() => checkRssData(urlFromInput), 1);
});
