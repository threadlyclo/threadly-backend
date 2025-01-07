// src/shopify.js

const axios = require('axios');

class Shopify {
  constructor(apiKey, apiSecret, storeName) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.storeName = storeName;
    this.baseUrl = `https://${storeName}.myshopify.com/admin/api/2024-10`;
  }

  async getProducts() {
    try {
      const response = await axios.get(`${this.baseUrl}/products.json`, {
        headers: {
          'X-Shopify-Access-Token': this.apiSecret,
          'Content-Type': 'application/json'
        }
      });
      return response.data.products;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw error;
    }
  }

  // Weitere Methoden nach Bedarf hinzufügen
}

module.exports = Shopify;
