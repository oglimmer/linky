

import { SET_ERROR_MESSAGE, SET_INFO_MESSAGE, SET_TEMP_MESSAGE, RESET } from './../actionTypes';

import { initialFeedbackData } from './../DataModels';

export default function feedbackData(state = initialFeedbackData, action) {
  switch (action.type) {
    case RESET:
      return initialFeedbackData;
    case SET_ERROR_MESSAGE:
      return Object.assign({}, state, {
        errorMessage: action.errorMessage,
        infoMessage: '',
        tempMessage: '',
      });
    case SET_INFO_MESSAGE:
      return Object.assign({}, state, {
        infoMessage: action.infoMessage,
        errorMessage: '',
        tempMessage: '',
      });
    case SET_TEMP_MESSAGE:
      return Object.assign({}, state, {
        tempMessage: action.tempMessage,
        infoMessage: '',
        errorMessage: '',
      });
    default:
      return state;
  }
}
