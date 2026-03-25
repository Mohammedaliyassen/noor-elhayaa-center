import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface DayAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  id?: string;
}

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AvailabilitySection = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<DayAvailability[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: "09:00",
      end_time: "17:00",
      is_available: false,
    }))
  );

  useEffect(() => {
    if (!user) return;
    const fetchAvailability = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", user.id);

      if (data?.length) {
        setDays((prev) =>
          prev.map((d) => {
            const found = data.find((r: any) => r.day_of_week === d.day_of_week);
            return found
              ? { ...d, ...found, start_time: found.start_time?.slice(0, 5), end_time: found.end_time?.slice(0, 5) }
              : d;
          })
        );
      }
      setLoading(false);
    };
    fetchAvailability();
  }, [user]);

  const updateDay = (idx: number, updates: Partial<DayAvailability>) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...updates } : d)));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const day of days) {
        const payload = {
          doctor_id: user.id,
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time,
          is_available: day.is_available,
        };

        await supabase
          .from("doctor_availability")
          .upsert(payload, { onConflict: "doctor_id,day_of_week" });
      }
      toast({ title: isRTL ? "تم حفظ مواعيد التواجد" : "Availability saved" });
    } catch (err: any) {
      toast({ title: isRTL ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const dayNames = isRTL ? DAYS_AR : DAYS_EN;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isRTL ? "مواعيد التواجد" : "Availability"}</h2>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-medical">
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {isRTL ? "حفظ" : "Save"}
        </Button>
      </div>

      <div className="grid gap-3">
        {days.map((day, idx) => (
          <Card key={day.day_of_week} className={!day.is_available ? "opacity-60" : ""}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex min-w-[140px] items-center gap-3">
                <Switch
                  checked={day.is_available}
                  onCheckedChange={(checked) => updateDay(idx, { is_available: checked })}
                />
                <span className="font-medium">{dayNames[day.day_of_week]}</span>
              </div>

              {day.is_available && (
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{isRTL ? "من" : "From"}</Label>
                    <Input
                      type="time"
                      value={day.start_time}
                      onChange={(e) => updateDay(idx, { start_time: e.target.value })}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{isRTL ? "إلى" : "To"}</Label>
                    <Input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => updateDay(idx, { end_time: e.target.value })}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AvailabilitySection;
