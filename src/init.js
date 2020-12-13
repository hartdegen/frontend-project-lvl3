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
      byDate: posts,
    },
  };
};

const fetchFeeds = (urls, initialState) => {
  const watchedState = initialState;
  const proxy = 'cors-anywhere.herokuapp.com';
  const promises = urls.map((url) => axios.get(`https://${proxy}/${url}`)
    .catch((err) => {
      // тестовый консол.лог лично для меня
      console.log('CHECK 111 PROMISE ERROR');
      watchedState.loadingProcess.error = err;
    }));
  return Promise.all(promises)
    .then((data) => data.map((obj, index) => {
      const newFeedData = parseRssData(obj);
      newFeedData.feed.id = index;
      newFeedData.posts.feedId = index;
      return newFeedData;
    }))
    .catch(() => {
      // тестовый консол.лог лично для меня
      console.log('CHECK 222 PROMISE ERROR');
    });
};

const updateNews = (promise, initialState, allFeedsPosts) => {
  const data = allFeedsPosts;
  const watchedState = initialState;
  promise.then((news) => {
    news.forEach((feedWithPosts, i) => {
      if (!data[i]) {
        data[i] = feedWithPosts;
        watchedState.feeds = [...data.map((value) => value.feed)];
        watchedState.loadingProcess.status = 'succeed';
      } else {
        const { posts } = data[i];
        const prevPosts = _.keyBy(posts.byDate, 'pubDate');
        const newPosts = _.keyBy(feedWithPosts.posts.byDate, 'pubDate');
        const allPosts = _.values({ ...prevPosts, ...newPosts });
        posts.byDate = allPosts;
      }
    });
    watchedState.posts = [...data.map((value) => value.posts)];
  }).catch((err) => {
    watchedState.loadingProcess.status = 'failed';
    watchedState.form.error = err;
  });
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
  const allFeedsPosts = [];
  const watchedState = watcher(state, elems);
  const showNews = (urls, initialState, timeOut) => {
    const promise = Promise.resolve();
    promise.then(() => {
      console.log('tries to update', new Date().toLocaleTimeString());
      const feeds = fetchFeeds(urls, initialState);
      updateNews(feeds, initialState, allFeedsPosts);
    }).then(() => { timerId = setTimeout(() => showNews(urls, initialState, timeOut), timeOut); });
  };

  elems.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = e.target.querySelector('input').value;
    const urlList = allFeedsPosts.reduce((acc, val) => [...acc, val.feed.url], []);
    const actualUrls = [...urlList, url];

    if (!isValid(url)) {
      watchedState.form.status = 'urlNotValid'; return;
    }
    if (!isIncluded(url, urlList)) {
      watchedState.form.status = 'alreadyExists'; return;
    }
    watchedState.timerId = timerId;
    watchedState.loadingProcess.status = 'loading';

    showNews(actualUrls, watchedState, 10000);
  });
});
