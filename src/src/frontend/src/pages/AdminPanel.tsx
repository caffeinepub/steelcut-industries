import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useIsCallerAdmin,
  useGetAllProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, X, Loader2, ShieldAlert } from "lucide-react";
import type { Product, Specifications } from "../backend.d";
import { uploadImage } from "../utils/blobStorage";

export default function AdminPanel() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: products = [], isLoading: productsLoading } = useGetAllProducts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto border-2 border-foreground">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl mb-2">AUTHENTICATION REQUIRED</h2>
            <p className="text-muted-foreground mb-4">Please log in to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Skeleton className="h-12 w-64 mx-auto" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto border-2 border-destructive">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-2xl mb-2">ACCESS DENIED</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-5xl tracking-wider mb-2">ADMIN PANEL</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="border-2">
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">ADD NEW PRODUCT</DialogTitle>
              <DialogDescription>Fill in the product details below.</DialogDescription>
            </DialogHeader>
            <ProductForm
              onSuccess={() => {
                setIsAddDialogOpen(false);
                toast.success("Product added successfully");
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground font-display text-xl">
              NO PRODUCTS YET. ADD YOUR FIRST PRODUCT.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => setDeleteProductId(product.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">EDIT PRODUCT</DialogTitle>
            <DialogDescription>Update the product details below.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSuccess={() => {
                setEditingProduct(null);
                toast.success("Product updated successfully");
              }}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteProductId}
        onOpenChange={(open) => !open && setDeleteProductId(null)}
        productId={deleteProductId}
      />
    </div>
  );
}

function ProductListItem({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatPrice = (price: bigint) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <Card className="border-2 border-foreground">
      <div className="relative h-48 bg-secondary">
        {product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-display text-xl tracking-wide mb-1">{product.name}</h3>
            <Badge variant="outline" className="font-mono-spec">
              {product.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
        <p className="font-mono-spec text-lg font-bold text-primary mb-4">
          {formatPrice(product.price)}
        </p>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button onClick={onDelete} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "");
  const [price, setPrice] = useState(product ? Number(product.price).toString() : "");
  const [weight, setWeight] = useState(product?.specifications.weight || "");
  const [power, setPower] = useState(product?.specifications.power || "");
  const [dimensions, setDimensions] = useState(product?.specifications.dimensions || "");
  const [additional, setAdditional] = useState(product?.specifications.additional || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !category.trim() || !price || !weight.trim() || !power.trim() || !dimensions.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceValue = BigInt(Math.round(parseFloat(price)));
    const specifications: Specifications = {
      weight,
      power,
      dimensions,
      additional: additional || undefined,
    };

    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          name,
          description,
          specifications,
          category,
          price: priceValue,
          imageUrls: images,
        });
      } else {
        await addProduct.mutateAsync({
          name,
          description,
          specifications,
          category,
          price: priceValue,
          imageUrls: images,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error("Failed to save product");
    }
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Heavy Duty Bending Machine"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Bending Machine"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (INR) *</Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g., 250000"
          required
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed product description..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight *</Label>
          <Input
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 500 kg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="power">Power *</Label>
          <Input
            id="power"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            placeholder="e.g., 3 HP"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions *</Label>
          <Input
            id="dimensions"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="e.g., 1200 x 800 x 1000 mm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional">Additional Info</Label>
          <Input
            id="additional"
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder="Optional additional specs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Images</Label>
        <div className="border-2 border-dashed border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square border-2 border-foreground">
                  <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>{product ? "Update Product" : "Add Product"}</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  productId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = async () => {
    if (!productId) return;

    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">DELETE PRODUCT?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The product will be permanently removed from your catalog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProduct.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
