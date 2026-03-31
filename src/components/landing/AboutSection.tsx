import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ExternalLink, User } from "lucide-react";

const AboutSection = () => {
  const { t, language } = useLanguage();

  const team = [
    {
      name: t("about.dr.name"),
      title: t("about.dr.title"),
      desc: t("about.dr.desc"),
      profileUrl: "https://next-nfc-waves.vercel.app/dr-ahmed-yahiaa",
    },
    {
      name: t("about.partner.name"),
      title: t("about.partner.title"),
      desc: t("about.partner.desc"),
    },
  ];

  return (
    <section id="about" className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">{t("about.title")}</h2>
          <p className="text-muted-foreground">{t("about.subtitle")}</p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="h-full border-0 shadow-medical transition-transform hover:-translate-y-1">
                <CardContent className="flex h-full flex-col p-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                    <User className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <h3 className="mb-1 text-xl font-bold">{member.name}</h3>
                  <p className="mb-3 text-sm font-medium text-primary">{member.title}</p>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{member.desc}</p>

                  {member.profileUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="mt-auto rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <a href={member.profileUrl} target="_blank" rel="noreferrer">
                        {language === "ar" ? "الملف التعريفي لد. أحمد" : "Dr. Ahmed Profile"}
                        <ExternalLink className="ms-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
