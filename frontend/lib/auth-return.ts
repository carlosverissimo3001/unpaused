const AUTH_RETURN_KEY = 'auth_return_url';

export function setAuthReturnUrl(url: string): void {
  sessionStorage.setItem(AUTH_RETURN_KEY, url);
}

export function consumeAuthReturnUrl(): string | null {
  const url = sessionStorage.getItem(AUTH_RETURN_KEY);
  if (url) {
    sessionStorage.removeItem(AUTH_RETURN_KEY);
  }
  return url;
}
