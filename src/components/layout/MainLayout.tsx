import { ExternalLink, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const DOCTOR_PROFILE_URL = "https://next-nfc-waves.vercel.app/dr-ahmed-yahiaa";

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>

      <div className={`fixed bottom-5 z-40 ${isRTL ? "left-4" : "right-4"}`}>
        <Button
          asChild
          size="lg"
          className="h-12 rounded-full bg-gradient-medical px-4 text-sm shadow-lg hover:opacity-90 sm:px-5"
        >
          <a href={DOCTOR_PROFILE_URL} target="_blank" rel="noreferrer">
            <UserRound className="h-4 w-4" />
            <span>{isRTL ? "تواصل سريع مع د. أحمد" : "Quick Contact with Dr. Ahmed"}</span>
            <ExternalLink className="h-4 w-4 opacity-80" />
          </a>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
