import * as yup from 'yup';

export default (url, list, initialState) => {
  const watchedState = initialState;
  const schema1 = yup.object().shape({ website: yup.string().url() });
  const schema2 = yup.string().notOneOf(list);

  const isValidUrl = schema1.isValidSync({ website: url });
  const isNotIncludedUrlInList = schema2.isValidSync(url);

  if (!isNotIncludedUrlInList) {
    watchedState.form.status = 'failed';
    watchedState.form.error = 'alreadyExists';
    return true;
  }
  if (!isValidUrl) {
    watchedState.form.status = 'failed';
    watchedState.form.error = 'urlNotValid';
    return true;
  }
  return false;
};
