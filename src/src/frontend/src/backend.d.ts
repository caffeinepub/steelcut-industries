import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Specifications {
    weight: string;
    power: string;
    additional?: string;
    dimensions: string;
}
export interface Product {
    id: ProductId;
    specifications: Specifications;
    name: string;
    createdAt: Time;
    description: string;
    updatedAt: Time;
    category: Category;
    price: bigint;
    images: Array<ImageUrl>;
}
export type Category = string;
export type Time = bigint;
export type ImageUrl = string;
export type ProductId = string;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(name: string, description: string, specifications: Specifications, category: Category, price: bigint, imageUrls: Array<ImageUrl>): Promise<ProductId>;
    addProductImage(productId: ProductId, imageUrl: ImageUrl): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProduct(id: ProductId): Promise<Product>;
    getProductsByCategory(category: Category): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeProductImage(productId: ProductId, imageUrl: ImageUrl): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProducts(term: string): Promise<Array<Product>>;
    updateProduct(id: ProductId, name: string, description: string, specifications: Specifications, category: Category, price: bigint, imageUrls: Array<ImageUrl>): Promise<void>;
}
