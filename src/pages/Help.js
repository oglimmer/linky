
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { TAGS } from '../util/TagRegistry';

import { getMeUserInformation, deleteAccount } from '../redux/actions';
import BuildInfo from '../util/BuildInfo';

const HelpPage = ({ authToken, onMeUserInformation, onDeleteAccount }) => (
  <div>
    <h1>Help</h1>
    <h3>Why is there no &#39;create account&#39; button?</h3>
    <p>
      I didn&#39;t want to create all the create account, forgot password, reset password
      functionality. So to make my life a bit easier I just integrated all those &#39;login via a
      3rd party webpage&#39; buttons.
    </p>
    <h3>How is search working?</h3>
    <p>
      Search has a local and a server mode. While typing (until you hit enter) search looks only
      in the currently visible list of links and all available tags, this is called local mode.
      After hitting enter the server mode is activated and thus all links are searched.
    </p>
    <p>
      Server mode offers * and ? as regular wildcards. Local mode always searchs with leading
      and trailing *.
    </p>
    <p>
      On server mode start with `tags:`, `url:`, `notes:`, `rss:` or `title:` to search just this
      field. Otherwise a search will look into all fields.<br />
      You can also use the `host:` to search for a host name or `rhost:` to search for a host but in
      reverse order, so www.oglimmer.de would be de.oglimmer.www.
      As your search cannot start with a * you have to use `rhost:de.oglimmer*` to search for all
      links in any oglimmer.de domain.
    </p>
    <h3>How is import/export working?</h3>
    <p>
      <b>Export</b>: after hitting the export button, the system generates a HTML file in the
      format of `NETSCAPE-Bookmark-file-1` into the field `NETSCAPE-Bookmark-file-1`. Copy
      the content from this field into a file new file called `Bookmarks.html`. Use this file
      to import your bookmarks into any browser.
    </p>
    <p>
      <b>Import</b>: You probably need to start with an export of your bookmarks from your
      current browser. For <a href="https://support.google.com/chrome/answer/96816?hl=en" target="_blank" rel="noopener noreferrer">
      Chrome see here</a>, <a href="https://support.mozilla.org/en-US/kb/export-firefox-bookmarks-to-backup-or-transfer" target="_blank" rel="noopener noreferrer">
      Firefox see here</a>, Safari go to menu `File` -&#62; `Export Bookmarks`. Open the
      generated HTML file with an editor of your choice. Copy the content into the field
      `NETSCAPE-Bookmark-file-1`. Use `Tag Prefix` to prefix all imported tags, so you can easily
      differentiate your imported tags from existing ones. Use `Root node for tags` to specify
      the root node for your imported tags.
    </p>
    <h3>Why have tags different colors in the tags hierarchy?</h3>
    <p>
      Linky uses 3 different colors for tags as they can fall into 3 different types: (1)
      System tags are red, (2) user created tags with no associated links are green and (3) user
      created tags with attached links are black.
    </p>
    <div>
      System tags are:
      <ul>
        { TAGS.sort().map(tag => (<li key={tag}>{tag}</li>)) }
      </ul>
    </div>
    <p>
      <b>all</b>: shows always all links added to the system by you. You cannot remove this tag.
    </p>
    <p>
      <b>archive</b>: shows always all archives.
    </p>
    <p>
      <b>broken</b>: shows all links failing a nightly http get validation.
    </p>
    <p>
      <b>due</b>: shows all due links. When a link has a tag in the format yyyy-mm-dd it will get
      the duedate tag and starting this date, the system will add due.
    </p>
    <p>
      <b>duedate</b>: shows all links having a tag in going by the format yyyy-mm-dd.
    </p>
    <p>
      <b>duplicate</b>: shows all links having a link url assigned which is assigned to another link
      as well.
    </p>
    <p>
      <b>locked</b>: use this tag to remove a link from the nightly validation. All links on non
      public urls should have, otherwise linky constantly marks your link as broken or changes it
      to something like the intranet login page.
    </p>
    <p>
      <b>portal</b>: tag initially selected, so all tags with this tag are on your portal.
    </p>
    <p>
      <b>root</b>: system internal tag. Defines the root node of the tag hierarchy. You must not
      use this.
    </p>
    <p>
      <b>rss</b>: shows all links having an associated RSS url
    </p>
    <p>
      <b>untagged</b>: shows all links where you didn&#39;t specify any tag when adding. Keep in
      mind that the system added &#39;all&#39; and &#39;untagged&#39; during the initial creation
      process.
    </p>
    <p>
      <b>urlupdated</b>: shows all links which were updated during the nightly http get validation,
      as the response resulted in a 3** http result code and therefore linky stored the new final
      url.
    </p>
    <h3>What are those 2 cookies you store?</h3>
    <p>
      <b>vistorToken</b>: Lifetime: 1 year. id to identify your last used oauth provider. So
      we can automatically redirect you them and re-login is transparent to you.
    </p>
    <div>
      <b>authToken</b>: Lifetime: session. <a href="https://jwt.io/" target="_blank" rel="noopener noreferrer">JWT</a> style authorization
      token. The payload contains only your user-id within this system, next to iat and exp.
      { authToken ? (
        <div>
          <div>
            Your current token is:
            <div className="horizontalScroll">{authToken}</div>
          </div>
          <div>
            Click this button to see what we&#39;ve stored about your:{' '}
            <Button onClick={onMeUserInformation} className="btn-sm">I am curious</Button>
          </div>
          <div>
            As this page is build with reactjs, all communication to/from the server is via a
            REST api anyway, so you can play around with it by grabbing this <a href="https://github.com/oglimmer/linky/blob/master/build/test/test.sh" target="_blank" rel="noopener noreferrer">
              shell script
            </a>.
            Set the shell variable AUTH_TOKEN to your token,
            set BASE_URL to https://linky1.com and try:
            &#39;./test.sh getlinks&#39;
          </div>
        </div>
      ) : (
        <div>
          When logged in, you can see here all personal information we have stored about you.
        </div>
      ) }
    </div>
    <h3>Known limitations</h3>
    <div>
      <ul>
        <li>When clicking on a RSS line item it doesn&#39;t get removed as a `new` item.</li>
      </ul>
    </div>
    <h3>Where can I file a bug?</h3>
    <p>
      As this project is hosted on github.com, please use <a href="https://github.com/oglimmer/linky/issues" target="_blank" rel="noopener noreferrer">
      Issues</a> there. Rather like to talk to me? {BuildInfo.CONTACT}
    </p>
    <h3>How can I delete my account?</h3>
    { authToken ?
      <p>
        Press this button and we delete everything we&#39;ve stored about you:
        <Button onClick={onDeleteAccount} className="btn-xs">DELETE MY ACCOUNT</Button>
      </p>
      :
      <p>
        If you are logged in, you can press a button here and we delete everything we&#39;ve stored
        about you.
      </p>
    }
    <p>
      A note about account deletion: (A) While we do delete all information in our active database,
      we cannot simply delete your information on our offline backups. Those backups have a
      retention time of 1 month. (B) The data backend of this system is a CouchDB (3) and thus
      data deletion has some limitations, see <a href="https://wiki.apache.org/couchdb/HTTP_Document_API#DELETE" target="_blank" rel="noopener noreferrer">
      here</a>.
    </p>
  </div>
);
HelpPage.propTypes = {
  authToken: PropTypes.string,
  onMeUserInformation: PropTypes.func.isRequired,
  onDeleteAccount: PropTypes.func.isRequired,
};
HelpPage.defaultProps = {
  authToken: '',
};

const mapStateToProps = state => ({
  authToken: state.auth.token,
});

const mapDispatchToProps = dispatch => ({
  onMeUserInformation: () => dispatch(getMeUserInformation()),
  onDeleteAccount: () => dispatch(deleteAccount()),
});

export default connect(mapStateToProps, mapDispatchToProps)(HelpPage);
