import * as _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales/ru';
import validate from './validation.js';

const parseRssData = (obj) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const parserError = rssDataDocument.querySelector('parsererror');
  if (parserError) {
    const errorText = parserError.querySelector('div').textContent;
    const error = new Error(errorText);
    error.type = 'parse';
    throw error;
  }
  const channel = rssDataDocument.querySelector('rss channel');
  const channelTitle = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const rawItems = channel.querySelectorAll('item');
  const items = [...rawItems].map((rawItem) => {
    const title = rawItem.querySelector('title').textContent;
    const link = rawItem.querySelector('link').textContent;
    const linkDescription = rawItem.querySelector('description').textContent;
    return { title, link, linkDescription };
  });
  return { channelTitle, description, items };
};

const makeFeed = (obj, url, feedId) => {
  const { channelTitle, description, items } = obj;
  const posts = items.map((post) => ({ ...post, url, feedId }));
  return {
    feed: {
      url, feedId, channelTitle, description,
    },
    posts,
  };
};

const useProxyTo = (url) => {
  const processedByProxy = new URL('https://hexlet-allorigins.herokuapp.com/get?');
  processedByProxy.searchParams.set('url', url);
  processedByProxy.searchParams.set('disableCache', true);
  return processedByProxy;
};

const setIdToEveryPost = (post) => {
  const postWithId = post;
  const postId = _.uniqueId('post');
  postWithId.postId = postId;
  return postWithId;
};

const handlePostsPreview = (initialState, elems) => {
  const watchedState = initialState;
  const { postsElem } = elems;
  postsElem.addEventListener('click', (e) => {
    const postId = e.target.classList.contains('previewButton')
      ? e.target.getAttribute('data-id')
      : false;
    if (postId) {
      watchedState.modal.selectedPostId = postId;
      watchedState.ui.selectedPosts.add(postId);
    } else if (document.body.classList.contains('modal-open')) {
      const modalContent = e.target.closest('.modal-content');
      if (modalContent === null) watchedState.modal.selectedPostId = null;
    }
  });
};

const loadFeed = (url, initialState) => {
  const feedId = _.uniqueId('feed');
  const watchedState = initialState;
  watchedState.loadingProcess = { status: 'loading' };
  axios.get(useProxyTo(url).toString(), { timeout: 10000 })
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = makeFeed(parsedData, url, feedId);
      const { feed } = data;
      const posts = data.posts.map(setIdToEveryPost);
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...posts);
      watchedState.loadingProcess = { status: 'succeed' };
    })
    .catch((err) => {
      const error = err;
      if (error.isAxiosError) error.type = 'network'; // не нашёл способа преднастраивать ошибки axios
      const mappingError = { network: 'networkError', parse: 'unvalidRssLinkError', unknown: 'unkownError' };
      watchedState.loadingProcess = { status: 'failed', error: mappingError[err.type] || err.unknown };
      throw new Error(err.message);
    })
    .finally(() => { watchedState.form = { status: 'filling' }; });
};

const updateFeeds = (initialState) => {
  const watchedState = initialState;
  const promises = watchedState.feeds.map(({ url, feedId }) => axios.get(useProxyTo(url))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = makeFeed(parsedData, url, feedId);
      const posts = watchedState.posts.filter((post) => post.feedId === feedId);
      const titles = posts.map((post) => post.title);
      const newPosts = _.differenceWith(data.posts, posts, _.isEqual)
        .filter((post) => !titles.includes(post.title))
        .map(setIdToEveryPost);
      watchedState.posts.unshift(...newPosts);
    })
    .catch((e) => { console.warn(e); }));
  Promise.all(promises).then(() => setTimeout(() => updateFeeds(watchedState), 5000));
};

export default () => i18next
  .init({
    lng: 'ru',
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
      modal: { selectedPostId: null },
      ui: { selectedPosts: new Set() },
    };

    const elems = {
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalFooterA: document.querySelector('.modal-footer a'),
      form: document.querySelector('form'),
      formTitle: document.querySelector('.formTitle'),
      lead: document.querySelector('.lead'),
      input: document.querySelector('.inputField'),
      exampleBlock: document.getElementById('exampleBlock'),
      loadingInfo: document.getElementById('loadingInfo'),
      submitButton: document.querySelector('.submitButton'),
      feedsElem: document.querySelector('.feeds'),
      postsElem: document.querySelector('.posts'),
    };

    const watchedState = watcher(state, elems);
    watchedState.appStatus = 'initiated';

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.form = { status: 'submited' };
      const formData = new FormData(e.target);
      const entredUrl = formData.get('url');
      const urlsFromState = watchedState.feeds.map((feed) => feed.url);

      try {
        validate(entredUrl, urlsFromState);
      } catch (err) {
        watchedState.form = { status: 'filling', error: err.message || err };
        return;
      }

      loadFeed(entredUrl, watchedState);
    });

    handlePostsPreview(watchedState, elems);
    updateFeeds(watchedState);
  });
