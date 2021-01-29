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
  if (channel === null) throw new Error('urlNotValidAsRssLink');
  return { url, channel };
};

const processData = (obj, id) => {
  const { url, channel } = obj;
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  const posts = [];
  items.forEach((el) => {
    const pubDate = Date.parse(el.querySelector('pubDate').textContent);
    const postTitle = el.querySelector('title').textContent;
    const link = el.querySelector('link').textContent;
    posts.push({ pubDate, postTitle, link });
  });
  return {
    feed: {
      id, url, title, description,
    },
    posts: { id, list: posts },
  };
};

const fetchNewPosts = (initialState, urls) => {
  // не могу придумать лаконичное условие для остановки автообновления
  // const stopCondition = ???;
  const proxy = 'https://api.allorigins.win/get?url=';
  const watchedState = initialState;
  const rawRssData = urls.map((url) => axios.get(`${proxy}${url}`)
    .catch((e) => { throw new Error(e.message); }));
  return urls.length === watchedState.feeds.length
    ? null
    : Promise.all(rawRssData)
      .then((raw) => {
        const data = raw.map(parseRawRssData);
        const feeds = data.map(processData);
        feeds.forEach((val, i) => {
          const posts = watchedState.posts[i];
          if (!posts) {
            watchedState.feeds.push(val.feed);
            watchedState.posts.push(val.posts);
          } else {
            const existingTitles = posts.list.map((post) => post.title);
            const newPosts = val.posts.list.filter((post) => !existingTitles.includes(post.title));
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
          }
        });
      })
      .then(() => setTimeout(() => fetchNewPosts(watchedState, urls), 5000))
      .catch((e) => { throw new Error(e.message); });
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
      form: { status: 'notRenderedCompletely', error: null },
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
    watchedState.form.status = 'renderCompletelyAndSetFillingStatus';

    elems.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = e.target.querySelector('input').value;
      const urls = watchedState.feeds.map((feed) => feed.url);
      watchedState.form.status = 'submited';

      try {
        checkValidation(url, urls);
      } catch (err) {
        watchedState.form = { status: 'filling', error: err };
        return;
      }
      const validUrls = [...urls, url];

      watchedState.loadingProcess.status = 'loading';
      Promise.resolve()
        .then(() => fetchNewPosts(watchedState, validUrls))
        .then(() => { watchedState.loadingProcess.status = 'succeed'; })
        .finally(() => { watchedState.form.status = 'filling'; })
        .catch((err) => { watchedState.loadingProcess = { status: 'failed', error: err }; });
    });
  });
