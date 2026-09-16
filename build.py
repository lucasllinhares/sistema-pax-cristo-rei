"""Gera o site estático em ./site a partir de ./src.

    python build.py

- src/layout.html      -> cabeçalho, rodapé, SEO e scripts comuns a todas as páginas
- src/pages/*.html     -> conteúdo de cada página; a 1ª linha é um comentário JSON com
                          title / description / path / og_image
- Blocos reutilizáveis ({{testimonials}}, {{cta}}, ...) ficam em PARTIALS abaixo.
Os arquivos em site/assets (css, js, imagens, fontes) são editados diretamente.
"""
import datetime
import hashlib
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'site')


def asset_version(rel_path):
    """8 caracteres do hash do conteúdo do arquivo — vira ?v=... no link/script.
    Muda sozinho sempre que o CSS/JS muda, então o navegador (e o cache da
    Vercel) busca a versão nova na hora, em vez de ficar preso numa cópia
    antiga guardada em cache."""
    caminho = os.path.join(OUT, rel_path)
    conteudo = open(caminho, 'rb').read()
    return hashlib.sha1(conteudo).hexdigest()[:8]

SITE_URL = 'https://sistemapaxcristorei.com.br/'
WHATSAPP = ('https://wa.me/554236272673?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20'
            'mais%20informa%C3%A7%C3%B5es.%20Pode%20me%20ajudar%3F')

TESTIMONIALS = [
    ('Shirlei Santana', 'Toledo - PR',
     'Gostaria de agradecer pelo total apoio neste mometo que passamos. O pessoal humano de vocês é especial, '
     'todos muito educados e profissioanis, mais uma vez obrigado!'),
    ('Jessica', 'Toledo - PR',
     'Minha avó sempre pagava o plano dela e do meu avô, e de verdade foi bem utilizado agora na morte dela, '
     'foi tduo tão bonito, caixão , café servido, o rapaz falando coisas bonitas!<br>Um plano muito bem pago!'),
    ('Claudete Inês', 'Toledo - PR',
     'Obrigada pela competência e agilidade para conseguir uma consulta, vocês exercem a profissão com amor, '
     'quero agradecer também ao motoristas dos carros de apoio, pelo carinho e atenção que eles tem com minha '
     'mãe quando ela precisa do carro de apoio.<br>Gratidão por ter vocês em minha vida!'),
    ('Joana', 'Toledo - PR',
     'Eu, Joana, quero agradecer todos vocês do paxi Cristo pelo atendimento que Deus abençoe a todos vocês '
     'o meu muito obrigada'),
]


def testimonials_html():
    slides = []
    for name, city, text in TESTIMONIALS:
        slides.append(f'''        <div class="carousel-slide">
          <figure class="testimonial">
            <blockquote class="testimonial-text">{text}</blockquote>
            <figcaption class="testimonial-footer">
              <img src="{{{{root}}}}assets/img/icone-female.webp" width="50" height="50" alt="{name}" loading="lazy">
              <cite><span class="t-name">{name}</span><span class="t-title">{city}</span></cite>
            </figcaption>
          </figure>
        </div>''')
    return f'''    <div class="carousel" data-carousel aria-roledescription="carousel" aria-label="Depoimentos">
      <button type="button" class="carousel-btn carousel-prev" aria-label="Anterior"><svg viewBox="0 0 1000 1000"><use href="#i-chev-left"/></svg></button>
      <div class="carousel-viewport">
        <div class="carousel-track">
{chr(10).join(slides)}
        </div>
      </div>
      <button type="button" class="carousel-btn carousel-next" aria-label="Próximo"><svg viewBox="0 0 1000 1000"><use href="#i-chev-right"/></svg></button>
      <div class="carousel-dots" role="tablist"></div>
    </div>'''


def cta_html(extra_class=''):
    return f'''<section class="section cta-sec {extra_class}">
  <div class="container col-center">
    <div class="cta-box">
      <h2>Garanta agora mais segurança e tranquilidade para sua família</h2>
      <a class="btn btn-white btn-grow" href="{{{{whatsapp}}}}" target="_blank" rel="noopener">Falar com Consultor</a>
    </div>
  </div>
</section>'''


PARTIALS = {
    'testimonials': testimonials_html(),
    'cta': cta_html(),
    'cta_sobre': cta_html('cta-sobre'),
    # divisórias curvas (Elementor "curve-asymmetrical" e "curve", invertidas)
    'shape_asym': '<div class="shape shape-bottom shape-asym" aria-hidden="true"><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M615.2,96.7C240.2,97.8,0,18.9,0,0v100h1000V0C1000,19.2,989.8,96,615.2,96.7z"/></svg></div>',
    'shape_curve': '<div class="shape shape-bottom shape-curve" aria-hidden="true"><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M500,97C126.7,96.3,0.8,19.8,0,0v100l1000,0V1C1000,19.4,873.3,97.8,500,97z"/></svg></div>',
}

NAV = ['planos', 'sobre', 'convenios', 'depoimentos', 'contato']

# Cada página com hero usa uma imagem de fundo (CSS background-image) diferente por
# faixa de largura. Um <link rel=preload> por faixa evita que o navegador só descubra
# essa imagem depois de baixar e processar todo o CSS — é o maior ganho possível no LCP
# (Largest Contentful Paint), já que essa imagem cobre a primeira dobra da página.
# As faixas espelham exatamente as media queries de .hero-* em assets/css/style.css.
HERO_IMAGES = {
    'home': ['ses-1-desktop-1.webp', 'ses-1-desktop-1-1536x562.webp', 'ses-1-desktop-1-1024x375.webp', 'ses-1-tablet.webp', 'ses-1-mobile.webp'],
    'planos': ['ses-1-desktop.webp', 'ses-1-desktop-1536x562.webp', 'ses-1-desktop-1024x375.webp', 'ses-1-tablet-1.webp', 'ses-1-mobile-1.webp'],
    'sobre': ['ses-1-desktop-4.webp', 'ses-1-desktop-4-1536x562.webp', 'ses-1-desktop-4-1024x375.webp', 'ses-1-tablet-3.webp', 'ses-1-mobile-3.webp'],
    'contato': ['ses-1-desktop-3.webp', 'ses-1-desktop-3-1536x535.webp', 'ses-1-desktop-3-1024x356.webp', 'ses-1-tablet-2-768x932.webp', 'ses-1-mobile-2.webp'],
}
# (min-width, max-width) de cada uma das 5 imagens acima, sem sobreposição -
# exatamente o breakpoint que "vence" a cascata do CSS em cada faixa.
HERO_RANGES = [(1367, None), (1201, 1366), (1025, 1200), (768, 1024), (None, 767)]


def hero_preload_html(hero_key, root):
    if not hero_key:
        return ''
    files = HERO_IMAGES[hero_key]
    links = []
    for fname, (min_w, max_w) in zip(files, HERO_RANGES):
        conds = []
        if min_w: conds.append(f'(min-width: {min_w}px)')
        if max_w: conds.append(f'(max-width: {max_w}px)')
        media = ' and '.join(conds)
        links.append(f'  <link rel="preload" as="image" href="{root}assets/img/{fname}" media="{media}" fetchpriority="high">')
    return '\n'.join(links)


def render(tpl, ctx):
    return re.sub(r'\{\{(\w+)\}\}', lambda m: str(ctx.get(m.group(1), m.group(0))), tpl)


def build():
    layout = open(os.path.join(SRC, 'layout.html'), encoding='utf-8').read()
    css_v = asset_version('assets/css/style.css')
    js_v = asset_version('assets/js/main.js')
    anim_v = asset_version('assets/js/anim-init.js')
    gtm_v = asset_version('assets/js/gtm-init.js')
    pages_dir = os.path.join(SRC, 'pages')
    page_paths = []
    for fname in sorted(os.listdir(pages_dir)):
        if not fname.endswith('.html'):
            continue
        slug = fname[:-5]
        raw = open(os.path.join(pages_dir, fname), encoding='utf-8').read()
        meta_match = re.match(r'\s*<!--(\{.*?\})-->\s*', raw, re.S)
        meta = json.loads(meta_match.group(1))
        body = raw[meta_match.end():]
        path = meta['path']
        depth = path.count('/')
        root = '../' * depth if depth else './'

        ctx = dict(PARTIALS)
        ctx.update(meta)
        ctx.update(slug=slug, root=root, site_url=SITE_URL, whatsapp=WHATSAPP,
                   css_v=css_v, js_v=js_v, anim_v=anim_v, gtm_v=gtm_v)
        ctx['hero_preload'] = hero_preload_html(meta.get('hero'), root)
        for item in NAV:
            ctx[f'active_{item}'] = ' class="active" aria-current="page"' if slug == item else ''

        # dois passes: partials podem conter {{root}} / {{whatsapp}}
        content = render(render(body, ctx), ctx)
        ctx['content'] = content
        html = render(layout, ctx)

        dest_dir = os.path.join(OUT, path.replace('/', os.sep))
        os.makedirs(dest_dir, exist_ok=True)
        with open(os.path.join(dest_dir, 'index.html'), 'w', encoding='utf-8', newline='\n') as f:
            f.write(html)
        leftover = re.findall(r'\{\{\w+\}\}', html)
        print(f'{slug:40s} -> site/{path}index.html' + (f'  !! placeholders: {leftover}' if leftover else ''))
        page_paths.append(path)

    write_robots()
    write_sitemap(page_paths)


def write_robots():
    content = f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n'
    with open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f'{"robots.txt":40s} -> site/robots.txt')


def write_sitemap(page_paths):
    today = datetime.date.today().isoformat()
    urls = []
    for path in sorted(page_paths, key=lambda p: (p != '', p)):
        priority = '1.0' if path == '' else '0.7'
        urls.append(
            f'  <url>\n    <loc>{SITE_URL}{path}</loc>\n'
            f'    <lastmod>{today}</lastmod>\n    <priority>{priority}</priority>\n  </url>'
        )
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(urls) + '\n</urlset>\n')
    with open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(xml)
    print(f'{"sitemap.xml":40s} -> site/sitemap.xml')


if __name__ == '__main__':
    build()
