import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity, Apple, Stethoscope } from "lucide-react";

const ServicesSection = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: Activity,
      title: t("services.physio.title"),
      desc: t("services.physio.desc"),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Apple,
      title: t("services.nutrition.title"),
      desc: t("services.nutrition.desc"),
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: Stethoscope,
      title: t("services.consult.title"),
      desc: t("services.consult.desc"),
      color: "text-medical-gold",
      bg: "bg-medical-gold/10",
    },
  ];

  return (
    <section id="services" className="bg-muted/50 py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">{t("services.title")}</h2>
          <p className="text-muted-foreground">{t("services.subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group h-full border-0 shadow-sm transition-all hover:shadow-medical">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-xl p-3 ${service.bg}`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
