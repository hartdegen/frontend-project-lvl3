import _ from 'lodash';
// import axios from 'axios';
import i18next from 'i18next';
import resources from './locales.js';
import watcher from './watcher.js';
import checkValidity from './isUrlValid.js';

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
  const { url } = dataObj.status;
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(dataObj.contents, 'text/xml');
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
      byDate: posts,
    },
  };
};

const downloadNewsfeed = (urls) => {
  const promises = urls.map((url) => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Network response was not ok.');
    }));
  return Promise.all(promises).catch((err) => { throw err; })
    .then((data) => data.map((obj, i) => parseRssData(obj, i)));
};

const allFeedsPosts = [];
const updatePosts = (promise, initialState) => {
  const watchedState = initialState;
  promise.then((news) => {
    news.forEach((feedPost, i) => {
      allFeedsPosts[i] = { ...allFeedsPosts[i], ...feedPost };
    });
    console.log('ALL POSTS', allFeedsPosts);
    watchedState.feeds = [...allFeedsPosts.map((x) => x.feeds)];
    watchedState.posts = [...allFeedsPosts.map((x) => x.posts)];
  });
};
//   .then(() => {
//     timerId = setTimeout(() => updatePosts(urlFromInput, timeout, feedId), timeout);
//   })
//   .catch((error) => {
//     clearTimeout(timerId);
//     console.log('ERR CATCH', error);
//   });

const renderNews = (url, watchedState) => {
  const urls = allFeedsPosts.reduce((acc, post) => [...acc, post.feeds.url], [url]);
  console.log('URLS', urls);
  const promise = downloadNewsfeed(urls);
  updatePosts(promise, watchedState);
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
    // watchedState.form.status = 'loading';
    checkValidity(url, watchedState);

    try {
      renderNews(url, watchedState);
    } catch (err) {
      watchedState.form.status = 'failed';
      throw err;
    }
  });
};
