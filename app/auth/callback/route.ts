import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Supabase OAuth Callback Route Handler
 * Exchanges auth code for session tokens, checks for username existence,
 * and seamlessly forwards to /choose-username or the Home page.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const rawNext = requestUrl.searchParams.get('next') ?? '/';
  // If next is '/profile', default to home page as requested
  const next = rawNext === '/profile' ? '/' : rawNext;
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('[OAuth Callback] Provider error:', error, errorDescription);
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        // Enforce safe relative redirect path to prevent open redirect vulnerabilities
        const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

        // Check if user has chosen a username
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let targetUrl = safeNext;

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

          const hasUsername = Boolean(profile?.username || user.user_metadata?.username);
          if (!hasUsername) {
            targetUrl = `/choose-username?next=${encodeURIComponent(safeNext)}`;
          }
        }

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(new URL(targetUrl, requestUrl.origin));
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${targetUrl}`);
        } else {
          return NextResponse.redirect(new URL(targetUrl, requestUrl.origin));
        }
      }

      console.error('[OAuth Callback] Code exchange error:', exchangeError);
      const redirectUrl = new URL('/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      console.error('[OAuth Callback] Unexpected error:', err);
      const redirectUrl = new URL('/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'Authentication failed unexpectedly. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
