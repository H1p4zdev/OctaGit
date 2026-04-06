import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gitmobile.app',
  appName: 'GitMobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
