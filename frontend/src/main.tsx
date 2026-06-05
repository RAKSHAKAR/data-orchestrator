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

  const msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}

init();
