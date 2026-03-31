import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserWithRole {
  user_id: string;
  role: string;
  display_name: string;
  phone: string | null;
  created_at: string;
}

const AdminUsersSection = () => {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    // Get all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (!roles?.length) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone, created_at");

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const merged = roles.map((r) => ({
      user_id: r.user_id,
      role: r.role,
      display_name: profileMap.get(r.user_id)?.display_name ?? "",
      phone: profileMap.get(r.user_id)?.phone ?? null,
      created_at: profileMap.get(r.user_id)?.created_at ?? "",
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    // Delete role + profile (cascade will handle rest)
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast({ title: isRTL ? "تم حذف المستخدم" : "User deleted" });
    fetchUsers();
  };

  const doctors = users.filter((u) => u.role === "doctor");
  const patients = users.filter((u) => u.role === "patient");

  const renderTable = (list: UserWithRole[]) => (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            {isRTL ? "لا يوجد مستخدمين" : "No users"}
          </p>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden">
              {list.map((u) => (
                <div key={u.user_id} className="border-b p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{u.display_name || "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {u.phone || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <Badge
                      variant={u.role === "doctor" ? "default" : "secondary"}
                    >
                      {u.role === "doctor"
                        ? isRTL
                          ? "طبيب"
                          : "Doctor"
                        : isRTL
                          ? "مريض"
                          : "Patient"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(u.user_id)}
                    >
                      <Trash2 className="me-1 h-4 w-4" />
                      {isRTL ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isRTL ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{isRTL ? "الدور" : "Role"}</TableHead>
                    <TableHead>{isRTL ? "تاريخ التسجيل" : "Joined"}</TableHead>
                    <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={"text-left "}>
                  {list.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">
                        {u.display_name || "—"}
                      </TableCell>
                      <TableCell>{u.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === "doctor" ? "default" : "secondary"
                          }
                        >
                          {u.role === "doctor"
                            ? isRTL
                              ? "طبيب"
                              : "Doctor"
                            : isRTL
                              ? "مريض"
                              : "Patient"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        {isRTL ? "إدارة المستخدمين" : "User Management"}
      </h2>
      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">
            {isRTL
              ? `الأطباء (${doctors.length})`
              : `Doctors (${doctors.length})`}
          </TabsTrigger>
          <TabsTrigger value="patients">
            {isRTL
              ? `المرضى (${patients.length})`
              : `Patients (${patients.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="doctors">{renderTable(doctors)}</TabsContent>
        <TabsContent value="patients">{renderTable(patients)}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsersSection;
