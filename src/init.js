import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales.js';
import watcher from './watcher.js';
import { isValid, isIncluded } from './isUrlValid.js';

const parseRssData = (obj) => {
  const url = obj.headers['x-final-url'];
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data, 'text/xml');
  const channel = rssDataDocument.querySelector('channel');
  const items = channel.querySelectorAll('item');
  const posts = [];
  items.forEach((el) => {
    const pubDate = Date.parse(el.querySelector('pubDate').textContent);
    const title = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    posts.push({ pubDate, title, link });
  });
  return {
    feed: {
      url,
      title: channel.querySelector('title').textContent,
      description: channel.querySelector('description').textContent,
    },
    posts: {
      list: posts,
    },
  };
};

const fetchFeeds = (urls, initialState) => {
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  const proxy = 'cors-anywhere.herokuapp.com';
  const rawFeeds = urls.map((url) => axios.get(`https://${proxy}/${url}`)
    .catch((err) => {
      console.log('111 GET RAW FEEDS WITH axios.get PROBLEMS');
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.error = err;
    }));
  return Promise.all(rawFeeds).then((feeds) => feeds.map((obj, index) => {
    const newFeedData = parseRssData(obj);
    newFeedData.feed.id = index;
    newFeedData.posts.feedId = index;
    return newFeedData;
  })).catch((err) => {
    console.log('222 DATA CANT BE PARSED');
    watchedState.loadingProcess.status = 'failed';
    watchedState.loadingProcess.error = err;
  });
};

const updateNews = (feeds, initialState, allExistingFeedsPostsFromWarehouse) => {
  console.log('tries to update', new Date().toLocaleTimeString());
  const data = allExistingFeedsPostsFromWarehouse;
  const watchedState = initialState;
  const promise = Promise.resolve();
  return promise.then(() => {
    feeds.forEach((feedWithPosts, i) => {
      if (!data[i]) {
        data[i] = feedWithPosts;
        watchedState.feeds = [...data.map((value) => value.feed)];
      } else {
        const { posts } = data[i];
        const existingTitles = posts.list.map((post) => post.title);
        const newPostsThatNotIncludedInWarehouse = feedWithPosts.posts.list.filter((post) => {
          const newPosts = !existingTitles.includes(post.title);
          return newPosts;
        });
        posts.list.push(...newPostsThatNotIncludedInWarehouse);
      }
    });
    watchedState.posts = [...data.map((value) => value.posts)];
    watchedState.loadingProcess.status = 'succeed';
  }).catch((err) => {
    console.log('333 updateNews ERROR');
    watchedState.loadingProcess.status = 'failed';
    watchedState.loadingProcess.error = err;
  });
};

export default () => i18next.init({
  lng: 'en',
  debug: true,
  resources,
}).catch((err) => {
  console.log('something went wrong loading');
  throw err;
}).then(() => {
  const formTitle = document.querySelector('.formTitle');
  formTitle.innerHTML = i18next.t('formTitle');
  const lead = document.querySelector('.lead');
  lead.innerHTML = i18next.t('lead');
  const button = document.querySelector('button');
  button.innerHTML = i18next.t('button');
  const exampleBlock = document.querySelector('.exampleBlock');
  exampleBlock.innerHTML = i18next.t('exampleBlock');
}).then(() => {
  const state = {
    loadingProcess: { status: 'idle', error: null },
    form: { status: 'filling', error: null },
    timerId: null,
    feeds: [],
    posts: [],
  };

  const elems = {
    feedsElem: document.querySelector('div.feeds'),
    postsElem: document.querySelector('div.posts'),
    loadingElem: document.querySelector('div.loadingInfo'),
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  let timerId;
  const allFeedsPostsWarehouse = [];
  const watchedState = watcher(state, elems);
  const showNews = (urls, initialState, timeOut) => {
    const promise = Promise.resolve();
    promise.then(() => fetchFeeds(urls, watchedState))
      .then((feeds) => updateNews(feeds, initialState, allFeedsPostsWarehouse))
      .then(() => { timerId = setTimeout(() => showNews(urls, initialState, timeOut), timeOut); });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.querySelector('input').value;
    const urlsList = allFeedsPostsWarehouse.map((val) => val.feed.url);
    const actualUrls = [...urlsList, url];

    if (!isValid(url)) {
      watchedState.form.status = 'urlNotValid'; return;
    }
    if (!isIncluded(url, urlsList)) {
      watchedState.form.status = 'alreadyExists'; return;
    }
    watchedState.timerId = timerId;
    watchedState.form.status = 'submit';

    showNews(actualUrls, watchedState, 10000);
  });
});
