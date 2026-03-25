import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, Tag, UserCog } from "lucide-react";

const AdminOverview = () => {
  const { isRTL } = useLanguage();
  const [counts, setCounts] = useState({ doctors: 0, patients: 0, articles: 0, appointments: 0, offers: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [d, p, a, ap, o] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "doctor"),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        doctors: d.count ?? 0,
        patients: p.count ?? 0,
        articles: a.count ?? 0,
        appointments: ap.count ?? 0,
        offers: o.count ?? 0,
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: isRTL ? "الأطباء" : "Doctors", value: counts.doctors, icon: UserCog, color: "text-primary" },
    { label: isRTL ? "المرضى" : "Patients", value: counts.patients, icon: Users, color: "text-secondary" },
    { label: isRTL ? "المقالات" : "Articles", value: counts.articles, icon: FileText, color: "text-medical-gold" },
    { label: isRTL ? "المواعيد" : "Appointments", value: counts.appointments, icon: Calendar, color: "text-accent-foreground" },
    { label: isRTL ? "العروض" : "Offers", value: counts.offers, icon: Tag, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{isRTL ? "نظرة عامة - الإدارة" : "Admin Overview"}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

export default AdminOverview;
