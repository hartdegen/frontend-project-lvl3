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
  const feedsElement = document.querySelector('.feeds');
  feedsElement.innerHTML = div.innerHTML;
};
const renderPostsList = (posts) => {
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
  const postsElement = document.querySelector('.posts');
  postsElement.innerHTML = div.innerHTML;
};
const renderLoadingStatus = (text) => {
  document.querySelector('.loadingInfo').textContent = text;
};

export default (state, elements) => {
  const loadingStateHandler = (loadingState, elems) => {
    const { input, submitButton } = elems;
    submitButton.disabled = false;
    input.style.border = null;

    switch (loadingState) {
      case 'idle':
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'urlNotValid':
        input.style.border = 'thick solid red';
        renderLoadingStatus(i18next.t('urlNotValid'));
        break;
      case 'failed':
        renderLoadingStatus(i18next.t('failed'));
        break;
      case 'alreadyExists':
        renderLoadingStatus(i18next.t('alreadyExists'));
        break;
      case 'succeed':
        renderLoadingStatus(i18next.t('succeed'));
        break;
      default:
        throw new Error(`Unknown state: ${loadingState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    const urlFromRssList = path.split('approvedRssList.')[1];
    switch (path) {
      case `approvedRssList.${urlFromRssList}`:
        if (!_.isEmpty(state.approvedRssList)) {
          const feeds = _.values(state.approvedRssList);
          const posts = _.keys(state.approvedRssList).reduce((acc, url) => {
            const postsFromUrl = _.values(state.approvedRssList[url].posts);
            return [...postsFromUrl, ...acc];
          }, []);

          renderFeedsList(feeds);
          renderPostsList(posts);
        }
        break;

      case 'loadingState':
        loadingStateHandler(value, elements);
        break;

      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
