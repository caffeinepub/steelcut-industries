import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Time "mo:core/Time";
import Option "mo:core/Option";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Persisted state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let products = Map.empty<Text, Product>();
  var nextProductId = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Data Model
  type ProductId = Text;
  type ImageUrl = Text;
  type Category = Text;

  public type UserProfile = {
    name : Text;
  };

  type Specifications = {
    power : Text;
    dimensions : Text;
    weight : Text;
    additional : ?Text;
  };

  type Product = {
    id : ProductId;
    name : Text;
    description : Text;
    specifications : Specifications;
    category : Category;
    price : Nat;
    images : [ImageUrl];
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Management
  public shared ({ caller }) func addProduct(name : Text, description : Text, specifications : Specifications, category : Category, price : Nat, imageUrls : [ImageUrl]) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    let id = nextProductId.toText();
    nextProductId += 1;

    let product : Product = {
      id;
      name;
      description;
      specifications;
      category;
      price;
      images = imageUrls;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    products.add(id, product);
    id;
  };

  public shared ({ caller }) func updateProduct(id : ProductId, name : Text, description : Text, specifications : Specifications, category : Category, price : Nat, imageUrls : [ImageUrl]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?existing) {
        let updatedProduct : Product = {
          id;
          name;
          description;
          specifications;
          category;
          price;
          images = imageUrls;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };

        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };

    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?_) {
        products.remove(id);
      };
    };
  };

  // Public Operations
  public query func getProduct(id : ProductId) : async Product {
    switch (products.get(id)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) { product };
    };
  };

  public query func getProductsByCategory(category : Category) : async [Product] {
    products.filter(func(_, p) { p.category == category }).values().toArray();
  };

  public query func searchProducts(term : Text) : async [Product] {
    products.filter(func(_, p) { p.name.contains(#text term) or p.description.contains(#text term) }).values().toArray();
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  // Image Management
  public shared ({ caller }) func addProductImage(productId : ProductId, imageUrl : ImageUrl) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add images");
    };

    switch (products.get(productId)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) {
        let imagesList = List.fromArray(product.images);
        imagesList.add(imageUrl);

        let updatedProduct : Product = {
          id = product.id;
          name = product.name;
          description = product.description;
          specifications = product.specifications;
          category = product.category;
          price = product.price;
          images = imagesList.toArray();
          createdAt = product.createdAt;
          updatedAt = Time.now();
        };

        products.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func removeProductImage(productId : ProductId, imageUrl : ImageUrl) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove images");
    };

    switch (products.get(productId)) {
      case (null) {
        Runtime.trap("Product not found");
      };
      case (?product) {
        let filteredImages = product.images.filter(func(img) { img != imageUrl });
        let updatedProduct : Product = {
          id = product.id;
          name = product.name;
          description = product.description;
          specifications = product.specifications;
          category = product.category;
          price = product.price;
          images = filteredImages;
          createdAt = product.createdAt;
          updatedAt = Time.now();
        };

        products.add(productId, updatedProduct);
      };
    };
  };
};
