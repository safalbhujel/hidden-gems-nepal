// lib/utils/block-burner-emails.ts

/**
 * High-risk disposable / burner domain blacklist.
 * Using a Set gives O(1) hash-lookup performance on every submission.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'throwawaymail.com',
  'getairmail.com',
  'dispostable.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'mohmal.com',
  'generator.email',
  'inboxkitten.com',
  'burnermail.io',
  'tempail.com',
  'mytemp.email',
  'crazymailing.com',
  'dropmail.me',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedEmail?: string;
}

/**
 * Validates syntax and enforces anti-burner domain policies.
 */
export function validateEmailDomain(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const sanitizedEmail = rawEmail.trim().toLowerCase();

  // Basic RFC 5322 standard check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const parts = sanitizedEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Malformed email structure.' };
  }

  const domain = parts[1];

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Disposable or temporary email addresses are not permitted. Please use a permanent email.',
    };
  }

  return {
    isValid: true,
    sanitizedEmail,
  };
}
