import { useState } from "react";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const schema = z.object({
  nome_completo: z.string().trim().min(3, "Informe seu nome completo").max(120),
  cargo: z.string().trim().min(2, "Informe seu cargo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z
    .string()
    .trim()
    .min(10, "Telefone inválido (com DDD)")
    .max(20)
    .regex(/^[\d\s()+-]+$/, "Telefone inválido"),
  empresa: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  consentimento: z.literal(true, {
    message: "É necessário aceitar a política de privacidade",
  }),
});

export type LeadData = z.infer<typeof schema>;

const fields = [
  { name: "nome_completo", label: "Nome completo", placeholder: "Ex.: Maria Souza", type: "text", autoComplete: "name" },
  { name: "cargo", label: "Cargo", placeholder: "Ex.: Instrutora de SST", type: "text", autoComplete: "organization-title" },
  { name: "email", label: "E-mail", placeholder: "voce@empresa.com.br", type: "email", autoComplete: "email" },
  { name: "telefone", label: "Telefone", placeholder: "(11) 90000-0000", type: "tel", autoComplete: "tel" },
  { name: "empresa", label: "Nome da empresa", placeholder: "Ex.: Alfa Treinamentos", type: "text", autoComplete: "organization" },
] as const;

type FieldName = (typeof fields)[number]["name"];

interface Props {
  onSuccess: (leadId: string, nome: string) => void;
}

export function LeadForm({ onSuccess }: Props) {
  const [values, setValues] = useState<Record<FieldName, string>>({
    nome_completo: "",
    cargo: "",
    email: "",
    telefone: "",
    empresa: "",
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ ...values, consentimento: consent });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);

    const { data, error } = await supabase
      .from("leads")
      .insert(parsed.data)
      .select("id")
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error("Não foi possível enviar seu cadastro. Tente novamente.");
      return;
    }

    toast.success("Cadastro confirmado! Materiais liberados.");
    onSuccess(data.id, parsed.data.nome_completo);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.name === "empresa" ? "sm:col-span-2" : undefined}
          >
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label} <span className="text-destructive">*</span>
            </Label>
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
              aria-invalid={Boolean(errors[field.name])}
              className="mt-1.5 h-11 bg-background"
            />
            {errors[field.name] && (
              <p className="mt-1 text-xs font-medium text-destructive">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
        <Checkbox
          id="consentimento"
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="consentimento"
          className="text-xs leading-relaxed font-normal text-muted-foreground"
        >
          Autorizo o uso dos meus dados para contato e envio de materiais, conforme a
          Lei Geral de Proteção de Dados (LGPD).
        </Label>
      </div>
      {errors["consentimento"] && (
        <p className="-mt-2 text-xs font-medium text-destructive">
          {errors["consentimento"]}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="h-12 w-full bg-gradient-primary text-base font-semibold shadow-card transition-smooth hover:opacity-95"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Enviando...
          </>
        ) : (
          <>
            <ShieldCheck /> Liberar meus materiais
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Seus dados são enviados com segurança para nossa equipe. Sem spam.
      </p>
    </form>
  );
}
