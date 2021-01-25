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

const renderFeeds = (feeds, container) => {
  const parentElement = container;
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
  parentElement.innerHTML = div.innerHTML;
};

const renderPosts = (rawPosts, container) => {
  const parentElement = container;
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
  parentElement.innerHTML = div.innerHTML;
};

export default (state, elems) => {
  const loadingProcessHandler = (status, initialState) => {
    const watchedState = initialState;
    const { loadingInfo, input } = elems;
    const caseHandler = (statusCase, styleColor, styleBorder = null) => {
      loadingInfo.textContent = i18next.t(statusCase);
      loadingInfo.style.color = styleColor;
      input.style.border = styleBorder;
    };
    switch (status) {
      case 'loading':
        break;
      case 'Network Error':
        caseHandler('noConnection', 'Red');
        watchedState.loadingError = status;
        break;
      case 'alreadyExists':
        caseHandler('alreadyExists', 'Red');
        watchedState.loadingError = status;
        break;
      case 'urlNotValidAsRssLink':
        caseHandler('urlNotValidAsRssLink', 'Red');
        watchedState.loadingError = status;
        break;
      case 'urlNotValid':
        caseHandler('urlNotValid', 'Red', 'thick solid red');
        watchedState.loadingError = status;
        break;
      case 'succeed':
        caseHandler('succeed', 'Green');
        break;
      default:
        watchedState.loadingError = status;
        throw new Error(`Unknown status: ${status}`);
    }
  };

  const formHandler = (status) => {
    const { submitButton } = elems;
    switch (status) {
      case 'renderCompletelyAndSetFillingStatus':
        renderForm(elems);
        formHandler('filling');
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

  const watchedState = onChange(state, (path, value) => {
    const { feedsElem, postsElem } = elems;
    switch (path) {
      case 'timerId':
        break;
      case 'feeds':
        renderFeeds(value, feedsElem);
        break;
      case 'posts':
        renderPosts(value, postsElem);
        break;
      case 'loadingProcess':
        loadingProcessHandler(value, watchedState);
        break;
      case 'loadingError':
        console.log(`loading process is failed, status - ${value}`);
        break;
      case 'form':
        formHandler(value, watchedState);
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
