
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, ListGroupItem } from 'react-bootstrap';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Immutable from 'immutable';

import { fetchRssUpdatesDetails } from '../redux/actions/links';

const style = {
  borderBottom: '1px dotted #000',
};

const UILinkListElement = ({ id, pageTitle, onUpdateLink, onClickLink, faviconUrl,
  feedUpdates, hasRssUrl, onShowRssDetails, rssDetails, selectedLinkForDetails }) => (
    <span>
      <ListGroupItem onClick={() => onClickLink(id)} href={`/leave?target=${id}`} target="_blank">
        <img width="16" src={faviconUrl || '/static/default.png'} alt="favicon" />
        {' '}
        {pageTitle}
        {' '}
        { feedUpdates ? (
          <span
            style={style}
            role="link"
            tabIndex="0"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShowRssDetails(id); }}
          >
            (New: {feedUpdates.value})
          </span>
        ) : '' }
        { hasRssUrl && !feedUpdates ? '(New: ???)' : '' }
        <Button
          className="pull-right btn-xs"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateLink(); }}
        >E</Button>
      </ListGroupItem>
      { id === selectedLinkForDetails ? rssDetails.map(e => (
        <ListGroupItem key={Math.random()} href={e.link} target="_blank">
          <img width="16" src="/static/sub.png" alt="sub item" />
          {e.title}
        </ListGroupItem>
      )) : '' }
    </span>
);
UILinkListElement.propTypes = {
  id: PropTypes.string.isRequired,
  pageTitle: PropTypes.string.isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onClickLink: PropTypes.func.isRequired,
  faviconUrl: PropTypes.string,
  feedUpdates: PropTypes.shape(),
  hasRssUrl: PropTypes.bool.isRequired,
  onShowRssDetails: PropTypes.func.isRequired,
  rssDetails: ImmutablePropTypes.listOf(PropTypes.shape()),
  selectedLinkForDetails: PropTypes.string,
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
});

const mapDispatchToProps = dispatch => ({
  onShowRssDetails: id => dispatch(fetchRssUpdatesDetails(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UILinkListElement);
