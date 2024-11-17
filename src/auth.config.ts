import type { NextAuthConfig } from 'next-auth';

// Define public and private paths
const publicPaths = ['/', '/authclient/Register', '/authclient/Login'];
const privatePaths = ['/profile'];

// Extend the Session and JWT types to include sessionId
declare module 'next-auth' {
  interface Session {
    sessionId?: string;
  }
  interface JWT {
    sessionId?: string;
  }
}

// Helper function to generate random string using Web Crypto API
async function generateSessionId(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Define authConfig with satisfies NextAuthConfig
export const authConfig = {
  pages: {
    signIn: '/authclient/Login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isUserSession = !!auth?.user;
      const path = nextUrl.pathname;

      // Check if the path is public
      const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

      // Check if the path is private
      const isPrivatePath = privatePaths.some(privatePath => path.startsWith(privatePath));

      // Handle public paths - always accessible
      if (isPublicPath) {
        return true;
      }

      // Handle private paths - require authentication
      if (isPrivatePath) {
        return isUserSession;
      }

      // Handle home page
      const isOnHomePage = path === '/';
      if (isOnHomePage) {
        if (isUserSession) return true;
        return false; // Redirect unauthenticated users to login page
      }

      // Handle authenticated users trying to access auth pages
      const isAuthPage = path.startsWith('/authclient');
      if (isAuthPage && isUserSession) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Default to allowing access
      return true;
    },
    async jwt({ token, user }) {
      // Generate sessionId if the user exists
      if (user) {
        token.sessionId = await generateSessionId();
      }
      return token;
    },
    async session({ session, token }) {
      // Attach sessionId from token to the session
      if (token.sessionId && typeof token.sessionId === 'string') {
        session.sessionId = token.sessionId;
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;