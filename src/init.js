import axios from 'axios';
import i18next from 'i18next';
import * as _ from 'lodash';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidity from './validation.js';

const parseRssData = (obj) => {
  const { url } = obj.data.status;
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const channel = rssDataDocument.querySelector('rss channel');
  if (channel === null) throw new Error('urlNotValidAsRss');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  return {
    url, title, description, items,
  };
};

const processParsedRssData = (obj) => {
  const {
    url, title, description, items,
  } = obj;
  const posts = [];
  items.forEach((el) => {
    const postTitle = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    const rssLinkAsId = url;
    posts.push({ postTitle, link, rssLinkAsId });
  });
  return { feed: { rssLinkAsId: url, title, description }, posts };
};

const useProxyTo = (url) => new URL(`${'https://hexlet-allorigins.herokuapp.com/get?url='}${url}`);

const updatePosts = (urls, initialState) => {
  console.log(111, urls.length, initialState.feeds.length);
  const watchedState = initialState;
  const promises = urls.map((url, i) => axios.get(useProxyTo(url))
    .then((rssData) => {
      const data = processParsedRssData(parseRssData(rssData));
      const postsInState = _.cloneDeep(watchedState.posts[i]);
      const existingTitles = postsInState.map((post) => post.postTitle);
      const newPosts = _.differenceWith(data.posts, postsInState, _.isEqual)
        .filter((post) => !existingTitles.includes(post.postTitle));
      if (newPosts.length > 0) watchedState.posts[i].unshift(...newPosts);
    })
    .catch((e) => { console.warn(e); }));
  Promise.all(promises).then(() => {
    setTimeout(() => {
      console.log(222, urls.length, watchedState.feeds.length);
      if (urls.length !== watchedState.feeds.length) return;
      updatePosts(urls, watchedState);
    }, 3000);
  });
};

const loadFeed = (urls, initialState) => {
  const watchedState = initialState;
  watchedState.loadingProcess.status = 'loading';
  const lastAddedUrl = urls[urls.length - 1];
  axios.get(useProxyTo(lastAddedUrl))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedRssData(parsedData);
      watchedState.feeds.unshift(data.feed);
      watchedState.posts.unshift(data.posts);
      watchedState.loadingProcess.status = 'succeed';
      setTimeout(() => { updatePosts(urls, watchedState); }, 3000);
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
  });
