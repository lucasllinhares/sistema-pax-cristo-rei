# Sistema Pax Cristo Rei — site estático

Recriação do site https://sistemapaxcristorei.com.br (antes em WordPress + Elementor) em
HTML, CSS e JavaScript puros — sem WordPress, sem plugins, sem banco de dados.

## Estrutura

```
site/                      ← SITE PRONTO: é esta pasta que vai para a hospedagem
  index.html               Início
  planos/  sobre/  convenios/  depoimentos/  contato/
  politica-de-privacidade-e-cookies/
  assets/css/style.css     todo o visual (cores, fontes, responsivo)
  assets/js/main.js        carrossel, perguntas frequentes, abas, vídeos, cookies, formulário
  assets/img/              imagens originais do site
  assets/fonts/            fonte Inter (hospedada localmente)

src/                       ← fonte das páginas (edite aqui)
  layout.html              cabeçalho, rodapé, SEO, Google Tag Manager
  pages/*.html             conteúdo de cada página
build.py                   gera site/*.html a partir de src/
_orig/                     cópia do site antigo usada como referência (pode ser apagada)
```

As URLs são as mesmas do site antigo (`/planos/`, `/sobre/`, ...), então links e SEO continuam valendo.

## Editar

- **Texto de uma página:** edite `src/pages/<pagina>.html` e rode `python build.py`.
- **Cabeçalho, menu ou rodapé:** edite `src/layout.html` e rode `python build.py`.
- **Depoimentos:** lista `TESTIMONIALS` em `build.py`.
- **Cores e estilos:** `site/assets/css/style.css` (as cores ficam no início, em `:root`).

## Visualizar localmente

```bash
python -m http.server 8090 --directory site
```

Depois abra http://localhost:8090

## Publicar

Envie o conteúdo da pasta `site/` para qualquer hospedagem de arquivos estáticos
(a hospedagem atual via FTP, Vercel, Netlify, Cloudflare Pages, GitHub Pages...).

## Pendências / decisões

1. **Página Convênios:** no site antigo ela está quebrada — a lista de empresas das abas
   "Toledo" e "Guarapuava" se perdeu no Elementor e só sobraram os botões. Recriei a página
   no mesmo visual, com as abas funcionando e uma mensagem de "lista em atualização" +
   botão de WhatsApp. Para cadastrar as empresas, siga o comentário dentro de
   `src/pages/convenios.html`.
2. **Formulário de contato:** no WordPress ele enviava e-mail pelo servidor. No site estático,
   por padrão ele abre o WhatsApp (42) 3627-2673 com a mensagem preenchida. Para receber por
   e-mail, preencha `formEndpoint` no início de `site/assets/js/main.js` (ex.: FormSubmit ou Formspree).
3. **Pop-up vazio:** o site antigo abria um pop-up sem conteúdo após 2 segundos — não foi recriado.
4. **Google Tag Manager (GTM-T6L82PLL)** foi mantido, então as tags de anúncios/Analytics seguem ativas.
