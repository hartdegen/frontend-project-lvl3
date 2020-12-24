import i18next from 'i18next';
import onChange from 'on-change';

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
  const loadingProcessHandler = (status, timerId, initialState) => {
    const watchedState = initialState;
    switch (status) {
      case 'loading':
        clearTimeout(timerId);
        break;
      case 'failed':
        watchedState.form.status = 'filling';
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
      case 'submited':
        submitButton.disabled = true;
        break;
      case 'noConnection':
        submitButton.disabled = false;
        loadingElem.textContent = i18next.t('noConnection');
        loadingElem.style.color = 'Red';
        break;
      case 'urlNotValid':
        submitButton.disabled = false;
        input.style.border = 'thick solid red';
        loadingElem.textContent = i18next.t('urlNotValid');
        loadingElem.style.color = 'Red';
        break;
      case 'urlNotValidAsRss':
        submitButton.disabled = false;
        loadingElem.textContent = i18next.t('urlNotValidAsRss');
        loadingElem.style.color = 'Red';
        break;
      case 'alreadyExists':
        submitButton.disabled = false;
        loadingElem.textContent = i18next.t('alreadyExists');
        loadingElem.style.color = 'Red';
        break;
      case 'succeed':
        submitButton.disabled = false;
        loadingElem.textContent = i18next.t('succeed');
        loadingElem.style.color = 'Green';
        break;
      case 'filling':
        submitButton.disabled = false;
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
        renderFeeds(value, feedsElem);
        break;
      case 'posts':
        renderPosts(value, postsElem);
        break;
      case 'timerId':
        break;
      case 'loadingProcess.status':
        loadingProcessHandler(value, timerId, watchedState);
        break;
      case 'form.status':
        formHandler(value);
        break;
      case 'loadingProcess.errors':
        break;
      case 'form.errors':
        formHandler(value[value.length - 1]);
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
