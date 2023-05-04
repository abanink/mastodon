import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { registrationsOpen } from 'mastodon/initial_state';
import { connect } from 'react-redux';
import Icon from 'mastodon/components/icon';
import classNames from 'classnames';
import { openModal, closeModal } from 'mastodon/actions/modal';
import Button from 'mastodon/components/button';

const messages = defineMessages({
  loginPrompt: { id: 'interaction_modal.login.prompt', defaultMessage: 'Domain of your home server, e.g. mastodon.social' },
});

const mapStateToProps = (state, { accountId }) => ({
  displayNameHtml: state.getIn(['accounts', accountId, 'display_name_html']),
});

const mapDispatchToProps = (dispatch) => ({
  onSignupClick() {
    dispatch(closeModal());
    dispatch(openModal('CLOSED_REGISTRATIONS'));
  },
});

class LoginForm extends React.PureComponent {

  static propTypes = {
    resourceUrl: PropTypes.string,
    intl: PropTypes.object.isRequired,
  };

  state = {
    value: '',
    expanded: false,
    selectedOption: -1,
    options: [
      'mastodon.social',
      'mastodon.online',
      'universeodon.com',
      'mstdn.social',
      // TODO
    ],
  };

  setRef = c => {
    this.input = c;
  };

  handleChange = ({ target }) => {
    this.setState({ value: target.value });
  };

  handleSubmit = () => {
    const { value } = this.state;
    const { resourceUrl } = this.props;

    try {
      const redirectUrl = new URL(`https://${value}/authorize_interaction?uri=${encodeURIComponent(resourceUrl)}`);
      window.location.href = redirectUrl;
    } catch (err) {
      // TODO
    }
  };

  handleFocus = () => {
    this.setState({ expanded: true });
  };

  handleBlur = () => {
    this.setState({ expanded: false });
  };

  handleKeyDown = (e) => {
    const { options, selectedOption } = this.state;

    switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();

      if (options.length > 0) {
        this.setState({ selectedOption: Math.min(selectedOption + 1, options.length - 1) });
      }

      break;
    case 'ArrowUp':
      e.preventDefault();

      if (options.length > 0) {
        this.setState({ selectedOption: Math.max(selectedOption - 1, -1) });
      }

      break;
    case 'Enter':
      e.preventDefault();

      if (selectedOption === -1) {
        this.handleSubmit();
      } else if (options.length > 0) {
        this.setState({ value: options[selectedOption] }, () => this.handleSubmit());
      }

      break;
    }
  };

  handleOptionClick = e => {
    const index  = Number(e.currentTarget.getAttribute('data-index'));
    const option = this.state.options[index];

    e.preventDefault();
    this.setState({ selectedOption: index, value: option }, () => this.handleSubmit());
  };

  render () {
    const { intl } = this.props;
    const { expanded, options, selectedOption } = this.state;

    return (
      <div className={classNames('interaction-modal__login', { active: expanded })}>
        <div className='interaction-modal__login__input'>
          <input
            ref={this.setRef}
            type='text'
            value={this.state.value}
            placeholder={intl.formatMessage(messages.loginPrompt)}
            aria-label={intl.formatMessage(messages.loginPrompt)}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
          />

          <Button onClick={this.handleSubmit}><FormattedMessage id='interaction_modal.login.action' defaultMessage='Take me home' /></Button>
        </div>

        <div className='search__popout'>
          <div className='search__popout__menu'>
            {options.slice(0, 3).map((domain, i) => (
              <button key={domain} onMouseDown={this.handleOptionClick} data-index={i} className={classNames('search__popout__menu__item', { selected: selectedOption === i })}>
                {domain}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

}

const IntlLoginForm = injectIntl(LoginForm);

class InteractionModal extends React.PureComponent {

  static propTypes = {
    displayNameHtml: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.oneOf(['reply', 'reblog', 'favourite', 'follow']),
    onSignupClick: PropTypes.func.isRequired,
  };

  handleSignupClick = () => {
    this.props.onSignupClick();
  };

  render () {
    const { url, type, displayNameHtml } = this.props;

    const name = <bdi dangerouslySetInnerHTML={{ __html: displayNameHtml }} />;

    let title, actionDescription, icon;

    switch(type) {
    case 'reply':
      icon = <Icon id='reply' />;
      title = <FormattedMessage id='interaction_modal.title.reply' defaultMessage="Reply to {name}'s post" values={{ name }} />;
      actionDescription = <FormattedMessage id='interaction_modal.description.reply' defaultMessage='With an account on Mastodon, you can respond to this post.' />;
      break;
    case 'reblog':
      icon = <Icon id='retweet' />;
      title = <FormattedMessage id='interaction_modal.title.reblog' defaultMessage="Boost {name}'s post" values={{ name }} />;
      actionDescription = <FormattedMessage id='interaction_modal.description.reblog' defaultMessage='With an account on Mastodon, you can boost this post to share it with your own followers.' />;
      break;
    case 'favourite':
      icon = <Icon id='star' />;
      title = <FormattedMessage id='interaction_modal.title.favourite' defaultMessage="Favourite {name}'s post" values={{ name }} />;
      actionDescription = <FormattedMessage id='interaction_modal.description.favourite' defaultMessage='With an account on Mastodon, you can favourite this post to let the author know you appreciate it and save it for later.' />;
      break;
    case 'follow':
      icon = <Icon id='user-plus' />;
      title = <FormattedMessage id='interaction_modal.title.follow' defaultMessage='Follow {name}' values={{ name }} />;
      actionDescription = <FormattedMessage id='interaction_modal.description.follow' defaultMessage='With an account on Mastodon, you can follow {name} to receive their posts in your home feed.' values={{ name }} />;
      break;
    }

    let signupButton;

    if (registrationsOpen) {
      signupButton = (
        <a href='/auth/sign_up' className='link-button'>
          <FormattedMessage id='sign_in_banner.create_account' defaultMessage='Create account' />
        </a>
      );
    } else {
      signupButton = (
        <button className='link-button' onClick={this.handleSignupClick}>
          <FormattedMessage id='sign_in_banner.create_account' defaultMessage='Create account' />
        </button>
      );
    }

    return (
      <div className='modal-root__modal interaction-modal'>
        <div className='interaction-modal__lead'>
          <h3><span className='interaction-modal__icon'>{icon}</span> {title}</h3>
          <p>{actionDescription} <strong><FormattedMessage id='interaction_modal.sign_in' defaultMessage='You are not signed in. Where is your account hosted?' /></strong></p>
        </div>

        <IntlLoginForm resourceUrl={url} />

        <p><FormattedMessage id='interaction_modal.no_account_yet' defaultMessage='No account yet?' /> {signupButton}</p>
      </div>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(InteractionModal);
