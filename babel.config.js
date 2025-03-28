module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module:react-native-dotenv',
          {
            moduleName: '@env',
            path: '.env',
            blacklist: null,
            whitelist: [
              'SUPABASE_URL',
              'SUPABASE_ANON_KEY',
              'STRIPE_PUBLISHABLE_KEY',
              'ONESIGNAL_APP_ID',
              'SENTRY_DSN'
            ],
            safe: false,
            allowUndefined: true,
          },
        ],
      ],
    };
  };