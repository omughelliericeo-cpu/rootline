// Shared Sentry settings for browser, server and edge. Privacy first: no
// cookies, request bodies or user info are sent (bodies can contain shopper
// emails); only the request-id and user-agent headers are kept.
export const sentryBaseOptions = {
  tracesSampleRate: 0, // errors only for the MVP; tracing can be switched on later
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    httpHeaders: { request: { allow: ["x-request-id", "user-agent"] }, response: false },
    urlQueryParams: false,
  },
};
