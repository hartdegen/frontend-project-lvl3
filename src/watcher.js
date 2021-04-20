import i18next from 'i18next';
import onChange from 'on-change';

const signPageElements = (elems) => {
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
  feeds.forEach(({ channelTitle, description }) => {
    const h3 = document.createElement('h3');
    const p = document.createElement('p');
    h3.textContent = channelTitle;
    p.textContent = description;
    const li = document.createElement('li');
    li.appendChild(h3);
    li.appendChild(p);
    ul.prepend(li);
  });
  div.append(ul);
  feedsElem.innerHTML = div.innerHTML;
};

const renderPosts = (elems, posts, initialState) => {
  const watchedState = initialState;
  const { postsElem } = elems;
  const div = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  h2.textContent = 'Posts';
  div.appendChild(h2);
  posts.forEach(({
    title, link, linkDescription, postId,
  }) => {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = title;
    if (watchedState.openedPosts.includes(postId)) {
      a.classList.add('font-weight-normal');
    } else { a.classList.add('font-weight-bold'); }
    a.setAttribute('data-id', postId);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    const hiddenDescription = document.createElement('span');
    hiddenDescription.textContent = linkDescription;
    hiddenDescription.hidden = true;
    const previewButton = document.createElement('button');
    previewButton.textContent = i18next.t('modalPreviewButton');
    previewButton.classList.add('btn', 'btn-primary', 'previewButton');
    previewButton.setAttribute('type', 'button');
    previewButton.setAttribute('data-bs-toggle', 'modal');
    previewButton.setAttribute('data-bs-target', '#exampleModal');
    const li = document.createElement('li');
    li.appendChild(a);
    li.appendChild(previewButton);
    li.appendChild(hiddenDescription);
    ul.appendChild(li);
  });
  div.append(ul);
  postsElem.innerHTML = div.innerHTML;
  const liElems = postsElem.querySelectorAll('li');
  liElems.forEach((li) => li.addEventListener('click', () => {
    const postId = li.querySelector('a').getAttribute('data-id');
    watchedState.openedPosts.push(postId);
  }));
};

const renderModalPreview = (initialState) => {
  const watchedState = initialState;
  const lastOpenedPostId = watchedState.openedPosts[watchedState.openedPosts.length - 1];
  const modal = document.querySelector('.modal');
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  const modalA = modal.querySelector('a');
  const li = document.querySelector(`[data-id=${lastOpenedPostId}]`).parentElement;
  const liA = li.querySelector('a');
  modalTitle.textContent = li.querySelector('a').textContent;
  modalBody.textContent = li.querySelector('span').textContent;
  modalA.href = li.querySelector('a').href;
  liA.classList.remove('font-weight-bold');
  liA.classList.add('font-weight-normal');
};

const renderLoadingInfoElement = (elems, statusCase, styleColor) => {
  const { loadingInfo } = elems;
  loadingInfo.textContent = i18next.t(statusCase);
  loadingInfo.style.color = styleColor;
};

const handleAppStatus = (elems, status) => {
  switch (status) {
    case 'initiated':
      signPageElements(elems);
      break;
    default:
      throw new Error(`Unknown app status: ${status}`);
  }
};

const handleLoadingProcess = (elems, value) => {
  const { status, error } = value;
  switch (status) {
    case 'loading':
      break;
    case 'succeed':
      renderLoadingInfoElement(elems, 'succeed', 'Green');
      break;
    case 'failed':
      break;
    default:
      throw new Error(`Unknown loading process status: ${status}`);
  }
  if (!error) return;
  switch (error) {
    case 'networkError':
    case 'unvalidRssLinkError':
      renderLoadingInfoElement(elems, error, 'Red');
      break;
    default:
      throw new Error(`Unknown loading process error: ${error}`);
  }
};

const handleForm = (elems, value) => {
  const { status, error } = value;
  const { submitButton, input } = elems;
  input.style.border = null;
  switch (status) {
    case 'submited':
      submitButton.disabled = true;
      break;
    case 'filling':
      submitButton.disabled = false;
      break;
    default:
      throw new Error(`Unknown form status: ${status}`);
  }
  if (!error) return;
  switch (error) {
    case 'blacklistError':
    case 'unvalidUrlError':
      renderLoadingInfoElement(elems, error, 'Red');
      input.style.border = 'thick solid red';
      break;
    default:
      throw new Error(`Unknown form error: ${error}`);
  }
};

export default (state, elems) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'appStatus':
        handleAppStatus(elems, value);
        break;
      case 'loadingProcess':
        handleLoadingProcess(elems, value);
        break;
      case 'form':
        handleForm(elems, value);
        break;
      case 'feeds':
        renderFeeds(elems, value);
        break;
      case 'posts':
        renderPosts(elems, value, watchedState);
        break;
      case 'openedPosts':
        renderModalPreview(watchedState);
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
