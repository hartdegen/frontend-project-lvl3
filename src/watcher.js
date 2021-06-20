import i18next from 'i18next';
import onChange from 'on-change';

const signPageElements = (elems) => {
  const {
    formTitle, lead, exampleBlock, submitButton,
  } = elems;
  formTitle.innerHTML = i18next.t('formTitle');
  lead.innerHTML = i18next.t('lead');
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
    if (watchedState.ui.selectedPosts.has(postId)) {
      a.classList.add('font-weight-normal');
    } else { a.classList.add('font-weight-bold'); }
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
    previewButton.setAttribute('data-id', postId);
    const li = document.createElement('li');
    li.appendChild(a);
    li.appendChild(previewButton);
    li.appendChild(hiddenDescription);
    ul.appendChild(li);
  });
  div.append(ul);
  postsElem.innerHTML = div.innerHTML;
};

const renderModalPreview = (elems, initialState) => {
  const { modalTitle, modalBody, modalFooterA } = elems;
  const watchedState = initialState;
  const postId = watchedState.modal.selectedPostId;
  if (postId === null) return;
  const li = document.querySelector(`button.previewButton[data-id=${postId}]`).parentElement;
  const liA = li.querySelector('a');
  const liSpan = li.querySelector('span');
  modalTitle.textContent = liA.textContent;
  modalBody.textContent = liSpan.textContent;
  modalFooterA.href = liA.href;
};

const changeSelectedPostsFonts = (elems, initialState) => {
  const { postsElem } = elems;
  const watchedState = initialState;
  const postId = watchedState.modal.selectedPostId;
  console.log(111, postId);
  const li = postsElem.querySelector(`button.previewButton[data-id=${postId}]`).parentElement;
  console.log(222, li);
  const liA = li.querySelector('a');
  liA.classList.remove('font-weight-bold');
  liA.classList.add('font-weight-normal');
};

const renderLoadingInfoElement = (elems, statusCase, styleColor) => {
  const { loadingInfo } = elems;
  if (statusCase) {
    loadingInfo.textContent = i18next.t(statusCase);
    loadingInfo.style.color = styleColor;
  } else {
    loadingInfo.textContent = '';
    loadingInfo.style.color = null;
  }
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

const handleForm = (elems, value) => {
  const { status, error } = value;
  const { submitButton, input } = elems;
  input.style.border = '1px solid black';
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
  if (error) {
    renderLoadingInfoElement(elems, error, 'Red');
    input.style.border = 'thick solid red';
  }
};

const handleLoadingProcess = (elems, value) => {
  console.log('value in handleLoadingProcess', value);
  const { status, error } = value;
  const { input } = elems;
  switch (status) {
    case 'loading':
      handleForm(elems, { status: 'submited' });
      renderLoadingInfoElement(elems);
      input.disabled = true;
      break;
    case 'succeed':
      handleForm(elems, { status: 'filling' });
      renderLoadingInfoElement(elems, 'succeed', 'Green');
      input.disabled = false;
      input.value = '';
      break;
    case 'failed':
      handleForm(elems, { status: 'filling', error });
      input.disabled = false;
      break;
    default:
      throw new Error(`Unknown loading process status: ${status}`);
  }
  if (error) renderLoadingInfoElement(elems, error, 'Red');
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
      case 'modal.selectedPostId':
        renderModalPreview(elems, watchedState);
        break;
      case 'ui.selectedPosts':
        changeSelectedPostsFonts(elems, watchedState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
