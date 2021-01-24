import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidation from './validation.js';

const parseRawRssData = (obj) => {
  const { url } = obj.data.status;
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const channel = rssDataDocument.querySelector('channel');
  if (channel === null) throw new Error('Incorrect Rss');
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

const setIdToFeed = (feed, id) => {
  const data = feed;
  data.feed.id = id;
  data.posts.feedId = id;
  return data;
};

const proxy = 'https://api.allorigins.win/get?url=';
let feedId = 0;

const fetchFeed = (url, initialState) => {
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  return axios.get(`${proxy}${url}`)
    .then((raw) => parseRawRssData(raw))
    .then((feed) => {
      const feedWithId = setIdToFeed(feed, feedId);
      feedId += 1;
      return feedWithId;
    })
    .catch((e) => {
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.error = e;
      if (e.message === 'Network Error') throw new Error('noConnection');
      if (e.message === 'Incorrect Rss') throw new Error('urlNotValidAsRss');
    });
};

const renderPosts = (feed, initialState) => {
  const watchedState = initialState;
  return Promise.resolve()
    .then(() => {
      const value = feed;
      watchedState.feeds.push(value.feed);
      watchedState.posts.push(value.posts);
      watchedState.loadingProcess.status = 'succeed';
      watchedState.form.status = 'succeed';
    })
    .catch((e) => {
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.error = e;
    });
};

const updateFeeds = (urls, initialState) => {
  const watchedState = initialState;
  const RawRssData = urls.map((url) => axios.get(`${proxy}${url}`)
    .catch((e) => { watchedState.loadingProcess.error = e; }));
  return Promise.all(RawRssData)
    .then((raw) => raw.map(parseRawRssData))
    .then((feeds) => feeds.map((feed, i) => setIdToFeed(feed, i)))
    .catch((e) => { watchedState.loadingProcess.error = e; });
};

const updatePosts = (feeds, initialState) => {
  const watchedState = initialState;
  return Promise.resolve()
    .then(() => {
      feeds.forEach((feed, i) => {
        const posts = watchedState.posts[i];
        const existingTitles = posts.list.map((post) => post.title);
        const newPosts = feed.posts.list.filter((post) => !existingTitles.includes(post.title));
        if (newPosts.length > 0) {
          watchedState.posts = [...watchedState.posts.map((value, index) => {
            if (i === index) {
              const updatedValue = value;
              updatedValue.list.push(...newPosts);
              return updatedValue;
            }
            return value;
          })];
        }
      });
    })
    .catch((e) => { watchedState.loadingProcess.error = e; });
};

const setAutoUpdating = (timeOut, initialState) => {
  const watchedState = initialState;
  watchedState.timerId = setTimeout(() => {
    const urls = watchedState.feeds.map((feed) => feed.url);
    Promise.resolve()
      .then(() => updateFeeds(urls, watchedState))
      .then((feeds) => updatePosts(feeds, watchedState))
      .then(() => setAutoUpdating(timeOut, watchedState))
      .catch((e) => console.log('somethings wrong with autoupdating', e));
  },
  timeOut);
};

export default () => i18next
  .init({
    lng: 'en',
    debug: true,
    resources,
  })
  .then(() => {
    const state = {
      loadingProcess: { status: 'idle', error: null },
      form: { status: 'filling', error: null },
      timerId: null,
      feeds: [],
      posts: [],
    };

    const elems = {
      form: document.querySelector('form'),
      formTitle: document.querySelector('.formTitle'),
      lead: document.querySelector('.lead'),
      input: document.querySelector('.inputField'),
      exampleBlock: document.querySelector('.exampleBlock'),
      loadingInfo: document.querySelector('.loadingInfo'),
      submitButton: document.querySelector('.submitButton'),
      feedsElem: document.querySelector('.feeds'),
      postsElem: document.querySelector('.posts'),
    };

    const watchedState = watcher(state, elems);
    watchedState.form.status = 'renderFormParts';

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = e.target.querySelector('input').value;
      const urls = watchedState.feeds.map((feed) => feed.url);
      watchedState.form.status = 'submited';
      Promise.resolve()
        .then(() => checkValidation(url, urls))
        .then(() => fetchFeed(url, watchedState))
        .then((feed) => renderPosts(feed, watchedState))
        .then(() => clearTimeout(watchedState.timerId))
        .then(() => setAutoUpdating(5000, watchedState))
        .finally(() => { watchedState.form.status = 'filling'; })
        .catch((err) => { watchedState.form.error = err.message; });
    });
  });
