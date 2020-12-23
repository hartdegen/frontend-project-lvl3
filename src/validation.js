import * as yup from 'yup';

export default (url, list, initialState) => {
  const watchedState = initialState;
  const schema1 = yup.string().notOneOf(list);
  const schema2 = yup.string().url();
  const schema3 = yup.string().matches(/(\.rss)$/);

  const isUrlNotIncludedInList = schema1.isValidSync(url);
  const isValidUrl = schema2.isValidSync(url);
  const isValidUrlAsRss = schema3.isValidSync(url);

  if (!isUrlNotIncludedInList) {
    watchedState.form.status = 'alreadyExists';
    return true;
  }
  if (!isValidUrl) {
    watchedState.form.status = 'urlNotValid';
    return true;
  }
  if (!isValidUrlAsRss) {
    watchedState.form.status = 'urlNotValidAsRss';
    return true;
  }
  return false;
};
