import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import * as yup from 'yup';
// import json from './assets/json';
import logo from './assets/logo.png';
import './styles/styles.css';

let schema = yup.object().shape({
  website: yup.string().url()
});

const checkInputValid = () => {
  const state = {
    typedUrl: {
      valid: false
    }
  };
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
  const input = document.querySelector('.inputField');

  input.addEventListener('keyup', () => {
    checkUrl(input.value);
    if (isValid) {
      state.typedUrl.valid = true;
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
  } else {
    input.style.border = "thick solid red";
  }
}

checkInputValid();
console.log('Oh, Hello there');


export default (a, b) => a + b;