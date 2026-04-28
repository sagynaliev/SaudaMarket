export const APP_CONFIG = {
  NAME: 'Sauda',
  VERSION: '2.1.0',
  DESCRIPTION: 'Digital Commerce Infrastructure',
  CURRENCIES: ['USD', 'KZT', 'EUR'] as const,
  CATEGORIES: ['All', 'Electronics', 'Furniture', 'Fashion', 'Appliances'] as const,
  PRICE_UPDATE_INTERVAL: 60000, // Poll every minute
};
