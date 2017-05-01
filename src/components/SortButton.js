
import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { changeSortingLink } from '../redux/actions';

// ----------------------Presentational Component-----------------------------------

const SortButton = ({ byColumn, text, onClick, selected }) => (
  <Button onClick={() => onClick(byColumn)} className="btn-xs">
    {selected === byColumn ? '>' : ''}
    {text}
    {selected === byColumn ? '<' : ''}
  </Button>
);
SortButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  byColumn: PropTypes.string.isRequired,
  selected: PropTypes.string.isRequired,
};

// ----------------------Container Component-----------------------------------

const mapStateToProps = state => ({
  selected: state.mainData.sortingByColumn,
});

const mapDispatchToProps = dispatch => ({
  onClick: byColumn => dispatch(changeSortingLink(byColumn)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SortButton);
