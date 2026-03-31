import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Loader2, Search, UserCheck, UserPlus, Link2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  phone: string;
  date_of_birth: string | null;
  medical_history: string | null;
  user_id: string | null;
  created_at: string;
}

interface SearchResult {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
}

const PatientsSection = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", date_of_birth: "", medical_history: "" });
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SearchResult | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    setPatients((data as Patient[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const resetForm = () => {
    setForm({ name: "", phone: "", date_of_birth: "", medical_history: "" });
    setEditId(null);
    setLinkedUserId(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedAccount(null);
    setSearchDone(false);
  };

  const handleSearchPatient = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    setSelectedAccount(null);
    setLinkedUserId(null);
    setSearchDone(false);

    const { data, error } = await (supabase as any).rpc("search_patient_accounts", {
      search_term: searchQuery.trim(),
    });

    if (!error && Array.isArray(data)) {
      setSearchResults(data);
    }

    setSearchDone(true);
    setSearching(false);
  };

  const handleSelectAccount = (account: SearchResult) => {
    setSelectedAccount(account);
    setLinkedUserId(account.user_id);
    setForm((prev) => ({
      ...prev,
      name: account.display_name || prev.name,
    }));
  };

  const clearLinkedAccount = () => {
    setSelectedAccount(null);
    setLinkedUserId(null);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!form.name.trim() || !form.phone.trim()) {
      toast({
        title: isRTL ? "بيانات ناقصة" : "Missing data",
        description: isRTL ? "الاسم والهاتف مطلوبان." : "Name and phone are required.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      date_of_birth: form.date_of_birth || null,
      medical_history: form.medical_history || null,
      doctor_id: user.id,
      user_id: linkedUserId,
    };

    if (editId) {
      await supabase.from("patients").update(payload).eq("id", editId);
      toast({ title: isRTL ? "تم التحديث" : "Updated" });
    } else {
      await supabase.from("patients").insert(payload);
      toast({ title: isRTL ? "تمت الإضافة" : "Added" });
    }

    setDialogOpen(false);
    resetForm();
    fetchPatients();
  };

  const handleEdit = (patient: Patient) => {
    setForm({
      name: patient.name,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth ?? "",
      medical_history: patient.medical_history ?? "",
    });
    setEditId(patient.id);
    setLinkedUserId(patient.user_id);
    setSelectedAccount(null);
    setSearchResults([]);
    setSearchDone(false);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    toast({ title: isRTL ? "تم الحذف" : "Deleted" });
    fetchPatients();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isRTL ? "المرضى" : "Patients"}</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical"><Plus className="h-4 w-4" /> {isRTL ? "إضافة" : "Add"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? (isRTL ? "تعديل مريض" : "Edit Patient") : (isRTL ? "إضافة مريض" : "Add Patient")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editId && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Search className="h-4 w-4" />
                    {isRTL ? "ابحث باسم المريض أو الإيميل أو الـ User ID" : "Search by patient name, email, or user ID"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={isRTL ? "مثال: الاسم أو email@example.com أو UUID" : "Example: name, email@example.com, or UUID"}
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setSearchDone(false);
                        setSearchResults([]);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleSearchPatient}
                      disabled={!searchQuery.trim() || searching}
                    >
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {selectedAccount && (
                    <div className="flex items-center justify-between rounded-md bg-primary/10 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium text-primary">
                          <Link2 className="h-4 w-4" />
                          <span className="truncate">{selectedAccount.display_name || selectedAccount.email}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{selectedAccount.email}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={clearLinkedAccount}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {searchDone && !selectedAccount && (
                    searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <button
                            key={result.user_id}
                            type="button"
                            onClick={() => handleSelectAccount(result)}
                            className="flex w-full items-center justify-between rounded-md border border-border bg-background p-3 text-start transition-colors hover:bg-muted"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{result.display_name || (isRTL ? "مريض" : "Patient")}</p>
                              <p className="truncate text-xs text-muted-foreground">{result.email}</p>
                              <p className="truncate text-[11px] text-muted-foreground">ID: {result.user_id}</p>
                            </div>
                            <Badge variant="secondary">{isRTL ? "ربط" : "Link"}</Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        {isRTL ? "لم يتم العثور على حساب. يمكنك إضافة المريض يدويًا بالاسم والهاتف." : "No account found. You can still add the patient manually with name and phone."}
                      </div>
                    )
                  )}
                </div>
              )}

              <div>
                <Label>{isRTL ? "الاسم" : "Name"}</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? "الهاتف" : "Phone"}</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                <Input type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? "التاريخ المرضي" : "Medical History"}</Label>
                <Textarea value={form.medical_history} onChange={(event) => setForm({ ...form, medical_history: event.target.value })} />
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-medical">{isRTL ? "حفظ" : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : patients.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{isRTL ? "لا يوجد مرضى بعد" : "No patients yet"}</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {patients.map((patient) => (
                  <div key={patient.id} className="border-b p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.phone}</p>
                      </div>
                      {patient.user_id ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          <UserCheck className="me-1 h-3 w-3" />
                          {isRTL ? "مربوط" : "Linked"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {isRTL ? "يدوي" : "Manual"}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(patient)}>
                        <Pencil className="me-1 h-4 w-4" />
                        {isRTL ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(patient.id)}>
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
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>
                          {patient.user_id ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                              <UserCheck className="me-1 h-3 w-3" />
                              {isRTL ? "مربوط" : "Linked"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {isRTL ? "يدوي" : "Manual"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(patient.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
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

export default PatientsSection;
