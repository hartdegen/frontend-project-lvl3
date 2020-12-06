import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales.js';
import watcher from './watcher.js';
import isValidUrl from './isUrlValid.js';

const parseRssData = (obj, index) => {
  const url = obj.headers['x-final-url'];
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data, 'text/xml');
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
      id: index,
      url,
      title: channel.querySelector('title').textContent,
      description: channel.querySelector('description').textContent,
    },
    posts: {
      feedId: index,
      byDate: posts,
    },
  };
};

const downloadNewsfeed = (urls, initialState) => {
  const watchedState = initialState;
  const proxy = 'cors-anywhere.herokuapp.com';
  const promises = urls.map((url) => axios.get(`https://${proxy}/${url}`));
  return Promise.all(promises).catch((err) => { watchedState.loadingProcess.error = err; })
    .then((data) => data.map((obj, i) => parseRssData(obj, i)));
};

let timerId;
const allFeedsPosts = [];
const updatePosts = (promise, initialState) => {
  const watchedState = initialState;
  promise.then((news) => {
    console.log(33333, news);
    news.forEach((feedPost, i) => {
      console.log(44444, feedPost);
      // console.log(44444, allFeedsPosts[i]);
      if (!allFeedsPosts[i]) {
        allFeedsPosts[i] = feedPost;
        watchedState.form.status = 'succeed';
      } else {
        const { posts } = allFeedsPosts[i];
        posts.byDate = { ...posts.byDate, ...feedPost.posts.byDate };
      }
    });
    console.log(55555, allFeedsPosts)
    watchedState.feeds = [...allFeedsPosts.map((value) => value.feeds)];
    watchedState.posts = [...allFeedsPosts.map((value) => value.posts)];
  }).catch((err) => {
    clearTimeout(timerId);
    watchedState.form.status = 'failed';
    watchedState.form.error = err;
  });
};

const renderNews = (watchedState, timeOut, urls) => {
  console.log('TRY', new Date().toLocaleTimeString());
  const promise = downloadNewsfeed(urls, watchedState);
  updatePosts(promise, watchedState);
  timerId = setTimeout(() => renderNews(watchedState, timeOut, urls), timeOut);
};

export default () => i18next.init({
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
}).then(() => {
  const state = {
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    form: {
      status: 'filling',
      error: null,
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

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.querySelector('input').value;
    const urlList = allFeedsPosts.reduce((acc, val) => [...acc, val.feeds.url], []);
    console.log(11111, urlList);

    if (!isValidUrl(url, urlList, watchedState)) return;
    watchedState.form.status = 'loading';
    clearTimeout(timerId);
    const fullUrlsList = [...urlList, url];
    console.log(22222, fullUrlsList);
    renderNews(watchedState, 10000, fullUrlsList);
  });
});
