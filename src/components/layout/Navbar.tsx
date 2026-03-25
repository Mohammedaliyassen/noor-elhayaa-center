import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/articles", label: t("nav.articles") },
    { to: "/#services", label: t("nav.services") },
    { to: "/#about", label: t("nav.about") },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-medical">
            <img src="/public/og.png" alt="logo" className="h-full w-full" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {isRTL ? "نور الحياة" : "Noor Al-Hayat"}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                isActive(link.to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            aria-label="Toggle Language"
          >
            <Globe className="h-4 w-4" />
          </Button>
          {user ? (
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />{" "}
                {isRTL ? "لوحة التحكم" : "Dashboard"}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link to="/auth">
                <LogIn className="h-4 w-4" /> {isRTL ? "دخول" : "Login"}
              </Link>
            </Button>
          )}
          <Button asChild className="bg-gradient-medical hover:opacity-90">
            <Link to="/booking">{t("nav.booking")}</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="container flex flex-col gap-1 py-3">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                    isActive(link.to) ? "bg-accent" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />{" "}
                    {isRTL ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <LogIn className="h-4 w-4" /> {isRTL ? "دخول" : "Login"}
                  </Link>
                </Button>
              )}
              <Button asChild className="mt-2 bg-gradient-medical">
                <Link to="/booking" onClick={() => setMobileOpen(false)}>
                  {t("nav.booking")}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
