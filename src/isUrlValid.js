import * as yup from 'yup';

const isUrlValid = (url) => {
  const schema1 = yup.object().shape({
    website: yup.string().url(),
  });
  return schema1.isValidSync({
    website: url,
  });
};

export default (url, fullUrlsList, watcher) => {
  const watchedState = watcher;
  if (!isUrlValid(url)) {
    watchedState.form.status = 'urlNotValid';
    return false;
  }
  if (fullUrlsList.includes(url)) {
    watchedState.form.status = 'alreadyExists';
    return false;
  }
  return true;
};
