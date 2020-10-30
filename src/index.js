import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import './styles/styles.css';
import axios from 'axios';
import isUrlValid from './urlCheking.js';

const state = {
  typedUrl: {
    valid: false
  },
  approvedRssList: {},
};
const input = document.querySelector('input');
input.focus();
const form = document.querySelector('form');
const checkInputValid = () => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFromInput = input.value;
    if (isUrlValid(urlFromInput) && !state.approvedRssList.urlFromInput) {
      state.typedUrl.valid = true;
      const proxy = 'cors-anywhere.herokuapp.com';
      axios.get(`https://${proxy}/${urlFromInput}`)
        .then((obj) => {
          const parser = new DOMParser();
          const rssData = parser.parseFromString(obj.data, 'text/xml');
          const channel = rssData.querySelector(`channel`);
          const items = channel.querySelectorAll(`item`);
          const posts = {}
          items.forEach((el) => {
            const pubDate = Date.parse(el.querySelector(`pubDate`).textContent);
            const title = el.querySelector(`title`).textContent;
            const link = el.querySelector(`link`).textContent;
            posts[`${pubDate}`] = {
              title: title,
              link: link
            }
          });
          state.approvedRssList[`${urlFromInput}`] = {
            title: channel.querySelector(`title`).textContent,
            description: channel.querySelector(`description`).textContent,
            posts: posts
          };
          console.log(state.approvedRssList)
          return rssData;
        })
        .catch(error => console.log('ERRRRRRRR', error))
    } else {
      state.typedUrl.valid = false;
    }
    render(state);
  });
};
const createFeedsList = () => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = `Feeds`;
  div.appendChild(h2);
  const ul = document.createElement('ul');
  for (let url in state.approvedRssList) {
    const title = state.approvedRssList[`${url}`].title;
    const description = state.approvedRssList[`${url}`].description;
    const h3 = document.createElement('h3');
    const p = document.createElement('p');
    h3.textContent = title;
    p.textContent = description;
    const li = document.createElement('li');
    li.appendChild(h3);
    li.appendChild(p);
    ul.appendChild(li);
  }
  div.append(ul)
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = div.innerHTML
}
const createPostsList = () => {
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = `Posts`;
  div.appendChild(h2);
  const urls = _.keys(state.approvedRssList);
  const lastAddedUrl= urls[urls.length - 1];
  const newestPosts = state.approvedRssList[`${lastAddedUrl}`].posts;
  console.log(`NEW`,newestPosts);
  console.log(`STATE`,state);
  const ul = document.createElement('ul');
  for (let post in newestPosts) {
    const title = newestPosts[`${post}`].title;
    const link = newestPosts[`${post}`].link;
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
    //console.log(111, a.outerHTML)
  }
  div.append(ul);
  const posts = document.querySelector('.posts');
  posts.innerHTML = div.innerHTML
}
const render = (state) => {
  const renderFeeds = () => {
    if (!_.isEmpty(state.approvedRssList)) {
      createFeedsList()
      createPostsList()
    }
  }
  setTimeout(renderFeeds, 2000);
  const input = document.querySelector('.inputField');
  if (state.typedUrl.valid) {
    input.style.border = null;
    input.value = '';
  } else {
    input.style.border = "thick solid red";
  }
  console.log(`STATE`, state.approvedRssList)

}
checkInputValid();

export default (a, b) => a + b;