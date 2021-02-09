import axios from 'axios';
import i18next from 'i18next';
import watcher from './watcher.js';
import resources from './locales.js';
import checkValidity from './validation.js';

const parseRssData = (obj) => {
  const { url } = obj.data.status;
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(obj.data.contents, 'text/xml');
  const channel = rssDataDocument.querySelector('rss channel');
  if (channel === null) throw new Error('urlNotValidAsRss');
  return { url, channel };
};

const processParsedRssData = (obj) => {
  const { url, channel } = obj;
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  const posts = [];
  items.forEach((el) => {
    const postTitle = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    const rssLinkAsId = url;
    posts.push({ postTitle, link, rssLinkAsId });
  });
  return { feed: { rssLinkAsId: url, title, description }, posts };
};

const useProxyTo = (url) => `${'https://hexlet-allorigins.herokuapp.com/get?url='}${url}`;

const updatePosts = (urls, initialState) => {
  const watchedState = initialState;
  const promises = urls.map((url, i) => axios.get(useProxyTo(url))
    .then((rssData) => {
      const parsedData = parseRssData(rssData);
      const data = processParsedRssData(parsedData);
      const postsInState = watchedState.posts[i];
      const existingTitles = postsInState.map((post) => post.postTitle);
      const newPosts = data.posts.filter((post) => !existingTitles.includes(post.postTitle));
      if (newPosts.length > 0) {
        watchedState.posts.map((value, index) => {
          if (i === index) {
            const listOfPosts = value;
            listOfPosts.push(...newPosts);
            return listOfPosts;
          }
          return value;
        });
      }
    })
    .catch((e) => { console.warn(e); }));
  Promise.all(promises).then(() => {
    setTimeout(() => {
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
      watchedState.feeds.push(data.feed);
      watchedState.posts.push(data.posts);
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
