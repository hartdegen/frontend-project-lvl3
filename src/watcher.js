import _ from 'lodash';
import i18next from 'i18next';
import onChange from 'on-change';

const renderFeedsList = (feeds) => {
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
  const feedsElement = document.querySelector('div.feeds');
  feedsElement.innerHTML = div.innerHTML;
};

const renderPostsList = (rawPosts) => {
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
  const postsElement = document.querySelector('div.posts');
  postsElement.innerHTML = div.innerHTML;
};
const renderLoadingStatus = (text) => {
  document.querySelector('div.loadingInfo').textContent = text;
};

export default (state, elements) => {
  const loadingProcessHandler = (status, elems, watcher) => {
    switch (status) {
      case 'loading':
        break;
      case 'failed':
        break;
      case 'succeed':
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  };

  const formHandler = (status, elems) => {
    const { input, submitButton } = elems;
    input.style.border = null;
    switch (status) {
      case 'loading':
        submitButton.disabled = true;
        break;
      case 'urlNotValid':
        submitButton.disabled = false;
        input.style.border = 'thick solid red';
        renderLoadingStatus(i18next.t('urlNotValid'));
        break;
      case 'alreadyExists':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('alreadyExists'));
        break;
      case 'failed':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('failed'));
        break;
      case 'succeed':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('succeed'));
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeedsList(value);
        break;
      case 'posts':
        renderPostsList(value);
        break;
      case 'loadingProcess.status':
        loadingProcessHandler(value, elements);
        break;
      case 'form.status':
        formHandler(value, elements);
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
