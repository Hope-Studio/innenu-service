export const AUTH_DOMAIN = "authserver.nenu.edu.cn";
export const AUTH_SERVER = `https://${AUTH_DOMAIN}`;
export const AUTH_LOGIN_URL = `${AUTH_SERVER}/authserver/login`;
export const AUTH_CAPTCHA_URL = `${AUTH_SERVER}/authserver/common/openSliderCaptcha.htl`;
export const RE_AUTH_URL = `${AUTH_SERVER}/authserver/reAuthCheck/reAuthLoginView.do?isMultifactor=true`;
export const SALT_REGEXP =
  /input type="hidden" id="pwdEncryptSalt" value="([^"]+)" \/>/;
export const WEB_VPN_AUTH_DOMAIN = "authserver-443.webvpn.nenu.edu.cn";
export const WEB_VPN_AUTH_SERVER = `https://${WEB_VPN_AUTH_DOMAIN}`;
