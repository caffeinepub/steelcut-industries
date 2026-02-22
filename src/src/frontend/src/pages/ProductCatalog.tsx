import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useGetAllProducts } from "../hooks/useQueries";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package } from "lucide-react";
import type { Product } from "../backend.d";

export default function ProductCatalog() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchTerm]);

  const formatPrice = (price: bigint) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-64 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute -left-4 top-0 w-2 h-full bg-accent" />
          <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-2">
            OUR MACHINES
          </h1>
          <p className="text-muted-foreground text-lg">
            Industrial-grade bending and cutting solutions
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 h-12"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="border-2"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="border-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-2xl text-muted-foreground mb-2">
            NO PRODUCTS FOUND
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filter"
              : "No products available yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const formatPrice = (price: bigint) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <Card className="h-full border-2 border-foreground overflow-hidden hover:shadow-brutal transition-all duration-300 bg-card">
        <div className="relative h-64 bg-secondary overflow-hidden">
          {product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent text-accent-foreground font-mono-spec border-2 border-foreground">
              {product.category}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-3">
          <h3 className="font-display text-2xl tracking-wide group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.description}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-spec text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full border-2 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
