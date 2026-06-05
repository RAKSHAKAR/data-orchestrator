import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { settingsApi } from './services/api';
import './index.css'
import App from './App.tsx'

async function init() {
  try {
    const settings = await settingsApi.getSettings();
    if (settings.azure_client_id) msalConfig.auth.clientId = settings.azure_client_id;
    if (settings.azure_tenant_id) msalConfig.auth.authority = `https://login.microsoftonline.com/${settings.azure_tenant_id}`;
  } catch (e) {
    console.error("Could not fetch initial settings for MSAL", e);
  }

  let msalInstance: PublicClientApplication | null = null;
  try {
    // Ensure we have a valid GUID format even if placeholder, to prevent MSAL from throwing on init
    if (msalConfig.auth.clientId === "PLACEHOLDER-CLIENT-ID") {
      msalConfig.auth.clientId = "11111111-1111-1111-1111-111111111111";
    }
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  } catch (e) {
    console.error("MSAL Initialization failed", e);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {msalInstance ? (
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      ) : (
        <App />
      )}
    </StrictMode>,
  )
}

init();
