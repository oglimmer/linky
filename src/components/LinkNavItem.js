
/* eslint-disable */

import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const LinkNavItem = (properties) => {
  const { active, disabled, className, style, ...props } = properties;

  // These are injected down by `<Nav>` for building `<SubNav>`s.
  delete props.activeKey;
  delete props.activeHref;

  if (!props.role) {
    if (props.href === '#') {
      props.role = 'button';
    }
  } else if (props.role === 'tab') {
    props['aria-selected'] = active;
  }

  return (
    <li
      role="presentation"
      className={classNames(className, { active, disabled })}
      style={style}
    >
      <Link
        {...props}
        disabled={disabled}
      />
    </li>
  );
};

LinkNavItem.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  role: PropTypes.string,
  href: PropTypes.string,
};
LinkNavItem.defaultProps = {
  active: false,
  disabled: false,
};

export default LinkNavItem;
