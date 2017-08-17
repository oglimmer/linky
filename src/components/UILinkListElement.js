
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, ListGroupItem } from 'react-bootstrap';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';

import { fetchRssUpdatesDetails } from '../redux/actions/links';

const styleFeedUpdate = {
  borderBottom: '1px dotted #000',
};
const styleRow = {
  paddingLeft: '20px',
};

const display = (columnName, text) => {
  switch (columnName) {
    case 'tags':
      return text.map(tag => (
        <span key={Math.random()}>
          <span className="label label-default">{tag}</span>
          {' '}
        </span>
      ));
    case 'linkUrl':
      return <span className="label label-success">{text}</span>;
    case 'rssUrl':
      return <span className="label label-danger">{text}</span>;
    default:
      return text;
  }
};

const rewriteFavicon = (faviconUrl, id) => {
  if (faviconUrl) {
    return `/rest/links/${id}/favicon`;
  }
  return '/static/default.png';
};

const UILinkListElement = ({ id, onUpdateLink, onClickLink, faviconUrl, listColumns,
  feedUpdates, hasRssUrl, onShowRssDetails, rssDetails, selectedLinkForDetails, link }) =>
  (<span>
    <ListGroupItem onClick={() => onClickLink(id)} href={`/leave?target=${id}`} target="_blank">
      {listColumns.map((columnName, index) => {
        const text = link[columnName];
        if (index === 0) {
          return (
            <div key={Math.random()}>
              <img width="16" src={rewriteFavicon(faviconUrl, id)} alt="favicon" />
              {' '}
              {display(columnName, text)}
              { feedUpdates ? (
                <span
                  style={styleFeedUpdate}
                  role="link"
                  tabIndex="0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShowRssDetails(id);
                  }}
                >
                  {' '}(New: {feedUpdates.value})
                </span>
              ) : '' }
              { hasRssUrl && !feedUpdates ? '(New: ???)' : '' }
              <Button
                className="pull-right btn-xs"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateLink(); }}
              >E</Button>
            </div>
          );
        }
        return (<div key={Math.random()} style={styleRow}>{display(columnName, text)}</div>);
      })}
      {' '}
    </ListGroupItem>
    { id === selectedLinkForDetails ? rssDetails.map(e => (
      <ListGroupItem key={Math.random()} href={e.link} target="_blank">
        <img width="16" src="/static/sub.png" alt="sub item" />
        {e.title}
      </ListGroupItem>
    )) : '' }
  </span>);

UILinkListElement.propTypes = {
  id: PropTypes.string.isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  faviconUrl: PropTypes.string,
  feedUpdates: PropTypes.shape(),
  hasRssUrl: PropTypes.bool.isRequired,
  onShowRssDetails: PropTypes.func.isRequired,
  rssDetails: ImmutablePropTypes.listOf(PropTypes.shape()),
  selectedLinkForDetails: PropTypes.string,
  link: PropTypes.shape().isRequired,
  listColumns: ImmutablePropTypes.listOf(PropTypes.string).isRequired,
};
UILinkListElement.defaultProps = {
  faviconUrl: null,
  feedUpdates: null,
  selectedLinkForDetails: null,
  rssDetails: Immutable.List(),
};

const mapStateToProps = state => ({
  selectedLinkForDetails: state.mainData.selectedLinkForDetails,
  rssDetails: state.mainData.feedUpdatesDetails,
  listColumns: state.mainData.listColumns,
});

const mapDispatchToProps = dispatch => ({
  onShowRssDetails: id => dispatch(fetchRssUpdatesDetails(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UILinkListElement);
