import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Calendar,
  LogOut,
  Menu,
  X,
  Globe,
  Home,
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import NotificationBell from "@/components/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import ChatSection from "@/components/chat/ChatSection";

type Tab = "overview" | "appointments" | "messages";

const statusColors: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

const serviceLabels: Record<string, { ar: string; en: string }> = {
  physiotherapy: { ar: "علاج طبيعي", en: "Physiotherapy" },
  nutrition: { ar: "تغذية", en: "Nutrition" },
  consultation: { ar: "استشارة", en: "Consultation" },
};

const PatientDashboard = () => {
  const { user, signOut, displayName } = useAuth();
  const { isRTL, language, setLanguage } = useLanguage();
  const unreadMessagesCount = useUnreadMessagesCount();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ["patient-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user!.id)
        .order("preferred_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: patientRecord, isLoading: loadingRecord } = useQuery({
    queryKey: ["patient-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    {
      key: "overview",
      label: isRTL ? "نظرة عامة" : "Overview",
      icon: LayoutDashboard,
    },
    {
      key: "appointments",
      label: isRTL ? "مواعيدي" : "My Appointments",
      icon: Calendar,
    },
    {
      key: "messages",
      label: isRTL ? "الرسائل" : "Messages",
      icon: MessageCircle,
    },
  ];

  const upcomingCount =
    appointments?.filter(
      (a) => a.status === "pending" || a.status === "confirmed",
    ).length ?? 0;
  const completedCount =
    appointments?.filter((a) => a.status === "completed").length ?? 0;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{appointments?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "إجمالي المواعيد" : "Total Appointments"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "مواعيد قادمة" : "Upcoming"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <ClipboardList className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "مكتملة" : "Completed"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {isRTL ? "التاريخ الطبي" : "Medical History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecord ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : patientRecord ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isRTL ? "الاسم" : "Name"}
                  </p>
                  <p className="font-medium">{patientRecord.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isRTL ? "الهاتف" : "Phone"}
                  </p>
                  <p className="font-medium">{patientRecord.phone}</p>
                </div>
                {patientRecord.date_of_birth && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isRTL ? "تاريخ الميلاد" : "Date of Birth"}
                    </p>
                    <p className="font-medium">
                      {new Date(patientRecord.date_of_birth).toLocaleDateString(
                        language === "ar" ? "ar-EG" : "en-US",
                      )}
                    </p>
                  </div>
                )}
              </div>
              {patientRecord.medical_history && (
                <div className="mt-4">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {isRTL ? "الملاحظات الطبية" : "Medical Notes"}
                  </p>
                  <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">
                    {patientRecord.medical_history}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? "لا يوجد سجل طبي مسجل بعد. يرجى التواصل مع طبيبك."
                : "No medical record found yet. Please contact your doctor."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? "أحدث المواعيد" : "Recent Appointments"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {serviceLabels[apt.service_type]?.[
                        language === "ar" ? "ar" : "en"
                      ] ?? apt.service_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.preferred_date).toLocaleDateString(
                        language === "ar" ? "ar-EG" : "en-US",
                      )}
                    </p>
                    {apt.problem_description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {apt.problem_description}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={statusColors[apt.status] || ""}
                    variant="secondary"
                  >
                    {statusLabels[apt.status]?.[
                      language === "ar" ? "ar" : "en"
                    ] ?? apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isRTL ? "لا توجد مواعيد بعد" : "No appointments yet"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isRTL ? "جميع مواعيدي" : "All My Appointments"}</CardTitle>
        <Button asChild size="sm">
          <Link to="/booking">{isRTL ? "حجز موعد" : "Book Appointment"}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loadingAppointments ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {serviceLabels[apt.service_type]?.[
                        language === "ar" ? "ar" : "en"
                      ] ?? apt.service_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="me-1 inline h-3.5 w-3.5" />
                      {new Date(apt.preferred_date).toLocaleDateString(
                        language === "ar" ? "ar-EG" : "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                    {apt.problem_description && (
                      <p className="text-sm text-muted-foreground">
                        {apt.problem_description}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={statusColors[apt.status] || ""}
                    variant="secondary"
                  >
                    {statusLabels[apt.status]?.[
                      language === "ar" ? "ar" : "en"
                    ] ?? apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-3 text-muted-foreground">
              {isRTL ? "لا توجد مواعيد بعد" : "No appointments yet"}
            </p>
            <Button asChild>
              <Link to="/booking">
                {isRTL ? "احجز موعدك الأول" : "Book Your First Appointment"}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <SEOHead
        title={isRTL ? "لوحة تحكم المريض" : "Patient Dashboard"}
        description="Patient Dashboard"
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
              ? `مرحبًا، ${displayName || "مريض"}`
              : `Welcome, ${displayName || "Patient"}`}
          </h1>
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6">
          {tab === "overview" ? (
            renderOverview()
          ) : tab === "appointments" ? (
            renderAppointments()
          ) : (
            <ChatSection />
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
