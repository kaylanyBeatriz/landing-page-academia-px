import { Book, ClipboardList, Download, Lock, Palette, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Material {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  icone: string;
  evento: string;
  file_url: string | null;
}

const icons: Record<string, typeof Book> = {
  clipboard: ClipboardList,
  presentation: Presentation,
  book: Book,
  palette: Palette,
};

interface Props {
  material: Material;
  unlocked: boolean;
  onDownload: (material: Material) => void;
  onRequestAccess: () => void;
}

export function MaterialCard({ material, unlocked, onDownload, onRequestAccess }: Props) {
  const Icon = icons[material.icone] ?? Book;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-6" />
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {material.tipo}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold text-foreground">{material.titulo}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {material.descricao}
      </p>

      <div className="mt-6">
        {unlocked ? (
          <Button
            onClick={() => onDownload(material)}
            className="w-full bg-gradient-primary font-semibold shadow-card transition-smooth hover:opacity-95"
          >
            <Download /> Baixar material
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onRequestAccess}
            className="w-full border-primary/30 font-semibold text-primary transition-smooth hover:bg-primary-soft hover:text-primary"
          >
            <Lock /> Bloqueado — cadastre-se
          </Button>
        )}
      </div>
    </article>
  );
}
