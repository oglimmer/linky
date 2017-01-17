
// https://react-bootstrap.github.io/components.html#forms

import React, { Component } from 'react';
import _ from 'lodash';
import { FormGroup, ControlLabel, FormControl, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import fetch from '../utils/fetch';


class PortalPage extends Component {

  static handleSubmit(event) {
    event.preventDefault();
    return false;
  }

  constructor(props) {
    super(props);
    this.state = {
      linkUrl: '',
      submitAllowed: false,
      linkList: [],
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);

    fetch.get('/rest/links', this.props.authToken).then(response => response.json(),
    ).then((json) => {
      this.setState({
        linkList: json,
      });
    }).catch((ex) => {
      console.log(ex);
    });
  }

  handleChange(ctrlName, e) {
    const value = e.target.value;
    this.setState((state) => {
      const newState = state;
      newState[ctrlName] = value;
      newState.submitAllowed = newState.linkUrl.length > 0;
      return newState;
    });
  }

  handleAdd(event) {
    event.preventDefault();
    let linkUrl = this.state.linkUrl;
    if (!linkUrl.startsWith('http')) {
      linkUrl = `http://${linkUrl}`;
    }
    fetch.post('/rest/links', { linkUrl }, this.props.authToken).then(response => response.json(),
    ).then((json) => {
      this.setState(newState => ({
        linkUrl: '',
        submitAllowed: false,
        linkList: [...newState.linkList, { id: json.id, linkUrl }],
      }));
    }).catch((ex) => {
      console.log(ex);
    });
  }

  handleDelete(event, elem) {
    event.preventDefault();
    fetch.delete(`/rest/links/${elem.id}`, this.props.authToken).then(() => {
      this.setState(newState => ({
        linkList: _.remove(newState.linkList, value => value.id !== elem.id),
      }));
    }).catch((ex) => {
      console.log(ex);
    });
  }

  render() {
    const { submitAllowed } = this.state;
    const submitStyle = submitAllowed ? 'primary' : 'default';
    const list = _.map(this.state.linkList, elem => (
      <ListGroupItem
        key={elem.id}
        href={elem.linkUrl}
      >
        {elem.linkUrl}
        <Button className="pull-right btn-xs" onClick={e => this.handleDelete(e, elem)}>X</Button>
      </ListGroupItem>
    ));
    return (
      <div>
        <form onSubmit={PortalPage.handleSubmit}>
          <FormGroup controlId="linkUrl">
            <ControlLabel>Add a new link</ControlLabel>
            <FormControl
              type="text"
              value={this.state.linkUrl}
              placeholder="url"
              onChange={e => this.handleChange('linkUrl', e)}
              autoFocus="true"
              autoComplete="off"
            />
            <FormControl.Feedback />
          </FormGroup>
          <Button
            type="submit"
            bsStyle={submitStyle}
            onClick={this.handleAdd}
            disabled={!submitAllowed}
          >
            Create link
          </Button>
          <hr />
          <ListGroup>
            {list}
          </ListGroup>
        </form>
      </div>
    );
  }

}
PortalPage.propTypes = {
  authToken: React.PropTypes.string.isRequired,
};

export default PortalPage;
