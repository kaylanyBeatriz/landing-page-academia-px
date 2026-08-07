CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cargo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  empresa TEXT NOT NULL,
  consentimento BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer visitante pode se cadastrar" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  icone TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  evento TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.materiais TO anon, authenticated;
GRANT ALL ON public.materiais TO service_role;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materiais sao publicos para leitura" ON public.materiais FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materiais(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.downloads TO anon, authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer visitante pode registrar download" ON public.downloads FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.materiais (titulo, descricao, tipo, icone, ordem, evento) VALUES
('Modelo de Formulário', 'Formulário de checklist e registro para as aulas presenciais de NR 35.', 'PDF / DOCX', 'clipboard', 1, 'download_formulario'),
('PPT 1 — Fundamentos NR 35', 'Apresentação módulo 1: legislação, riscos e responsabilidades.', 'PPTX', 'presentation', 2, 'download_ppt1'),
('PPT 2 — Prática e Equipamentos', 'Apresentação módulo 2: EPIs, sistemas de ancoragem e resgate.', 'PPTX', 'presentation', 3, 'download_ppt2'),
('Ebook Trabalho em Altura', 'Material de apoio completo do curso de 8 horas.', 'PDF', 'book', 4, 'download_ebook'),
('Template Canva (editável)', 'Modelo editável para personalizar sua apresentação e certificados.', 'Canva', 'palette', 5, 'download_canva');