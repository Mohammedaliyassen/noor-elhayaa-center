import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NavLinkItem =
  | { label: string; to: string; type: "route" }
  | { label: string; sectionId: string; type: "section" };

const Navbar = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links: NavLinkItem[] = [
    { to: "/", label: t("nav.home"), type: "route" },
    { to: "/articles", label: t("nav.articles"), type: "route" },
    { sectionId: "services", label: t("nav.services"), type: "section" },
    { sectionId: "about", label: t("nav.about"), type: "section" },
  ];

  useEffect(() => {
    if (!location.hash) return;

    const sectionId = location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const isActive = (link: NavLinkItem) => {
    if (link.type === "route") {
      return location.pathname === link.to && !location.hash;
    }

    return location.pathname === "/" && location.hash === `#${link.sectionId}`;
  };

  const handleSectionNavigate = (sectionId: string) => {
    setMobileOpen(false);

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: `#${sectionId}` });
      return;
    }

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/#${sectionId}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-medical">
            <img src="/og.png" alt="logo" className="h-full w-full" />
          </div>
          <span className="text-lg font-bold text-foreground">
            {isRTL ? "نور الحياة" : "Noor Al-Hayat"}
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
            link.type === "route" ? (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive(link)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.sectionId}
                type="button"
                onClick={() => handleSectionNavigate(link.sectionId)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive(link)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </button>
            ),
          )}
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
                <LayoutDashboard className="h-4 w-4" />
                {isRTL ? "لوحة التحكم" : "Dashboard"}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                {isRTL ? "دخول" : "Login"}
              </Link>
            </Button>
          )}
          <Button asChild className="bg-gradient-medical hover:opacity-90">
            <Link to="/booking">{t("nav.booking")}</Link>
          </Button>
        </div>

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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="container flex flex-col gap-1 py-3">
              {links.map((link) =>
                link.type === "route" ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      isActive(link) ? "bg-accent" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.sectionId}
                    type="button"
                    onClick={() => handleSectionNavigate(link.sectionId)}
                    className={`rounded-md px-3 py-2 text-start text-sm font-medium transition-colors hover:bg-accent ${
                      isActive(link) ? "bg-accent" : ""
                    }`}
                  >
                    {link.label}
                  </button>
                ),
              )}
              {user ? (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />
                    {isRTL ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    {isRTL ? "دخول" : "Login"}
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
