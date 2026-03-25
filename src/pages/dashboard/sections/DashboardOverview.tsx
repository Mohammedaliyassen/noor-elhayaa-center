import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, Tag } from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [counts, setCounts] = useState({ patients: 0, articles: 0, appointments: 0, offers: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [p, a, ap, o] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("doctor_id", user.id),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", user.id),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("doctor_id", user.id),
      ]);
      setCounts({
        patients: p.count ?? 0,
        articles: a.count ?? 0,
        appointments: ap.count ?? 0,
        offers: o.count ?? 0,
      });
    };
    fetchCounts();
  }, [user]);

  const stats = [
    { label: isRTL ? "المرضى" : "Patients", value: counts.patients, icon: Users, color: "text-primary" },
    { label: isRTL ? "المقالات" : "Articles", value: counts.articles, icon: FileText, color: "text-secondary" },
    { label: isRTL ? "المواعيد" : "Appointments", value: counts.appointments, icon: Calendar, color: "text-medical-gold" },
    { label: isRTL ? "العروض" : "Offers", value: counts.offers, icon: Tag, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{isRTL ? "نظرة عامة" : "Overview"}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
