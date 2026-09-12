"""Gera o site estático em ./site a partir de ./src.

    python build.py

- src/layout.html      -> cabeçalho, rodapé, SEO e scripts comuns a todas as páginas
- src/pages/*.html     -> conteúdo de cada página; a 1ª linha é um comentário JSON com
                          title / description / path / og_image
- Blocos reutilizáveis ({{testimonials}}, {{cta}}, ...) ficam em PARTIALS abaixo.
Os arquivos em site/assets (css, js, imagens, fontes) são editados diretamente.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'site')

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


def render(tpl, ctx):
    return re.sub(r'\{\{(\w+)\}\}', lambda m: str(ctx.get(m.group(1), m.group(0))), tpl)


def build():
    layout = open(os.path.join(SRC, 'layout.html'), encoding='utf-8').read()
    pages_dir = os.path.join(SRC, 'pages')
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
        ctx.update(slug=slug, root=root, site_url=SITE_URL, whatsapp=WHATSAPP)
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


if __name__ == '__main__':
    build()
