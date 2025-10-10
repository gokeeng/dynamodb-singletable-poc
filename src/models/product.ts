import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';

export interface Product extends BaseEntity {
  EntityType: typeof EntityTypes.PRODUCT;
  ProductId: string;
  Name: string;
  Description: string;
  Category: string;
  Brand: string;
  Price: number;
  Currency: string;
  SKU: string;
  Stock: number;
  Images: string[];
  Attributes: ProductAttribute[];
  Status: ProductStatus;
  AverageRating?: number;
  ReviewCount?: number;
  Tags: string[];
}

export interface ProductAttribute {
  Name: string;
  Value: string;
  Type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'COLOR' | 'SIZE';
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export class ProductEntity {
  static create(data: Omit<Product, keyof BaseEntity>): Product {
    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      PK: KeyBuilder.productPK(data.ProductId),
      SK: KeyBuilder.productSK(),
      EntityType: EntityTypes.PRODUCT,
      CreatedAt: now,
      UpdatedAt: now,
      // GSI1: Products by Category (for browsing)
      GSI1PK: `${EntityTypes.PRODUCT}#CATEGORY#${data.Category}`,
      GSI1SK: `${data.Brand}#${data.Name}`,
      // GSI2: Products by Brand (for brand-specific queries)
      GSI2PK: `${EntityTypes.PRODUCT}#BRAND#${data.Brand}`,
      GSI2SK: `${data.Category}#${data.Name}`
    };

    return product;
  }

  static updateStock(product: Product, newStock: number): Product {
    const updatedProduct = {
      ...product,
      Stock: newStock,
      UpdatedAt: new Date().toISOString()
    };

    // Update status based on stock level
    if (newStock === 0 && product.Status === ProductStatus.ACTIVE) {
      updatedProduct.Status = ProductStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && product.Status === ProductStatus.OUT_OF_STOCK) {
      updatedProduct.Status = ProductStatus.ACTIVE;
    }

    return updatedProduct;
  }

  static updateRating(product: Product, averageRating: number, reviewCount: number): Product {
    return {
      ...product,
      AverageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      ReviewCount: reviewCount,
      UpdatedAt: new Date().toISOString()
    };
  }

  static isInStock(product: Product): boolean {
    return product.Stock > 0 && product.Status === ProductStatus.ACTIVE;
  }

  static getDisplayPrice(product: Product): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.Currency
    });
    return formatter.format(product.Price);
  }
}