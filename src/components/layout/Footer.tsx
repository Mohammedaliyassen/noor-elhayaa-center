import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Phone, Mail, MapPin } from "lucide-react";
import AddressMap from "../ui/addressMap";

const Footer = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-medical overflow-hidden">
                <img src="/og.png" alt="logo" className="h-full w-full" />
              </div>
              <span className="text-lg font-bold">
                {isRTL ? "نور الحياة" : "Noor Al-Hayat"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-background/70">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/50">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-background/70 transition-colors hover:text-background"
                >
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  to="/articles"
                  className="text-background/70 transition-colors hover:text-background"
                >
                  {t("nav.articles")}
                </Link>
              </li>
              <li>
                <Link
                  to="/booking"
                  className="text-background/70 transition-colors hover:text-background"
                >
                  {t("nav.booking")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/50">
              {t("footer.contactInfo")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-background/70">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+20 10 21370349">+20 10 21370349</a>
              </li>
              <li className="flex items-center gap-2 text-background/70">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mail:info@noor-alhayat.com">info@noor-alhayat.com</a>
              </li>
              <li className="flex items-center gap-2 text-background/70">
                <MapPin className="h-4 w-4 shrink-0" />
                <a
                  href="https://maps.app.goo.gl/2TTY6YHmwRDX5vjq5"
                  target="_blank"
                >
                  {isRTL
                    ? "المنيا، بني احمد الغربية ، شارع جابر نجيب بمنزل د. خالد رجب "
                    : "المنيا، بني احمد الغربية ، شارع جابر نجيب بمنزل د. خالد رجب "}
                </a>
              </li>
              <li className="">
                <AddressMap />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-background/10 pt-6 text-center text-xs text-background/40">
          © {new Date().getFullYear()} Noor Al-Hayat. {t("footer.rights")}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
