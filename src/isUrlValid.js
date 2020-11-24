import * as yup from 'yup';

const isUrlValid = (url) => {
  const schema1 = yup.object().shape({
    website: yup.string().url(),
  });
  return schema1.isValidSync({
    website: url,
  });
};

const isListHasUrl = (url, list) => {
  const schema2 = yup.mixed().notOneOf(list);
  return schema2.isValidSync(url);
};

export default (url, list) => {
  if (!isUrlValid(url)) {
    return {
      stateValue: 'urlNotValid',
      booleanValue: false,
    };
  }
  if (!isListHasUrl(url, list)) {
    return {
      stateValue: 'alreadyExists',
      booleanValue: false,
    };
  }
  return {
    booleanValue: true,
  };
};
