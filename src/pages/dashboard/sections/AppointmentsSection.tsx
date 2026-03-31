import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";

interface Appointment {
  id: string;
  patient_name: string;
  phone: string;
  problem_description: string | null;
  service_type: string;
  preferred_date: string;
  status: string;
  created_at: string;
  doctor_id: string | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

interface Props {
  isAdmin?: boolean;
}

const AppointmentsSection = ({ isAdmin }: Props) => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("appointments").select("*").order("created_at", { ascending: false });
    // Doctor sees only their own; admin sees all (RLS handles it)
    if (!isAdmin) {
      query = query.eq("doctor_id", user.id);
    }
    const { data } = await query;
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: isRTL ? "تم التحديث" : "Updated" });
    fetch_();
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      pending: { ar: "في الانتظار", en: "Pending" },
      confirmed: { ar: "مؤكد", en: "Confirmed" },
      completed: { ar: "مكتمل", en: "Completed" },
      cancelled: { ar: "ملغى", en: "Cancelled" },
    };
    return isRTL ? (map[s]?.ar ?? s) : (map[s]?.en ?? s);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{isRTL ? "المواعيد" : "Appointments"}</h2>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : appointments.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{isRTL ? "لا توجد مواعيد" : "No appointments"}</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {appointments.map((a) => (
                  <Card key={a.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <p className="font-bold">{a.patient_name}</p>
                          <p className="text-sm text-muted-foreground">{a.phone}</p>
                        </div>
                        <Badge variant={statusColors[a.status] ?? "outline"}>{statusLabel(a.status)}</Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <p><span className="font-semibold">{isRTL ? "الخدمة:" : "Service:"}</span> {a.service_type}</p>
                        <p><span className="font-semibold">{isRTL ? "التاريخ:" : "Date:"}</span> {a.preferred_date}</p>
                      </div>
                      {a.status === "pending" && (
                        <div className="mt-4 flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateStatus(a.id, "confirmed")}>
                            <Check className="me-1 h-4 w-4" />
                            {isRTL ? "تأكيد" : "Confirm"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => updateStatus(a.id, "cancelled")}>
                            <X className="me-1 h-4 w-4" />
                            {isRTL ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isRTL ? "الهاتف" : "Phone"}</TableHead>
                      <TableHead>{isRTL ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.patient_name}</TableCell>
                        <TableCell>{a.phone}</TableCell>
                        <TableCell>{a.service_type}</TableCell>
                        <TableCell>{a.preferred_date}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[a.status] ?? "outline"}>{statusLabel(a.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {a.status === "pending" && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "confirmed")}>
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "cancelled")}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsSection;
