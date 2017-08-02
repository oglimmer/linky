
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { changeSortingLink } from '../redux/actions/links';

// ----------------------Presentational Component-----------------------------------

const SortButton = ({ byColumn, text, onClick, selected, order }) => (
  <Button onClick={() => onClick(byColumn)} className="btn-xs">
    {text}
    {selected === byColumn && order === 1 ? ' ↑' : ''}
    {selected === byColumn && order === -1 ? ' ↓' : ''}
  </Button>
);
SortButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  byColumn: PropTypes.string.isRequired,
  selected: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
};

// ----------------------Container Component-----------------------------------

const mapStateToProps = state => ({
  selected: state.mainData.sortingByColumn,
  order: state.mainData.sortingByColumnOrder,
});

const mapDispatchToProps = dispatch => ({
  onClick: byColumn => dispatch(changeSortingLink(byColumn)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SortButton);
