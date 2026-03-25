import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Calendar,
  Tag,
  LogOut,
  Menu,
  X,
  Globe,
  Home,
  LayoutDashboard,
  Clock,
  MessageCircle,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import NotificationBell from "@/components/NotificationBell";
import DashboardOverview from "./sections/DashboardOverview";
import PatientsSection from "./sections/PatientsSection";
import ArticlesSection from "./sections/ArticlesSection";
import AppointmentsSection from "./sections/AppointmentsSection";
import OffersSection from "./sections/OffersSection";
import AvailabilitySection from "./sections/AvailabilitySection";
import ChatSection from "@/components/chat/ChatSection";

type Tab =
  | "overview"
  | "patients"
  | "articles"
  | "appointments"
  | "offers"
  | "availability"
  | "messages";

const DoctorDashboard = () => {
  const { signOut, displayName } = useAuth();
  const { isRTL, language, setLanguage } = useLanguage();
  const unreadMessagesCount = useUnreadMessagesCount();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    {
      key: "overview",
      label: isRTL ? "نظرة عامة" : "Overview",
      icon: LayoutDashboard,
    },
    { key: "patients", label: isRTL ? "المرضى" : "Patients", icon: Users },
    { key: "articles", label: isRTL ? "المقالات" : "Articles", icon: FileText },
    {
      key: "appointments",
      label: isRTL ? "المواعيد" : "Appointments",
      icon: Calendar,
    },
    { key: "offers", label: isRTL ? "العروض" : "Offers", icon: Tag },
    {
      key: "availability",
      label: isRTL ? "مواعيد التواجد" : "Availability",
      icon: Clock,
    },
    {
      key: "messages",
      label: isRTL ? "الرسائل" : "Messages",
      icon: MessageCircle,
    },
  ];

  const renderContent = () => {
    switch (tab) {
      case "overview":
        return <DashboardOverview />;
      case "patients":
        return <PatientsSection />;
      case "articles":
        return <ArticlesSection />;
      case "appointments":
        return <AppointmentsSection />;
      case "offers":
        return <OffersSection />;
      case "availability":
        return <AvailabilitySection />;
      case "messages":
        return <ChatSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEOHead
        title={isRTL ? "لوحة التحكم" : "Dashboard"}
        description="Doctor Dashboard"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-40 flex w-64 flex-col border-e border-border bg-card transition-transform md:static md:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
        }`}
        style={isRTL ? { right: 0 } : { left: 0 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-medical">
              <img src="/public/og.png" alt="logo" className="h-full w-full" />
            </div>
            <span className="font-bold text-foreground">
              {isRTL ? "نور الحياة" : "Noor Al-Hayat"}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {tabs.map(({ key, label, icon: Icon }) => {
            const isMessagesTab = key === "messages";
            const showUnreadBadge = isMessagesTab && unreadMessagesCount > 0;

            return (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-start">{label}</span>
                {showUnreadBadge && (
                  <Badge
                    variant="default"
                    className="min-w-5 justify-center px-1.5 py-0 text-[10px]"
                  >
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            {isRTL ? "الرئيسية" : "Home"}
          </Link>
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <Globe className="h-4 w-4" />
            {language === "ar" ? "English" : "عربي"}
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {isRTL ? "تسجيل الخروج" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-lg font-semibold text-foreground">
            {isRTL
              ? `مرحبًا، ${displayName || "دكتور"}`
              : `Welcome, ${displayName || "Doctor"}`}
          </h1>
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
