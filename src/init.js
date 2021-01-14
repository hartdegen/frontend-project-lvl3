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

const setAutoUpdating = (prevUrls, timeOut, initialState) => setTimeout(() => {
  const watchedState = initialState;
  const urls = watchedState.feeds.map((feed) => feed.url);
  if (prevUrls.length !== urls.length) {
    console.log('autoupdating changed, added new url');
    return;
  }
  Promise.resolve()
    .then(() => updateFeeds(urls, watchedState))
    .then((feeds) => updatePosts(feeds, watchedState))
    .then(() => setAutoUpdating(urls, timeOut, watchedState))
    .catch((e) => console.log('somethings wrong with autoupdating', e));
},
timeOut);

export default () => i18next
  .init({
    lng: 'en',
    debug: true,
    resources,
  })
  .then(() => {
    document.querySelector('.formTitle').innerHTML = i18next.t('formTitle');
    document.querySelector('.lead').innerHTML = i18next.t('lead');
    document.querySelector('button').innerHTML = i18next.t('button');
    document.querySelector('.exampleBlock').innerHTML = i18next.t('exampleBlock');
  })
  .then(() => {
    const state = {
      loadingProcess: { status: 'idle', error: null },
      form: { status: 'filling', error: null },
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

    const watchedState = watcher(state, elems);

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = e.target.querySelector('input').value;
      const urls = watchedState.feeds.map((feed) => feed.url);
      watchedState.form.status = 'submited';
      Promise.resolve()
        .then(() => checkValidation(url, urls))
        .then(() => fetchFeed(url, watchedState))
        .then((feed) => renderPosts(feed, watchedState))
        .then(() => setAutoUpdating(urls.concat(url), 5000, watchedState))
        .finally(() => { watchedState.form.status = 'filling'; })
        .catch((err) => { watchedState.form.error = err.message; });
    });
  });
