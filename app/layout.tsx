import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Navbar, type NavbarUserProfile } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserAvatar } from "@/lib/constants/avatars";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "HiddenGems Nepal",
  description:
    "Find quiet waterfalls, small tea shops, hilltop viewpoints, and peaceful spots and much more natural hidden gems across all 77 districts of Nepal. Shared by locals.",
  icons: {
    icon: "/icons/HiddenGemsNepal_Affinity.svg",
  },
};

async function getInitialUserProfile(): Promise<NavbarUserProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const handle =
      profile?.username ||
      (typeof user.user_metadata?.username === "string"
        ? user.user_metadata.username
        : null) ||
      user.email?.split("@")[0] ||
      null;

    if (!handle) return null;

    const { avatarUrl } = resolveUserAvatar(
      profile?.avatar_url,
      user.user_metadata
    );
    return { username: handle, avatarUrl };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUserProfile = await getInitialUserProfile();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col bg-background">
            <Navbar initialUserProfile={initialUserProfile} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
