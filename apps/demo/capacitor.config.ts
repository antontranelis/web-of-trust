import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.utopialab.weboftrust',
  appName: 'Web of Trust',
  webDir: 'dist',
  android: {
    flavor: 'fdroid',
  },
  plugins: {
    LiveUpdate: {
      appId: 'org.utopialab.weboftrust',
    },
  },
};

export default config;
