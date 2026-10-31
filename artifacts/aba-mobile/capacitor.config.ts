import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ababank.mobile',
  appName: 'ABA Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
