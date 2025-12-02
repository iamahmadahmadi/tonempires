export const mockWebApp = {
    // Theme parameters for styling the app
    themeParams: {
      bg_color: '#1a1a1a',      // Dark background color
      text_color: '#ffffff',    // White text color
      button_color: '#3b82f6',  // Blue button color
    },
  
    // CloudStorage to simulate Telegram's storage API using localStorage
    CloudStorage: {
      getItem: (key, callback) => {
        const value = localStorage.getItem(key);
        callback(null, value);  // Null error indicates success
      },
      setItem: (key, value, callback) => {
        localStorage.setItem(key, value);
        callback(null);         // Null error indicates success
      },
    },
  
    // Simulated initialization data with expanded user information
    initDataUnsafe: {
      user: {
        id: 84895335,           // Unique user ID
        first_name: 'Test',     // Sample first name
        last_name: 'User',      // Sample last name
        username: 'testuser',   // Sample username
        is_premium: false,      // Premium status indicator
      },
    },
  
    // Placeholder for app readiness with logging
    ready: () => console.log('WebApp ready'),
  
    // Placeholder for app expansion with logging
    expand: () => console.log('WebApp expanded'),
  
    // Mock BackButton for navigation
    BackButton: {
      show: () => console.log('BackButton shown'),
      hide: () => console.log('BackButton hidden'),
      onClick: (callback) => {
        setTimeout(callback, 1000);  // Simulate click after 1-second delay
      },
    },
  
    // Mock MainButton for primary actions
    MainButton: {
      show: () => console.log('MainButton shown'),
      hide: () => console.log('MainButton hidden'),
      setText: (text) => console.log(`MainButton text set to: ${text}`),
      onClick: (callback) => {
        setTimeout(callback, 1000);  // Simulate click after 1-second delay
      },
    },
  
    // Mock SettingsButton for settings access
    SettingsButton: {
      show: () => console.log('SettingsButton shown'),
      hide: () => console.log('SettingsButton hidden'),
      onClick: (callback) => {
        setTimeout(callback, 1000);  // Simulate click after 1-second delay
      },
    },
  };