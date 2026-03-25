import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const AboutSection = () => {
  const { t, language } = useLanguage();

  const team = [
    {
      name: t("about.dr.name"),
      title: t("about.dr.title"),
      desc: t("about.dr.desc"),
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
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="h-full border-0 shadow-medical">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                    <User className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <h3 className="mb-1 text-xl font-bold">{member.name}</h3>
                  <p className="mb-3 text-sm font-medium text-primary">{member.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{member.desc}</p>
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
