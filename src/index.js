import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import logo from './assets/logo.png';
import './styles/styles.css';
import axios from 'axios';
import isUrlValid from './urlCheking.js';

const state = {
  typedUrl: {
    valid: false
  },
  approvedRssList: [],
};
const input = document.querySelector('input');
const form = document.querySelector('form');
const checkInputValid = () => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlFromInput = input.value
    if (isUrlValid(urlFromInput) && !state.approvedRssList.includes(urlFromInput)) {
      state.typedUrl.valid = true;
      axios.get(`${urlFromInput}`)
        .then((data) => {
          console.log(11111, data);
          const parser = new DOMParser();
          const rssData = parser.parseFromString(data, 'text/xml');
          state.approvedRssList.push(urlFromInput)
          return rssData;
        })
        .then(console.log)
        .catch(error => console.log('ERRRRRRRR', error))
    } else {
      state.typedUrl.valid = false;
    }
    console.log(`LISTTTT`, state.approvedRssList)
    render(state);
  });
};
const render = (state) => {
  const input = document.querySelector('.inputField');
  if (state.typedUrl.valid) {
    input.style.border = null;
    input.value = '';
  } else {
    input.style.border = "thick solid red";
  }
}
checkInputValid();

export default (a, b) => a + b;