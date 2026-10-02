import React, { createContext, useContext, useState } from 'react';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';

const AuthContext = createContext(null);

// Get Google Client ID from environment with default fallback
const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '193810371236-rf2n214p38hv69uh6c2ethmkamsckfff.apps.googleusercontent.com';
const isGoogleConfigured = Boolean(
  rawGoogleClientId && rawGoogleClientId.trim().length > 10
);

/**
 * Decode JWT token returned by Google Identity Services
 */
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[Auth] Failed to decode Google JWT token:', err);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('coup_le_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const logout = () => {
    try {
      googleLogout();
    } catch (e) {
      // Ignore if google script not active
    }
    setUser(null);
    localStorage.removeItem('coup_le_user');
  };

  const loginWithGoogle = (credentialToken) => {
    const payload = decodeJwt(credentialToken);
    if (!payload) return;

    const googleUser = {
      id: payload.sub,
      name: payload.name || payload.given_name || 'Love Partner',
      email: payload.email || '',
      avatar: payload.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(payload.name || 'Love')}`,
      provider: 'google',
    };

    setUser(googleUser);
    localStorage.setItem('coup_le_user', JSON.stringify(googleUser));
  };

  const loginCustom = (userData) => {
    const customUser = {
      id: 'usr_' + Date.now(),
      name: userData.name || 'Love Partner',
      email: userData.email || '',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userData.name || 'Love')}`,
      provider: 'custom',
    };
    setUser(customUser);
    localStorage.setItem('coup_le_user', JSON.stringify(customUser));
  };

  const contextValue = {
    user,
    isAuthenticated: Boolean(user),
    isGoogleConfigured,
    googleClientId: rawGoogleClientId,
    loginWithGoogle,
    loginCustom,
    logout,
  };

  // If Google Client ID is configured, wrap with GoogleOAuthProvider
  if (isGoogleConfigured) {
    return (
      <GoogleOAuthProvider clientId={rawGoogleClientId}>
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      </GoogleOAuthProvider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
