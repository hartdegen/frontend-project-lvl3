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
          console.log(`THATS RSS DATA`, rssData);
          const channel = rssData.querySelector(`channel`)
          state.approvedRssList[`${urlFromInput}`] = {
            title: channel.querySelector(`title`).textContent,
            description: channel.querySelector(`description`).textContent
          };
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
    const li = document.createElement('li');
    li.textContent = title;
    ul.appendChild(li);
  }
  div.append(ul)
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = div.innerHTML
}
const render = (state) => {
  const renderFeeds = () => {
    if (!_.isEmpty(state.approvedRssList)) {
      createFeedsList()
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