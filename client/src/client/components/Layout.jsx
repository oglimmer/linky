'use strict'

import React from 'react';

import Header from './Header';
import Footer from './Footer';


export default (props) => (
	<div>
		<Header logout={props.logout} isLoggedIn={props.isLoggedIn} />
		<div class="container">
			{props.children}
			<Footer />
		</div>
	</div>
);
