import * as yup from 'yup';

const isUrlValid = (url) => {
  const schema1 = yup.object().shape({
    website: yup.string().url(),
  });
  return schema1.isValidSync({
    website: url,
  });
};

export default (url, watcher) => {
  const watchedState = watcher;
  const { urls } = watchedState;
  if (!isUrlValid(url)) {
    watchedState.form.status = 'urlNotValid';
  }
  if (urls.includes(url)) {
    watchedState.form.status = 'alreadyExists';
  }
};
