import { createRouter, RouterProvider, Outlet, Link } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsCallerAdmin } from "./hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Settings, ShoppingBag, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "next-themes";
import ProductCatalog from "./pages/ProductCatalog";
import ProductDetails from "./pages/ProductDetails";
import AdminPanel from "./pages/AdminPanel";
import UserProfileSetup from "./components/UserProfileSetup";

function Layout() {
  const { login, clear, identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { theme, setTheme } = useTheme();
  const isAuthenticated = !!identity;

  const handleAuthToggle = async () => {
    if (isAuthenticated) {
      await clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center relative">
              <div className="absolute inset-0 bg-accent translate-x-1 translate-y-1 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
              <ShoppingBag className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-2xl leading-none tracking-wider">STEELCUT INDUSTRIES</h1>
                <span className="text-xs font-medium text-accent uppercase tracking-wider">Since 1988</span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Quality Bending & Cutting Machines</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" className="font-medium">
                Products
              </Button>
            </Link>
            {isAuthenticated && isAdmin && !isAdminLoading && (
              <Link to="/admin">
                <Button variant="ghost" className="font-medium">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="ml-2"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              onClick={handleAuthToggle}
              variant={isAuthenticated ? "outline" : "default"}
              className="ml-2"
            >
              {isAuthenticated ? "Logout" : "Login"}
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <UserProfileSetup />
        <Outlet />
      </main>

      <footer className="border-t-2 border-foreground bg-muted py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-display text-xl tracking-wider">STEELCUT INDUSTRIES</p>
              <p className="text-sm text-muted-foreground">Manufacturing Excellence Since 1988</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2026. Built with ❤️ using{" "}
                <a
                  href="https://caffeine.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProductCatalog,
});

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product/$id",
  component: ProductDetails,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPanel,
});

const routeTree = rootRoute.addChildren([indexRoute, productRoute, adminRoute]);

const router = createRouter({
  routeTree,
});

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
