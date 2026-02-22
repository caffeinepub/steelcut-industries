import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useGetProduct } from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Package } from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const { data: product, isLoading } = useGetProduct(id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (price: bigint) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[500px] w-full" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button onClick={() => navigate({ to: "/" })} variant="outline" className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Catalog
        </Button>
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-2xl text-muted-foreground mb-2">PRODUCT NOT FOUND</h3>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <Button
        onClick={() => navigate({ to: "/" })}
        variant="outline"
        className="mb-8 border-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Catalog
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div className="relative aspect-square bg-secondary border-2 border-foreground overflow-hidden group">
            {product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity border-2"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      onClick={nextImage}
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity border-2"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {product.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 border-2 border-foreground transition-colors ${
                            idx === currentImageIndex ? "bg-accent" : "bg-background"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`aspect-square bg-secondary border-2 overflow-hidden ${
                    idx === currentImageIndex ? "border-accent" : "border-foreground"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Badge className="mb-3 bg-accent text-accent-foreground font-mono-spec border-2 border-foreground">
              {product.category}
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl tracking-wider mb-4">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-mono-spec text-4xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-muted-foreground uppercase tracking-wider">
                Ex-factory price
              </span>
            </div>
          </div>

          <Separator className="bg-foreground h-0.5" />

          <div>
            <h2 className="font-display text-2xl tracking-wider mb-3">DESCRIPTION</h2>
            <p className="text-foreground/90 leading-relaxed">{product.description}</p>
          </div>

          <Separator className="bg-foreground h-0.5" />

          <div>
            <h2 className="font-display text-2xl tracking-wider mb-4">SPECIFICATIONS</h2>
            <div className="space-y-3">
              <SpecRow label="Weight" value={product.specifications.weight} />
              <SpecRow label="Power" value={product.specifications.power} />
              <SpecRow label="Dimensions" value={product.specifications.dimensions} />
              {product.specifications.additional && (
                <SpecRow label="Additional" value={product.specifications.additional} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-2 border-foreground bg-card p-8 diagonal-cut">
        <h2 className="font-display text-3xl tracking-wider mb-6">CONTACT US</h2>
        <p className="text-muted-foreground mb-6">
          Interested in this product? Get in touch with our sales team for pricing, customization, and delivery details.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ContactItem
            icon={<Phone className="w-5 h-5" />}
            label="Phone"
            value="+91 98765 43210"
          />
          <ContactItem
            icon={<Mail className="w-5 h-5" />}
            label="Email"
            value="sales@steelcut.in"
          />
          <ContactItem
            icon={<MapPin className="w-5 h-5" />}
            label="Location"
            value="Gujarat, India"
          />
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 pb-3 border-b border-border">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider w-32 shrink-0">
        {label}
      </span>
      <span className="font-mono-spec text-foreground flex-1">{value}</span>
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
