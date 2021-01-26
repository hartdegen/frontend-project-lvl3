import i18next from 'i18next';
import onChange from 'on-change';

const renderForm = (elems) => {
  const {
    formTitle, lead, input, exampleBlock, submitButton,
  } = elems;
  formTitle.innerHTML = i18next.t('formTitle');
  lead.innerHTML = i18next.t('lead');
  input.value = i18next.t('inputValue');
  exampleBlock.innerHTML = i18next.t('exampleBlock');
  submitButton.innerHTML = i18next.t('submitButton');
};

const renderFeeds = (elems, feeds) => {
  const { feedsElem } = elems;
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = 'Feeds';
  div.appendChild(h2);
  const ul = document.createElement('ul');
  feeds.forEach(({ title, description }) => {
    const h3 = document.createElement('h3');
    const p = document.createElement('p');
    h3.textContent = title;
    p.textContent = description;
    const li = document.createElement('li');
    li.appendChild(h3);
    li.appendChild(p);
    ul.prepend(li);
  });
  div.append(ul);
  feedsElem.innerHTML = div.innerHTML;
};

const renderPosts = (elems, rawPosts) => {
  const { postsElem } = elems;
  const posts = rawPosts.map((value) => value.list).flat();
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  h2.textContent = 'Posts';
  div.appendChild(h2);
  posts.forEach(({ title, link }) => {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.append(ul);
  postsElem.innerHTML = div.innerHTML;
};

const loadingCaseHandler = (elems, statusCase, styleColor, styleBorder = null) => {
  const { loadingInfo, input } = elems;
  loadingInfo.textContent = i18next.t(statusCase);
  loadingInfo.style.color = styleColor;
  input.style.border = styleBorder;
};

const loadingProcessStatusHandler = (elems, status) => {
  switch (status) {
    case 'loading':
      // loadingCaseHandler(elems, 'loading', 'Blue');
      break;
    case 'succeed':
      loadingCaseHandler(elems, 'succeed', 'Green');
      break;
    default:
      throw new Error(`Unknown loading process status: ${status}`);
  }
};

const formStatusHandler = (elems, status) => {
  const { submitButton } = elems;
  switch (status) {
    case 'renderCompletelyAndSetFillingStatus':
      renderForm(elems);
      break;
    case 'submited':
      submitButton.disabled = true;
      break;
    case 'filling':
      submitButton.disabled = false;
      break;
    default:
      throw new Error(`Unknown status: ${status}`);
  }
};

const loadingProcessErrorHandler = (elems, error) => {
  switch (error) {
    case 'Network Error':
      loadingCaseHandler(elems, 'noConnection', 'Red');
      break;
    case 'urlNotValidAsRssLink':
      loadingCaseHandler(elems, 'urlNotValidAsRssLink', 'Red');
      break;
    default:
      throw new Error(`Unknown loading process error: ${error}`);
  }
};

const formErrorHandler = (elems, error) => {
  switch (error) {
    case 'yupUrlAlreadyExists':
      loadingCaseHandler(elems, 'yupUrlAlreadyExists', 'Red');
      break;
    case 'yupUrlNotValidAsRssLink':
      loadingCaseHandler(elems, 'yupUrlNotValidAsRssLink', 'Red');
      break;
    case 'yupUrlNotValid':
      loadingCaseHandler(elems, 'yupUrlNotValid', 'Red', 'thick solid red');
      break;
    default:
      throw new Error(`Unknown loading process error: ${error}`);
  }
};

const processError = (err, initialState) => {
  const watchedState = initialState;
  if (err.includes('yup')) {
    watchedState.form.error = err;
    return;
  }
  watchedState.loadingProcess.error = err;
};

export default (state, elems) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'timerId':
        break;
      case 'feeds':
        renderFeeds(elems, value);
        break;
      case 'posts':
        renderPosts(elems, value);
        break;
      case 'loadingProcess':
        console.log(222, state);
        break;
      case 'loadingProcess.status':
        loadingProcessStatusHandler(elems, value);
        break;
      case 'loadingProcess.error':
        loadingProcessErrorHandler(elems, value);
        break;
      case 'form.status':
        formStatusHandler(elems, value);
        break;
      case 'form.error':
        formErrorHandler(elems, value);
        break;
      case 'error':
        processError(value, watchedState);
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
