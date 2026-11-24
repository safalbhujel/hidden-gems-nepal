'use client';

/**
 * Clean recognizable Google Maps pin mark for direction action triggers.
 */
export function GoogleMapsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.25-1.5c.37-.81.7-1.51 1.17-2.26.96-1.54 2.21-2.86 3.16-4.4C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z"
        fill="#EA4335"
      />
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 .7.1 1.38.28 2.02L12 12V2z"
        fill="#4285F4"
      />
      <path
        d="M5.28 11.02c.29.99.71 1.93 1.13 2.82.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5V12l-6.72-.98z"
        fill="#FBBC04"
      />
      <path
        d="M12 12v10c.79 0 1-.95 1.25-1.5.37-.81.7-1.51 1.17-2.26.96-1.54 2.21-2.86 3.16-4.4.91-1.47 1.42-3.1 1.42-4.84 0-1.1-.26-2.14-.71-3.07L12 12z"
        fill="#34A853"
      />
      <circle cx="12" cy="9" r="3" fill="#FFFFFF" />
    </svg>
  );
}
