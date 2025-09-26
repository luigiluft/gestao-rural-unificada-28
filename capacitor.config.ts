import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.51069dee367844c0ae7a263d916fdb9d',
  appName: 'gestao-rural-unificada-28',
  webDir: 'dist',
  server: {
    url: 'https://51069dee-3678-44c0-ae7a-263d916fdb9d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;