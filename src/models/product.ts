import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';

export interface Product extends BaseEntity {
  entityType: typeof EntityTypes.PRODUCT;
  productId: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
  images: string[];
  attributes: ProductAttribute[];
  status: ProductStatus;
  averageRating?: number;
  reviewCount?: number;
  tags: string[];
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'COLOR' | 'SIZE';
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
      pk: KeyBuilder.productPK(data.productId),
      sk: KeyBuilder.productSK(),
      entityType: EntityTypes.PRODUCT,
      createdAt: now,
      updatedAt: now,
      // GSI1: Products by Category (for browsing)
      gsi1pk: `${EntityTypes.PRODUCT}#CATEGORY#${data.category}`,
      gsi1sk: `${data.brand}#${data.name}`,
      // GSI2: Products by Brand (for brand-specific queries)
      gsi2pk: `${EntityTypes.PRODUCT}#BRAND#${data.brand}`,
      gsi2sk: `${data.category}#${data.name}`
    };

    return product;
  }

  static updateStock(product: Product, newStock: number): Product {
    const updatedProduct = {
      ...product,
      stock: newStock,
      updatedAt: new Date().toISOString()
    };

    // Update status based on stock level
    if (newStock === 0 && product.status === ProductStatus.ACTIVE) {
      updatedProduct.status = ProductStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && product.status === ProductStatus.OUT_OF_STOCK) {
      updatedProduct.status = ProductStatus.ACTIVE;
    }

    return updatedProduct;
  }

  static updateRating(product: Product, averageRating: number, reviewCount: number): Product {
    return {
      ...product,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviewCount,
      updatedAt: new Date().toISOString()
    };
  }

  static isInStock(product: Product): boolean {
    return product.stock > 0 && product.status === ProductStatus.ACTIVE;
  }

  static getDisplayPrice(product: Product): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency
    });
    return formatter.format(product.price);
  }
}