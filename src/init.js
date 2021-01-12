import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidation from './validation.js';

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

const proxy = 'https://api.allorigins.win/get?url=';

const checkConnection = (url) => axios.get(`${proxy}${url}`)
  .catch(() => { throw new Error('noConnection'); });

const fetchFeeds = (urls, initialState) => {
  console.log('TRY TO GET FEEDS', new Date().toLocaleTimeString());
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  const rawFeeds = urls.map((url) => axios.get(`${proxy}${url}`)
    .catch((e) => {
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.error = e;
    }));
  return Promise.all(rawFeeds)
    .then((feeds) => feeds.map((obj, index) => {
      const newFeedData = parseRssData(obj);
      newFeedData.feed.id = index;
      newFeedData.posts.feedId = index;
      return newFeedData;
    }))
    .catch((e) => {
      watchedState.loadingProcess.status = 'failed';
      watchedState.loadingProcess.error = e;
    });
};

const renderPosts = (feeds, initialState) => {
  const watchedState = initialState;
  return Promise.resolve()
    .then(() => {
      const value = feeds[feeds.length - 1];
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

    const setAutoUpdating = (urls, initialState, timeOut) => Promise.resolve()
      .then(() => (initialState.feeds.length === urls.length ? Promise.resolve()
        : Promise.reject()))
      .then(() => fetchFeeds(urls, initialState))
      .then((feeds) => updatePosts(feeds, initialState))
      .then(() => setTimeout(() => setAutoUpdating(urls, initialState, timeOut), timeOut));

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = e.target.querySelector('input').value;
      const urlsList = watchedState.feeds.map((value) => value.url);
      const actualUrls = [...urlsList, url];

      watchedState.form.status = 'submited';
      Promise.resolve()
        .then(() => checkValidation(url, urlsList))
        .then(() => checkConnection(url))
        .then(() => fetchFeeds(actualUrls, watchedState))
        .then((feeds) => renderPosts(feeds, watchedState))
        .then(() => setTimeout(() => setAutoUpdating(actualUrls, watchedState, 5000)), 5000)
        .catch((err) => { watchedState.form.error = err.message; })
        .then(() => { watchedState.form.status = 'filling'; });
    });
  });
