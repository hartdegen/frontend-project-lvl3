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
    watchedState.form.errors.push('alreadyExists');
    return true;
  }
  if (!isValidUrl) {
    watchedState.form.errors.push('urlNotValid');
    return true;
  }
  if (!isValidUrlAsRss) {
    watchedState.form.errors.push('urlNotValidAsRss');
    return true;
  }
  return false;
};
