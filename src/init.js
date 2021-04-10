import * as _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidity from './validation.js';

class UnvalidRssLinkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'Unvalid Rss Link Error';
    this.type = 'unvalidRssLinkError';
  }
}
// наверно, подклассы ошибок стоит выделить в отдельный модуль, но пока пусть будет здесь

const parseRssData = (obj) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const parserError = rssDataDocument.querySelector('parsererror');
  if (rssDataDocument.contains(parserError)) {
    const errorText = parserError.querySelector('div').textContent;
    throw new UnvalidRssLinkError(errorText);
  }
  const channel = rssDataDocument.querySelector('rss channel');
  const channelTitle = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const rawItems = channel.querySelectorAll('item');
  const items = [];
  rawItems.forEach((el) => {
    const title = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    items.push({ title, link });
  });
  return { channelTitle, description, items };
};

const processParsedData = (obj, url, id) => {
  const { channelTitle, description, items } = obj;
  const posts = items.map((post) => ({ ...post, url, id }));
  return {
    feed: {
      url, id, channelTitle, description,
    },
    posts,
  };
};

const useProxyTo = (url) => {
  const processedByProxy = new URL('https://hexlet-allorigins.herokuapp.com/get?');
  processedByProxy.searchParams.set('url', url);
  return processedByProxy;
};

const convertProxyObjToPlain = (proxyObj) => _.cloneDeep(proxyObj);

const updateFeeds = (initialState) => {
  const watchedState = initialState;
  const urlsWithId = watchedState.feeds.map((feed) => ({ url: feed.url, id: feed.id }));
  const allExistingPosts = convertProxyObjToPlain(watchedState.posts);
  const promises = urlsWithId.map(({ url, id }) => axios.get(useProxyTo(url))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedData(parsedData, url, id);
      const postsFiltredByFeed = allExistingPosts.filter((post) => post.id === id);
      const existingTitles = postsFiltredByFeed.map((post) => post.title);
      const newPosts = _.differenceWith(data.posts, postsFiltredByFeed, _.isEqual)
        .filter((post) => !existingTitles.includes(post.title));
      watchedState.posts.unshift(...newPosts);
    })
    .catch((e) => { console.warn(e); }));
  Promise.all(promises).then(() => { setTimeout(() => updateFeeds(watchedState), 5000); });
};

const loadFeed = (urls, initialState) => {
  const id = _.uniqueId();
  const watchedState = initialState;
  watchedState.loadingProcess = { status: 'loading' };
  const lastAddedUrl = urls[urls.length - 1];
  axios.get(useProxyTo(lastAddedUrl))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedData(parsedData, lastAddedUrl, id);
      watchedState.feeds.unshift(data.feed);
      watchedState.posts.unshift(...data.posts);
      watchedState.loadingProcess = { status: 'succeed' };
    })
    .catch((err) => {
      const mappingError = {
        networkError: 'networkError',
        unvalidRssLinkError: 'unvalidRssLinkError',
      };
      if (err.isAxiosError) {
        watchedState.loadingProcess = { status: 'failed', error: mappingError.networkError };
      } else {
        watchedState.loadingProcess = { status: 'failed', error: mappingError[err.type] || err };
      }
    })
    .finally(() => { watchedState.form = { status: 'filling' }; });
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
      watchedState.form = { status: 'submited' };
      const formData = new FormData(e.target);
      const entredUrl = formData.get('url');
      const urlsFromState = watchedState.feeds.map((feed) => feed.url);

      try {
        checkValidity(entredUrl, urlsFromState);
      } catch (err) {
        watchedState.form = { status: 'filling', error: err.message || err };
        return;
      }

      const validUrls = [...urlsFromState, entredUrl];
      loadFeed(validUrls, watchedState);
    });

    updateFeeds(watchedState);
  });
