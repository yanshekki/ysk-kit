/// <reference types="vite/client" />

declare const process: {
  env: {
    API_PUBLIC_URL?: string;
    WEB_PUBLIC_URL?: string;
    ADMIN_PUBLIC_URL?: string;
  };
};
