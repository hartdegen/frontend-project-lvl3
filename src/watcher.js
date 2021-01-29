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
  posts.forEach(({ postTitle, link }) => {
    const a = document.createElement('a');
    a.href = link;
    a.textContent = postTitle;
    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.append(ul);
  postsElem.innerHTML = div.innerHTML;
};

const renderInfo = (elems, statusCase, styleColor, styleBorder = null) => {
  const { loadingInfo, input } = elems;
  loadingInfo.textContent = i18next.t(statusCase);
  loadingInfo.style.color = styleColor;
  input.style.border = styleBorder;
};

const handleLoadingProcessStatus = (elems, status) => {
  switch (status) {
    case 'loading':
      break;
    case 'succeed':
      renderInfo(elems, 'succeed', 'Green');
      break;
    case 'failed':
      break;
    default:
      throw new Error(`Unknown loading process status: ${status}`);
  }
};

const handleFormStatus = (elems, status) => {
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
      throw new Error(`Unknown form status: ${status}`);
  }
};

const handleLoadingProcessError = (elems, error) => {
  const errorMessage = error.message;
  switch (errorMessage) {
    case 'Network Error':
      renderInfo(elems, 'noConnection', 'Red');
      break;
    case 'urlNotValidAsRssLink':
      renderInfo(elems, 'urlNotValidAsRssLink', 'Red');
      break;
    default:
      throw new Error(`Unknown loading process error: ${error}`);
  }
};

const handleFormError = (elems, error) => {
  const errorType = error.type;
  switch (errorType) {
    case 'notOneOf':
      renderInfo(elems, 'notOneOf', 'Red');
      break;
    case 'url':
      renderInfo(elems, 'url', 'Red', 'thick solid red');
      break;
    case 'matches':
      renderInfo(elems, 'matches', 'Red');
      break;
    default:
      throw new Error(`Unknown form error: ${error}`);
  }
};

export default (state, elems) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeeds(elems, value);
        break;
      case 'posts':
        renderPosts(elems, value);
        break;
      case 'loadingProcess':
        handleLoadingProcessStatus(elems, value.status);
        handleLoadingProcessError(elems, value.error);
        break;
      case 'form':
        handleFormStatus(elems, value.status);
        handleFormError(elems, value.error);
        break;
      case 'loadingProcess.status':
        handleLoadingProcessStatus(elems, value);
        break;
      case 'form.status':
        handleFormStatus(elems, value);
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
