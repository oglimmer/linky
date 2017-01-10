
import React from 'react';

import Header from './Header';
import Footer from './Footer';


export default (props) => {
	return (
		<div>
			<Header logout={props.logout} isLoggedIn={props.isLoggedIn} />
			<div className="container">
				{props.children}
				<Footer />
			</div>
		</div>
	);
}
