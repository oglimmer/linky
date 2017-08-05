
import { SET_ERROR_MESSAGE, SET_INFO_MESSAGE, SET_TEMP_MESSAGE } from '../actionTypes';


export function setErrorMessage(errorMessage) {
  const action = { type: SET_ERROR_MESSAGE, errorMessage };
  if (errorMessage instanceof Error) {
    action.errorMessage = errorMessage.message;
  } else if (typeof errorMessage !== 'string') {
    action.errorMessage = JSON.stringify(errorMessage);
  }
  return action;
}

export function setInfoMessage(infoMessage) {
  const action = { type: SET_INFO_MESSAGE, infoMessage };
  if (typeof infoMessage !== 'string') {
    action.infoMessage = JSON.stringify(infoMessage);
  }
  return action;
}

export function setTempMessage(tempMessage) {
  const action = { type: SET_TEMP_MESSAGE, tempMessage };
  if (typeof tempMessage !== 'string') {
    action.tempMessage = JSON.stringify(tempMessage);
  }
  return action;
}
