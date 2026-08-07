import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  CheckCircle2,
  GraduationCap,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/LeadForm";
import { MaterialCard, type Material } from "@/components/MaterialCard";
import { toast } from "sonner";
import heroImage from "@/assets/hero-nr35.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Materiais NR 35 — Kit para Aulas de Trabalho em Altura" },
      {
        name: "description",
        content:
          "Baixe gratuitamente PPTs, ebook, modelo de formulário e template Canva para ministrar o curso presencial de NR 35 (8h). Cadastre-se e libere o acesso.",
      },
      { property: "og:title", content: "Materiais NR 35 — Kit para Aulas de Trabalho em Altura" },
      {
        property: "og:description",
        content:
          "Kit completo de materiais didáticos para instrutores do curso presencial de NR 35 Trabalho em Altura (8 horas).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "nr35_lead";

interface StoredLead {
  id: string;
  nome: string;
}

function Index() {
  const [lead, setLead] = useState<StoredLead | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const materiaisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setLead(JSON.parse(raw) as StoredLead);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const { data: materiais = [] } = useQuery({
    queryKey: ["materiais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiais")
        .select("id, titulo, descricao, tipo, icone, evento, file_url")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as Material[];
    },
  });

  const unlocked = lead !== null;

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSuccess = (id: string, nome: string) => {
    const stored = { id, nome };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setLead(stored);
    setTimeout(() => scrollTo(materiaisRef), 300);
  };

  const handleDownload = async (material: Material) => {
    if (!lead) return;
    await supabase.from("downloads").insert({
      lead_id: lead.id,
      material_id: material.id,
      evento: material.evento,
    });

    if (material.file_url) {
      window.open(material.file_url, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Arquivo será disponibilizado em breve. Download registrado.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Kit NR 35 <span className="text-primary">· Trabalho em Altura</span>
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => scrollTo(unlocked ? materiaisRef : formRef)}
            className="bg-gradient-primary font-semibold shadow-card transition-smooth hover:opacity-95"
          >
            {unlocked ? "Ver materiais" : "Liberar acesso"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-soft" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Curso presencial de 8 horas
            </span>
            <h1 className="mt-5 text-4xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-5xl">
              Materiais prontos para suas aulas de{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                NR 35 — Trabalho em Altura
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Apresentações, ebook, formulário de avaliação e template editável no Canva.
              Tudo organizado para instrutores aplicarem o treinamento com segurança e
              profissionalismo conforme exigido pela norma. Preencha o cadastro e libere o
              download.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => scrollTo(unlocked ? materiaisRef : formRef)}
                className="h-12 bg-gradient-primary px-7 text-base font-semibold shadow-elevated transition-smooth hover:opacity-95"
              >
                {unlocked ? <Unlock /> : <Lock />}
                {unlocked ? "Acessar meus materiais" : "Preencher e desbloquear"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo(materiaisRef)}
                className="h-12 px-7 text-base font-semibold"
              >
                Ver o que está incluso <ArrowDown />
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t pt-6">
              {[
                { k: "5", v: "materiais" },
                { k: "8h", v: "de conteúdo" },
                { k: "100%", v: "editável" },
              ].map((item) => (
                <div key={item.v}>
                  <dt className="text-2xl font-bold text-primary">{item.k}</dt>
                  <dd className="text-xs text-muted-foreground">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border shadow-elevated">
              <img
                src={heroImage}
                alt="Profissional com cinto de segurança e capacete executando trabalho em altura em estrutura metálica"
                width={1600}
                height={1104}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Materiais */}
      <section ref={materiaisRef} className="scroll-mt-20 border-t bg-card/50 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              Materiais disponíveis
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              O kit completo do instrutor
            </h2>
            <p className="mt-3 text-muted-foreground">
              {unlocked
                ? "Acesso liberado. Baixe quantas vezes quiser."
                : "Os downloads são liberados automaticamente após o preenchimento do formulário."}
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {materiais.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                unlocked={unlocked}
                onDownload={handleDownload}
                onRequestAccess={() => scrollTo(formRef)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Formulário / Acesso liberado */}
      <section ref={formRef} className="scroll-mt-20 py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              Acesso aos materiais
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Preencha uma vez, baixe tudo
            </h2>
            <p className="mt-3 text-muted-foreground">
              Um único cadastro libera os cinco materiais na mesma página, sem
              redirecionamento.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: Layers,
                  title: "Cadastro único",
                  text: "Nome, cargo, e-mail, telefone e empresa.",
                },
                {
                  icon: CheckCircle2,
                  title: "Liberação imediata",
                  text: "Os cards saem de bloqueado para disponível na hora.",
                },
                {
                  icon: GraduationCap,
                  title: "Conteúdo aplicável",
                  text: "Pronto para usar no treinamento presencial de 8 horas.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-elevated sm:p-8">
            {unlocked ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="size-7" />
                </span>
                <h3 className="mt-5 text-xl font-bold">
                  Acesso liberado, {lead?.nome.split(" ")[0]}!
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Todos os materiais estão desbloqueados para download.
                </p>
                <Button
                  onClick={() => scrollTo(materiaisRef)}
                  className="mt-6 bg-gradient-primary font-semibold shadow-card transition-smooth hover:opacity-95"
                >
                  Ir para os downloads
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold">Desbloquear materiais</h3>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">
                  Todos os campos são obrigatórios.
                </p>
                <LeadForm onSuccess={handleSuccess} />
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-5 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} · Materiais de apoio para o curso NR 35 —
          Trabalho em Altura. Uso restrito a fins de treinamento.
        </div>
      </footer>
    </div>
  );
}
