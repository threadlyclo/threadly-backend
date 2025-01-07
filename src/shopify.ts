// src/shopify.ts

import axios from 'axios';

interface ShopifyConfig {
  apiKey: string;
  apiSecret: string;
  storeName: string;
}

class Shopify {
  private apiKey: string;
  private apiSecret: string;
  private storeName: string;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.storeName = config.storeName;
    this.baseUrl = `https://${this.storeName}.myshopify.com/admin/api/2023-10`;
  }

  async getProducts(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/products.json`, {
        headers: {
          'X-Shopify-Access-Token': this.apiSecret,
          'Content-Type': 'application/json'
        }
      });
      return response.data.products;
    } catch (error: any) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw error;
    }
  }

  // Weitere Methoden nach Bedarf hinzufügen
}

export default Shopify;
