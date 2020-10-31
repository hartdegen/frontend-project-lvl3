import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import './styles/styles.css';
import axios from 'axios';
import onChange from 'on-change'
import isUrlValid from './urlCheking.js';

const state = {
  processState: `filling`,
  typedUrlValid: null,
  approvedRssList: {},
};

const form = document.querySelector(`form`);
const input = form.querySelector(`input`);
const submitButton = form.querySelector('button');

const watchedState = onChange(state, (path, value) => {
  const urlFromRssList = path.split(`approvedRssList.`)[1];
  switch (path) {
    case `typedUrlValid`:
      if (value) {
        input.style.border = null;
        input.value = ``;
      } else {
        input.style.border = `thick solid red`;
      }
      break;
    case `approvedRssList.${urlFromRssList}`:
      if (!_.isEmpty(state.approvedRssList)) {
        createFeedsList();
        createPostsList();
      }
      break;
    case `processState`:
      if (value === `sending`) {
        submitButton.disabled = true;
      } else {
        submitButton.disabled = false;
      }
      break;
    default:
      console.log(`SOMETHINGS WRONG`);
      break;
  }
});

const parseRssData = (dataObj, urlFromInput) => {
  const parser = new DOMParser();
  const rssDataDocument = parser.parseFromString(dataObj.data, `text/xml`);
  const channel = rssDataDocument.querySelector(`channel`);
  const items = channel.querySelectorAll(`item`);
  const posts = {};
  items.forEach((el) => {
    const pubDate = Date.parse(el.querySelector(`pubDate`).textContent);
    const title = el.querySelector(`title`).textContent;
    const link = el.querySelector(`link`).textContent;
    posts[pubDate] = {
      title: title,
      link: link
    }
  });
  watchedState.approvedRssList[urlFromInput] = {
    title: channel.querySelector(`title`).textContent,
    description: channel.querySelector(`description`).textContent,
    posts: posts
  };
}

form.addEventListener(`submit`, (e) => {
  e.preventDefault();
  watchedState.processState = 'sending';
  const urlFromInput = e.target.querySelector(`input`).value;
  if (isUrlValid(urlFromInput) && !state.approvedRssList[urlFromInput]) {
    watchedState.typedUrlValid = true;
    const proxy = `cors-anywhere.herokuapp.com`;
    axios.get(`https://${proxy}/${urlFromInput}`)
      .then((obj) => parseRssData(obj, urlFromInput))
      .catch(error => console.log(`ERRRRRRRR`, error))
      .finally(() => watchedState.processState = `filling`);
  } else {
    watchedState.typedUrlValid = false;
    watchedState.processState = `filling`
  }
});

const createFeedsList = () => {
  const div = document.createElement(`div`);
  const h2 = document.createElement(`h2`);
  h2.textContent = `Feeds`;
  div.appendChild(h2);
  const ul = document.createElement(`ul`);
  for (let url in state.approvedRssList) {
    const title = state.approvedRssList[url].title;
    const description = state.approvedRssList[url].description;
    const h3 = document.createElement(`h3`);
    const p = document.createElement(`p`);
    h3.textContent = title;
    p.textContent = description;
    const li = document.createElement(`li`);
    li.appendChild(h3);
    li.appendChild(p);
    ul.prepend(li);
  }
  div.append(ul)
  const feeds = document.querySelector(`.feeds`);
  feeds.innerHTML = div.innerHTML
};

const createPostsList = () => {
  const div = document.createElement(`div`);
  const h2 = document.createElement(`h2`);
  h2.textContent = `Posts`;
  div.appendChild(h2);
  const urls = _.keys(state.approvedRssList);
  const lastAddedUrl = urls[urls.length - 1];
  const newestPosts = state.approvedRssList[lastAddedUrl].posts;
  const ul = document.createElement(`ul`);
  for (let post in newestPosts) {
    const title = newestPosts[post].title;
    const link = newestPosts[post].link;
    const a = document.createElement(`a`);
    a.href = link;
    a.textContent = title;
    const li = document.createElement(`li`);
    li.appendChild(a);
    ul.appendChild(li);
  }
  div.append(ul);
  const posts = document.querySelector(`.posts`);
  posts.innerHTML = div.innerHTML
};