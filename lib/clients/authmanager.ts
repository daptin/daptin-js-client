import {TokenGetter} from "./interface";
import ActionManager from "./actionmanager";

export class AuthManager {
  private actionManager: ActionManager;
  private tokenGetter: TokenGetter;

  constructor(actionManager: ActionManager, tokenGetter: TokenGetter) {
    this.actionManager = actionManager;
    this.tokenGetter = tokenGetter;
  }

  signup(name: string, email: string, password: string, passwordConfirm: string) {
    return this.actionManager.doAction('user_account', 'signup', {
      name: name,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm
    });
  }

  signin(email: string, password: string) {
    return this.actionManager.doAction('user_account', 'signin', {
      email: email,
      password: password
    });
  }

  signout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    return Promise.resolve();
  }

  refreshToken(userId: string) {
    return this.actionManager.doAction('user_account/' + userId, 'jwt.token', {});
  }

  requestPasswordReset(email: string) {
    return this.actionManager.doAction('user_account', 'generate_password_reset_flow', {
      email: email
    });
  }

  verifyPasswordReset(email: string, verification: string, password: string) {
    return this.actionManager.doAction('user_account', 'generate_password_reset_verify_flow', {
      email: email,
      verification: verification,
      password: password
    });
  }

  registerOtp(userId: string, email: string) {
    return this.actionManager.doAction('user_account/' + userId, 'register_otp', {
      email: email
    });
  }

  verifyOtp(email: string, otp: string) {
    return this.actionManager.doAction('user_account', 'verify_otp', {
      email: email,
      otp: otp
    });
  }

  beginOAuth(oauthConnectId: string) {
    return this.actionManager.doAction('oauth_connect/' + oauthConnectId, 'oauth_login_begin', {});
  }

  completeOAuth(code: string, state: string, authenticator: string) {
    return this.actionManager.doAction('oauth_token', 'oauth.login.response', {
      code: code,
      state: state,
      authenticator: authenticator
    });
  }

  extractToken(response: any[]): string | null {
    if (!response || !Array.isArray(response)) {
      return null;
    }
    for (const item of response) {
      if (item.ResponseType === 'client.store.set' && item.Attributes?.key === 'token') {
        return item.Attributes.value;
      }
    }
    return null;
  }
}

export default AuthManager;
