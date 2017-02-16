
const React = require('react');
const ReactDOM = require('react-dom');

const { AppContainer } = require('react-hot-loader');

const Root = require('./components/Root');

ReactDOM.render(
  <AppContainer><Root /></AppContainer>,
  document.getElementById('root'),
);

/* eslint-disable global-require */
if (module.hot) {
  module.hot.accept('./components/Root', () => {
    const ReRoot = require('./components/Root');
    ReactDOM.render(
      <AppContainer><ReRoot /></AppContainer>,
      document.getElementById('root'),
    );
  });
}
/* eslint-enble global-require */
