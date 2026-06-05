import type { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
  auth: {
    // This is the ONLY mandatory field. We'll read it from env var or use a placeholder GUID.
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "11111111-1111-1111-1111-111111111111",
    // Authority sets the tenant. If multi-tenant, use common.
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    // The redirect URI where MSAL will return after login. Usually the home page.
    redirectUri: "/",
    postLogoutRedirectUri: "/"
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "Files.ReadWrite.All"]
};
