import { BaseEntity, EntityTypes, KeyBuilder } from '../dal/base';

export interface Review extends BaseEntity {
  EntityType: typeof EntityTypes.REVIEW;
  ReviewId: string;
  ProductId: string;
  UserId: string;
  Rating: number; // 1-5 stars
  Title: string;
  Content: string;
  Verified: boolean; // Whether the reviewer purchased the product
  HelpfulCount: number;
  Images?: string[];
}

export class ReviewEntity {
  static create(data: Omit<Review, keyof BaseEntity>): Review {
    const now = new Date().toISOString();
    const review: Review = {
      ...data,
      PK: KeyBuilder.reviewPK(data.ReviewId),
      SK: KeyBuilder.reviewSK(),
      EntityType: EntityTypes.REVIEW,
      CreatedAt: now,
      UpdatedAt: now,
      // GSI1: Reviews by User (for user's review history)
      GSI1PK: KeyBuilder.userPK(data.UserId),
      GSI1SK: `${EntityTypes.REVIEW}#${now}`,
      // GSI2: Reviews by Product (for product review listing)
      ...KeyBuilder.reviewsByProductGSI2(data.ProductId),
      GSI2SK: `${EntityTypes.REVIEW}#${data.Rating}#${now}`
    };

    return review;
  }

  static updateHelpfulCount(review: Review, increment: number = 1): Review {
    return {
      ...review,
      HelpfulCount: Math.max(0, review.HelpfulCount + increment),
      UpdatedAt: new Date().toISOString()
    };
  }

  static isHighRating(review: Review): boolean {
    return review.Rating >= 4;
  }

  static getStarDisplay(review: Review): string {
    return '★'.repeat(review.Rating) + '☆'.repeat(5 - review.Rating);
  }
}