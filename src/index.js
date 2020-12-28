import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/styles.css';
import runMainApp from './init.js';

runMainApp()
  .catch((e) => {
    console.warn(e);
  });
