import _ from 'lodash';
import i18next from 'i18next';
import onChange from 'on-change';

const renderFeedsList = (feeds, elem) => {
  const feedElement = elem;
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
  feedElement.innerHTML = div.innerHTML;
};

const renderPostsList = (rawPosts, elem) => {
  const postsElement = elem;
  const posts = rawPosts.reduce((acc, val) => {
    const postsFromUrl = _.values(val.byDate);
    return [...postsFromUrl, ...acc];
  }, []);
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
  postsElement.innerHTML = div.innerHTML;
};

const renderLoadingStatus = (text, elem) => {
  const loadingElemenet = elem;
  loadingElemenet.textContent = text;
};

export default (state, elems) => {
  const loadingProcessHandler = (status, timerId, initialState) => {
    const watchedState = initialState;
    switch (status) {
      case 'loading':
        watchedState.form.status = 'loading';
        clearTimeout(timerId);
        break;
      case 'failed':
        watchedState.form.status = 'loading';
        clearTimeout(timerId);
        break;
      case 'succeed':
        watchedState.form.status = 'succeed';
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  };

  const formHandler = (status) => {
    const { loadingElem, input, submitButton } = elems;
    input.style.border = null;
    switch (status) {
      case 'loading':
        submitButton.disabled = true;
        break;
      case 'urlNotValid':
        submitButton.disabled = false;
        input.style.border = 'thick solid red';
        renderLoadingStatus(i18next.t('urlNotValid'), loadingElem);
        break;
      case 'alreadyExists':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('alreadyExists'), loadingElem);
        break;
      case 'failed':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('failed'), loadingElem);
        break;
      case 'succeed':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('succeed'), loadingElem);
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    const { timerId } = state;
    const { feedsElem, postsElem } = elems;
    switch (path) {
      case 'feeds':
        renderFeedsList(value, feedsElem);
        break;
      case 'posts':
        renderPostsList(value, postsElem);
        break;
      case 'timerId':
        break;
      case 'loadingProcess.status':
        loadingProcessHandler(value, timerId, watchedState);
        break;
      case 'form.status':
        formHandler(value);
        break;
      case 'loadingProcess.error':
        throw new Error(`Loading Process: ${value}`);
      case 'form.error':
        throw new Error(`Form: ${value}`);
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
