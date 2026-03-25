import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

type Mode = "login" | "register";
type AppRole = "doctor" | "patient";

const AuthPage = () => {
  const { t, isRTL } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("patient");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: isRTL ? "خطأ" : "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, name, role);
      if (error) {
        toast({
          title: isRTL ? "خطأ" : "Error",
          description: error,
          variant: "destructive",
        });
        console.log("ROLE SENT:", role);
      } else {
        toast({
          title: isRTL ? "تم التسجيل بنجاح" : "Registration Successful",
          description: isRTL ? "جاري تحويلك..." : "Redirecting...",
        });
        console.log("ROLE SENT:", role);
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <SEOHead
        title={isRTL ? "تسجيل الدخول" : "Login"}
        description={
          isRTL ? "تسجيل الدخول إلى مركز نور الحياة" : "Login to Noor Al-Hayat"
        }
      />
      <Card className="w-full max-w-md shadow-medical">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-medical">
            <span className="text-xl font-bold text-primary-foreground">ن</span>
          </div>
          <CardTitle className="text-2xl">
            {mode === "login"
              ? isRTL
                ? "تسجيل الدخول"
                : "Sign In"
              : isRTL
                ? "إنشاء حساب"
                : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isRTL ? "مركز نور الحياة الطبي" : "Noor Al-Hayat Medical Center"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label>{isRTL ? "الاسم" : "Name"}</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? "نوع الحساب" : "Account Type"}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={role === "patient" ? "default" : "outline"}
                      className={
                        role === "patient"
                          ? "flex-1 bg-gradient-medical"
                          : "flex-1"
                      }
                      onClick={() => setRole("patient")}
                    >
                      {isRTL ? "مريض" : "Patient"}
                    </Button>
                    <Button
                      type="button"
                      variant={role === "doctor" ? "default" : "outline"}
                      className={
                        role === "doctor"
                          ? "flex-1 bg-gradient-medical"
                          : "flex-1"
                      }
                      onClick={() => setRole("doctor")}
                    >
                      {isRTL ? "طبيب" : "Doctor"}
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>{isRTL ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "كلمة المرور" : "Password"}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-medical"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? isRTL
                  ? "دخول"
                  : "Sign In"
                : isRTL
                  ? "تسجيل"
                  : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <p>
                {isRTL ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-medium text-primary hover:underline"
                >
                  {isRTL ? "سجل الآن" : "Sign Up"}
                </button>
              </p>
            ) : (
              <p>
                {isRTL ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-primary hover:underline"
                >
                  {isRTL ? "دخول" : "Sign In"}
                </button>
              </p>
            )}
          </div>
          <div className="mt-3 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isRTL ? "← العودة للرئيسية" : "← Back to Home"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
