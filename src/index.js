import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import * as yup from 'yup';
import logo from './assets/logo.png';
import './styles/styles.css';
import axios from 'axios';

let schema = yup.object().shape({
  website: yup.string().url()
});
const state = {
  typedUrl: {
    valid: false
  },
  approvedRssList: []
};
const input = document.querySelector('input');
const form = document.querySelector('form');
const checkInputValid = () => {
  let isValid = false;
  const checkUrl = (url) => {
    schema
      .isValid({
        website: `${url}`,
      })
      .then((bool) => {
        isValid = bool;
      }) // => true);
  };
  setTimeout(() => console.log('setting Timeout'), 1000);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    checkUrl(input.value);
    if (isValid && !state.approvedRssList.includes(input.value)) {
      state.typedUrl.valid = true;
      state.approvedRssList.push(input.value)
      console.log(111)
    } else {
      state.typedUrl.valid = false;
    }
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

form.addEventListener('submit', (e) => {
  axios.get(`${input.value}`)
    .then((data) => {
      const parser = new DOMParser();
      const rssData = parser.parseFromString(data, 'text/xml');
      return rssData;
    })
    .then(console.log);
})


export default (a, b) => a + b;