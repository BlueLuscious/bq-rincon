/**
 * @description Defines the portable Content Security Policy directives enforced by every generated page.
 */
export const CONTENT_SECURITY_POLICY_DIRECTIVES = Object.freeze([
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "img-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "worker-src 'self'",
]);

/**
 * @description Defines the browser capabilities disabled by every public hosting environment.
 */
export const PERMISSIONS_POLICY =
  'camera=(), geolocation=(), microphone=(), payment=(), usb=()';
