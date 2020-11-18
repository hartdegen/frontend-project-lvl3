import _ from 'lodash';
import i18next from 'i18next';
import onChange from 'on-change';

export default (state, elems, functionsOfRendering) => {
  const { renderFeedsList, renderPostsList, renderLoadingStatus } = functionsOfRendering;
  const { input, submitButton } = elems;

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'networkErorr':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('networkError'));
        break;
      case 'alreadyExists':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('alreadyExists'));
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        renderLoadingStatus(i18next.t('finished'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    const urlFromRssList = path.split('approvedRssList.')[1];
    switch (path) {
      case 'typedUrlValid':
        if (value) {
          submitButton.disabled = false;
          input.style.border = null;
        } else {
          submitButton.disabled = false;
          input.style.border = 'thick solid red';
          renderLoadingStatus(i18next.t('notValid'));
        }
        break;

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

      case 'processState':
        processStateHandler(value, submitButton);
        break;

      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });

  return watchedState;
};
