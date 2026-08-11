#  landing page - Academia Px

Crie um sistema de Landing Page com design moderno e profissional nas cores roxo e branco.

O objetivo do sistema é permitir que instrutores ou usuários interessados baixem arquivos de materiais disponibilizados pela empresa. Antes de liberar o download dos documentos, o usuário deverá preencher obrigatoriamente um formulário de cadastro.

Formulário de acesso aos materiais

Solicitar os seguintes campos:

Nome completo

Cargo

E-mail

Telefone

Nome da empresa

Após o preenchimento e envio do formulário:

As informações cadastradas deverão ser enviadas automaticamente para um endereço de e-mail administrativo (o e-mail será informado posteriormente).

Após o envio correto do formulário, o usuário deverá receber acesso aos materiais disponíveis para download.

O sistema deve bloquear o acesso aos arquivos caso o formulário não seja preenchido.

Funcionalidades necessárias

Página inicial com apresentação dos materiais disponíveis.

Formulário integrado para captura de leads.

Validação dos campos obrigatórios.

Envio automático dos dados cadastrados por e-mail.

Liberação automática dos arquivos após o cadastro.

Área para disponibilizar documentos e materiais para download.

Layout responsivo para computador, tablet e celular.

Design e identidade visual

Utilizar principalmente as cores roxo e branco.

Criar uma interface limpa, moderna e profissional.

Usar elementos visuais que transmitam tecnologia, confiança e organização.

Criar botões de destaque para cadastro e download dos materiais.

O sistema deve ser desenvolvido pensando em facilidade de uso, boa experiência do usuário e coleta organizada das informações dos visitantes.

objetivo: serão disponibilizados materiais para usar em aulas presenciais de NR 35 Trabalho em altura (curso de 8h)

Utileze o fluxograma que encaminhei aqui.

## Stack

HTML + CSS + JavaScript puro (vanilla), sem build tools, frameworks ou backend.

- `index.html` — estrutura da página
- `styles.css` — estilos e design system (cores roxo/branco em OKLCH)
- `script.js` — validação do formulário, listagem dos materiais e liberação de downloads
- `assets/` — imagens

Os dados do lead ficam salvos apenas no `localStorage` do navegador; não há envio para servidor ou banco de dados.

## Como rodar

Basta abrir o `index.html` no navegador, ou servir a pasta com qualquer servidor estático, por exemplo:

```sh
npx serve .
```
