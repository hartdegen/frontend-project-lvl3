import axios from 'axios';
import i18next from 'i18next';
import resources from './locales.js';
import watcher from './watcher.js';
import isNotValid from './validation.js';

const parseRssData = (obj) => {
  const { url } = obj.data.status;
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
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
  console.log('TRY GET FEEDS', new Date().toLocaleTimeString());
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  const proxy = 'https://api.allorigins.win/get?url=';
  const rawFeeds = urls.map((url) => axios.get(`${proxy}${url}`)
    .catch((e) => {
      console.log(11111, 'AXIOS GET PROBLEM', e);
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.errors.push(e);
    }));
  return Promise.all(rawFeeds).then((feeds) => feeds.map((obj, index) => {
    const newFeedData = parseRssData(obj);
    newFeedData.feed.id = index;
    newFeedData.posts.feedId = index;
    return newFeedData;
  })).catch((e) => {
    console.log(22222, 'PARSE PROBLEM', e);
    watchedState.loadingProcess.status = 'failed';
    watchedState.loadingProcess.errors.push(e);
  });
};

const updateNews = (feeds, initialState, allExistingFeedsPostsFromWarehouse) => {
  const data = allExistingFeedsPostsFromWarehouse;
  const watchedState = initialState;
  const promise = Promise.resolve();
  return promise.then(() => {
    feeds.forEach((feed, i) => {
      if (!data[i]) {
        data[i] = feed;
        watchedState.feeds = [...data.map((value) => value.feed)];
      } else {
        const { posts } = data[i];
        const existingTitles = posts.list.map((post) => post.title);
        const newPosts = feed.posts.list.filter((post) => !existingTitles.includes(post.title));
        posts.list.push(...newPosts);
      }
    });
    watchedState.posts = [...data.map((value) => value.posts)];
  }).catch((e) => {
    console.log(33333, 'UPDATING PROBLEM', e);
    watchedState.loadingProcess.status = 'failed';
    watchedState.loadingProcess.errors.push(e);
  });
};

export default () => i18next.init({
  lng: 'en',
  debug: true,
  resources,
}).catch((err) => {
  console.log('something went wrong with i18next.init');
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
    loadingProcess: { status: 'idle', errors: [] },
    form: { status: 'filling', errors: [] },
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
    return promise.then(() => fetchFeeds(urls, watchedState))
      .then((feeds) => updateNews(feeds, initialState, allFeedsPostsWarehouse))
      .finally(() => {
        timerId = setTimeout(() => showNews(urls, initialState, timeOut), timeOut);
      });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.querySelector('input').value;
    const urlsList = allFeedsPostsWarehouse.map((val) => val.feed.url);
    const actualUrls = [...urlsList, url];
    if (isNotValid(url, urlsList, watchedState)) return;
    if (!navigator.onLine) {
      watchedState.form.error = 'noConnection';
      return;
    }
    watchedState.timerId = timerId;
    watchedState.form.status = 'submited';
    showNews(actualUrls, watchedState, 10000)
      .then(() => {
        watchedState.loadingProcess.status = 'succeed';
      })
      .catch((err) => {
        watchedState.loadingProcess.status = 'failed';
        watchedState.loadingProcess.errors.push(err);
      });
  });
});
