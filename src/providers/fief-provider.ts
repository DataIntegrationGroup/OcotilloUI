import { type AuthProvider } from "@refinedev/core";
import { sha256 } from "js-sha256";
import { Fief, browser } from "@fief/fief";
import { jwtDecode } from "jwt-decode";
import { settings } from "@/settings";

export const fiefURL = (path: string) => {
  return `${window.location.protocol}//${window.location.host}${settings.urlprefix}/${path}`;
};

const fiefClient = new Fief(settings.fief);

export const getAuthState = () => {
  const authState = sessionStorage.getItem("fief-authstate");
  if (authState) {
    return JSON.parse(authState);
  }

  return null;
};

export const getAccessToken = async (refresh: boolean = false) => {
  const authstate = getAuthState();

  if (refresh) {
    const refresh_token = authstate?.tokenInfo.refresh_token;
    if (!refresh_token) return null;

    const [tokenInfo, userinfo] =
      await fiefClient.authRefreshToken(refresh_token);

    sessionStorage.setItem(
      "fief-authstate",
      JSON.stringify({ tokenInfo, userinfo }),
    );

    return tokenInfo.access_token;
  }

  return authstate?.tokenInfo.access_token || null;
};

const gravatarUrl = (email: string) => {
  let hash = email.trim().toLowerCase();
  return `https://www.gravatar.com/avatar/${sha256(hash)}`;
};

export const authProvider: AuthProvider = {
  login: async ({ providerName }) => {
    if (providerName === "fief") {
      const authstate = getAuthState();

      if (authstate?.tokenInfo) {
        return { success: true, redirectTo: "/" };
      }

      const fiefAuth = new browser.FiefAuth(fiefClient);
      await fiefAuth.redirectToLogin(fiefURL("callback"), {
        scope: ["offline_access", "openid"],
      });

      return { success: true };
    }

    return {
      success: false,
      error: {
        message: "Login failed",
        name: "Invalid email or password",
      },
    };
  },

  logout: async () => {
    const fiefAuth = new browser.FiefAuth(fiefClient);
    sessionStorage.removeItem("fief-authstate");
    await fiefAuth.logout(fiefURL("login"));
    return { success: true };
  },

  onError: async (error) => {
    if (error.response?.status === 401) {
      return { logout: false };
    }

    return { error };
  },

  check: async () => {
    const authState = getAuthState();
    return { authenticated: Boolean(authState.userinfo) };
  },

  getPermissions: async () => {
    const access_token = await getAccessToken();
    if (!access_token) return [];

    const token = jwtDecode(access_token);
    return token["permissions"] || [];
  },

  getIdentity: async () => {
    let authstate = getAuthState();
    if (!authstate?.userinfo) return null;

    return {
      id: authstate.userinfo.sub, // Unique user ID
      name: authstate.userinfo.name || authstate.userinfo.email, // Use name if available, fallback to email
      email: authstate.userinfo.email,
      avatar: gravatarUrl(authstate.userinfo.email),
    };
  },
};
