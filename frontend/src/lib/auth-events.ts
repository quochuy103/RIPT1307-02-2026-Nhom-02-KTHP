export const AUTH_UNAUTHORIZED_EVENT = 'cutie-cuts:auth-unauthorized';

export const dispatchUnauthorizedEvent = () => {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
};