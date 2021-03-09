import * as _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidity from './validation.js';

const parseRssData = (obj) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const channel = rssDataDocument.querySelector('rss channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  const rawPosts = [];
  items.forEach((el) => {
    const postTitle = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    rawPosts.push({ postTitle, link });
  });
  return { title, description, rawPosts };
};

const processParsedData = (obj, url) => {
  const { title, description, rawPosts } = obj;
  const rssLinkAsId = url;
  const posts = rawPosts.map((post) => ({ ...post, rssLinkAsId }));
  return { feed: { rssLinkAsId, title, description }, posts };
};

const useProxyTo = (url) => {
  const processedByProxy = new URL('https://hexlet-allorigins.herokuapp.com/get?');
  processedByProxy.searchParams.set('url', url);
  return processedByProxy;
};

const updateFeeds = (initialState) => {
  const watchedState = initialState;
  const urls = watchedState.feeds.map((feed) => feed.rssLinkAsId);
  const postsInState = _.cloneDeep(watchedState.posts);
  const promises = urls.map((url) => axios.get(useProxyTo(url))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedData(parsedData, url);
      const existingTitles = postsInState.map((post) => post.postTitle);
      const newPosts = _.differenceWith(data.posts, postsInState, _.isEqual)
        .filter((post) => !existingTitles.includes(post.postTitle));
      watchedState.posts.unshift(...newPosts);
    })
    .catch((e) => { console.warn(e); }));
  Promise.all(promises).then(() => { setTimeout(() => updateFeeds(watchedState), 5000); });
};

const loadFeed = (urls, initialState) => {
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  const lastAddedUrl = urls[urls.length - 1];
  axios.get(useProxyTo(lastAddedUrl))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedData(parsedData, lastAddedUrl);
      watchedState.feeds.unshift(data.feed);
      watchedState.posts.unshift(...data.posts);
      watchedState.loadingProcess.status = 'succeed';
    })
    .catch((err) => { watchedState.loadingProcess = { status: 'failed', error: err }; })
    .finally(() => { watchedState.form.status = 'filling'; });
};

export default () => i18next
  .init({
    lng: 'en',
    debug: true,
    resources,
  })
  .then(() => {
    const state = {
      appStatus: 'init',
      loadingProcess: { status: 'idle', error: null },
      form: { status: 'filling', error: null },
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
    watchedState.appStatus = 'initiated';

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.form.status = 'submited';
      const formData = new FormData(e.target);
      const entredUrl = formData.get('url');
      const urlsFromState = watchedState.feeds.map((feed) => feed.rssLinkAsId);

      try {
        checkValidity(entredUrl, urlsFromState);
      } catch (err) {
        watchedState.form = { status: 'filling', error: err };
        return;
      }

      const validUrls = [...urlsFromState, entredUrl];
      loadFeed(validUrls, watchedState);
    });

    updateFeeds(watchedState);
  });
