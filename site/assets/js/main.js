/* Sistema Pax Cristo Rei — scripts do site (sem dependências) */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Configuração do formulário de contato.
     Todo envio do formulário de /contato/ vai para o e-mail abaixo, via
     FormSubmit (serviço gratuito de encaminhamento — não guarda nada aqui,
     só repassa para a caixa de entrada). Na primeira mensagem recebida,
     o FormSubmit manda um e-mail de confirmação para esse endereço; é
     preciso abrir esse e-mail e clicar no link uma única vez para ativar
     — depois disso todo envio cai direto na caixa de entrada.
     Para trocar o e-mail de destino ou voltar a abrir o WhatsApp em vez
     de enviar e-mail, edite/esvazie formEndpoint abaixo.
     ------------------------------------------------------------------ */
  var CONFIG = {
    formEndpoint: 'https://formsubmit.co/ajax/contato@sistemapaxcristorei.com.br',
    whatsappNumber: '554236272673'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------------- Animações: entrada ao rolar, parallax e progresso ----------------
     Tudo só roda quando o <html> tem a classe .anim (JavaScript disponível e sem
     "reduzir movimento" no sistema). ---------------- */
  var animar = document.documentElement.classList.contains('anim') && !reduceMotion;

  if (animar && 'IntersectionObserver' in window) {
    // seletor -> variação da entrada (de baixo, da esquerda, da direita, com zoom)
    var GRUPOS = [
      ['.section-head, .faq-title, .unidades-title', ''],
      ['.split-card', 'reveal-zoom'],
      ['.benefit-card', ''],
      ['.cta-box', 'reveal-zoom'],
      ['.convenios-text', 'reveal-esq'],
      ['.convenios-img', 'reveal-dir'],
      ['.unidade-text', 'reveal-esq'],
      ['.unidade-img', 'reveal-dir'],
      ['.marquee', ''],
      ['.acc-item', ''],
      ['.carousel', ''],
      ['.video-embed', 'reveal-zoom'],
      ['.contato-col', ''],
      ['.tabs', ''],
      ['.policy h2, .policy h3', ''],
      ['.footer-logo, .footer-col', ''],
    ];
    var alvos = [];
    GRUPOS.forEach(function (grupo) {
      document.querySelectorAll(grupo[0]).forEach(function (el) {
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal');
        if (grupo[1]) el.classList.add(grupo[1]);
        alvos.push(el);
      });
    });
    // elementos lado a lado no mesmo bloco entram em sequência, um pouco depois do outro
    var porPai = new Map();
    alvos.forEach(function (el) {
      var lista = porPai.get(el.parentNode) || [];
      lista.push(el);
      porPai.set(el.parentNode, lista);
    });
    porPai.forEach(function (lista) {
      if (lista.length < 2) return;
      lista.forEach(function (el, i) { el.style.setProperty('--atraso', Math.min(i, 5) * 90 + 'ms'); });
    });

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    alvos.forEach(function (el) { observador.observe(el); });

    // Rede de segurança: se algo impedir o efeito, o conteúdo que está na tela
    // aparece assim mesmo — o texto nunca fica invisível por causa da animação.
    setTimeout(function () {
      alvos.forEach(function (el) {
        if (el.classList.contains('is-visible')) return;
        var caixa = el.getBoundingClientRect();
        if (caixa.top < window.innerHeight && caixa.bottom > 0) el.classList.add('is-visible');
      });
    }, 2500);
  }

  if (animar) {
    var hero = document.querySelector('.hero');
    var barra = document.querySelector('.progresso');
    var pendente = false;
    function aoRolar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () {
        pendente = false;
        var y = window.scrollY || window.pageYOffset;
        if (barra) {
          var altura = document.documentElement.scrollHeight - window.innerHeight;
          barra.style.setProperty('--progresso', altura > 0 ? Math.min(y / altura, 1) : 0);
        }
        // parallax leve: o fundo da primeira dobra anda mais devagar que a página.
        // No celular a imagem é retrato e mostra pessoas perto do topo — deslocar o
        // fundo ao rolar cortava a cabeça delas, então lá o fundo fica parado.
        if (hero && y < window.innerHeight * 1.2 && window.innerWidth > 767) {
          hero.style.setProperty('--parallax', Math.round(y * 0.12) + 'px');
        }
      });
    }
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar, { passive: true });
    aoRolar();
  }

  /* ---------------- Carrossel de depoimentos ---------------- */
  function perView() {
    var w = window.innerWidth;
    if (w <= 767) return 1;
    if (w <= 1200) return 2;
    return 3;
  }

  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var viewport = root.querySelector('.carousel-viewport');
    var track = root.querySelector('.carousel-track');
    var dotsBox = root.querySelector('.carousel-dots');
    var originals = Array.prototype.slice.call(track.children);
    var total = originals.length;
    var index = 0;
    var pv = perView();
    var timer = null;
    var paused = false;

    function build() {
      pv = perView();
      root.style.setProperty('--per-view', pv);
      track.querySelectorAll('.is-clone').forEach(function (c) { c.remove(); });
      // clones nas duas pontas para loop infinito
      for (var i = 0; i < pv; i++) {
        var head = originals[i % total].cloneNode(true);
        var tail = originals[(total - 1 - i + total) % total].cloneNode(true);
        [head, tail].forEach(function (c) { c.classList.add('is-clone'); c.setAttribute('aria-hidden', 'true'); });
        track.appendChild(head);
        track.insertBefore(tail, track.firstChild);
      }
      dotsBox.innerHTML = '';
      originals.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
        b.addEventListener('click', function () { normalize(); go(i); restart(); });
        dotsBox.appendChild(b);
      });
      jump(index);
    }

    function offsetFor(i) {
      var slide = track.children[i + pv];
      return slide ? slide.offsetLeft - track.children[0].offsetLeft : 0;
    }
    function setX(i, animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translateX(' + (-offsetFor(i)) + 'px)';
      if (!animate) { void track.offsetWidth; track.style.transition = ''; }
    }
    function updateDots() {
      var real = ((index % total) + total) % total;
      dotsBox.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-selected', i === real ? 'true' : 'false'); });
      Array.prototype.forEach.call(track.children, function (s, i) {
        var visible = i >= index + pv && i < index + 2 * pv;
        if (!s.classList.contains('is-clone')) s.setAttribute('aria-hidden', visible ? 'false' : 'true');
      });
    }
    function jump(i) { index = i; setX(index, false); updateDots(); }
    // volta para o slide equivalente dentro do intervalo real (os clones permitem a emenda invisível)
    function normalize() {
      if (index >= total) jump(index - total);
      else if (index < 0) jump(index + total);
    }
    function go(i) { index = i; setX(index, !reduceMotion); updateDots(); }

    track.addEventListener('transitionend', function (e) { if (e.target === track) normalize(); });

    // normaliza antes de mover: não depende do transitionend (que não dispara com a aba em segundo plano)
    function next() { normalize(); go(index + 1); }
    function prev() { normalize(); go(index - 1); }
    function start() {
      if (!timer && !reduceMotion) timer = setInterval(function () { if (!paused && !document.hidden) next(); }, 5000);
    }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    root.querySelector('.carousel-next').addEventListener('click', function () { next(); restart(); });
    root.querySelector('.carousel-prev').addEventListener('click', function () { prev(); restart(); });
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    root.addEventListener('focusin', function () { paused = true; });
    root.addEventListener('focusout', function () { paused = false; });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); }
    });

    // arrastar / deslizar
    var startX = null;
    viewport.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    viewport.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
      startX = null;
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (perView() !== pv) build(); else jump(index);
      }, 150);
    });

    build();
    start();
  });

  /* ---------------- Acordeão (apenas um item aberto) ---------------- */
  document.querySelectorAll('[data-accordion]').forEach(function (acc) {
    var items = acc.querySelectorAll('details');
    items.forEach(function (d) {
      var summary = d.querySelector('summary');
      var content = d.querySelector('.acc-content');
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) { close(d); return; }
        items.forEach(function (o) { if (o !== d && o.open) close(o); });
        open(d);
      });
      function open(el) {
        el.open = true;
        if (reduceMotion) return;
        var h = content.scrollHeight;
        content.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px' }, { height: h + 'px' }], { duration: 400, easing: 'ease' });
      }
    });
    function close(el) {
      var content = el.querySelector('.acc-content');
      if (reduceMotion) { el.open = false; return; }
      var anim = content.animate([{ height: content.offsetHeight + 'px' }, { height: '0px', paddingTop: '0px', paddingBottom: '0px' }], { duration: 400, easing: 'ease', fill: 'forwards' });
      // timer garante o fechamento mesmo se a animação não rodar (aba em segundo plano)
      setTimeout(function () { el.open = false; anim.cancel(); }, 400);
    }
  });

  /* ---------------- Abas (Convênios) ---------------- */
  document.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll('[role="tab"]'));
    function select(btn) {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = buttons[(i + 1) % buttons.length];
        if (e.key === 'ArrowLeft') n = buttons[(i - 1 + buttons.length) % buttons.length];
        if (n) { n.focus(); select(n); }
      });
    });
  });

  /* ---------------- Vídeos do YouTube (carregam ao clicar) ---------------- */
  document.querySelectorAll('.video-embed[data-youtube]').forEach(function (box) {
    var btn = box.querySelector('.video-play');
    btn.addEventListener('click', function () {
      var id = box.getAttribute('data-youtube');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&controls=1&playsinline=1';
      iframe.title = box.getAttribute('data-title') || 'Vídeo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---------------- Vídeo de fundo (card "Em breve") ---------------- */
  var bgVideos = document.querySelectorAll('[data-bg-video]');
  if (bgVideos.length && 'IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var id = el.getAttribute('data-bg-video');
        var startAt = el.getAttribute('data-start') || 0;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&loop=1&playlist=' + id +
          '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=' + startAt;
        iframe.title = 'Vídeo de fundo';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        iframe.allow = 'autoplay; encrypted-media';
        el.appendChild(iframe);
        io.unobserve(el);
      });
    }, { rootMargin: '200px' });
    bgVideos.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Faixa contínua de fotos (Sobre) ---------------- */
  document.querySelectorAll('.marquee').forEach(function (m) {
    var track = m.querySelector('.marquee-track');
    var imgs = Array.prototype.slice.call(track.children);
    var perViewCount = 6;
    // repete o conjunto até cobrir a tela e duplica para o loop sem emenda
    var copies = Math.max(1, Math.ceil(perViewCount / imgs.length));
    for (var c = 1; c < copies; c++) imgs.forEach(function (img) { track.appendChild(img.cloneNode(true)); });
    var set = Array.prototype.slice.call(track.children);
    set.forEach(function (img) {
      var clone = img.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.alt = '';
      track.appendChild(clone);
    });
    m.style.setProperty('--count', set.length);
    m.style.setProperty('--shift', '-50%');
  });

  /* ---------------- Banner de cookies ---------------- */
  var banner = document.getElementById('cookie-banner');
  var KEY = 'cookieconsent_status';
  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return document.cookie.indexOf(KEY + '=') > -1 ? 'dismiss' : null; }
  }
  function setConsent() {
    try { localStorage.setItem(KEY, 'dismiss'); } catch (e) { /* ignore */ }
    document.cookie = KEY + '=dismiss; max-age=31536000; path=/; SameSite=Lax';
  }
  if (banner && !getConsent()) {
    banner.hidden = false;
    document.getElementById('cookie-accept').addEventListener('click', function () {
      setConsent();
      banner.classList.add('is-leaving');
      setTimeout(function () { banner.hidden = true; }, 400);
    });
  }

  /* ---------------- Formulário de contato ---------------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var msg = form.querySelector('.form-msg');
    var submit = form.querySelector('.btn-submit');
    // Momento em que o formulário apareceu na tela — usado para pegar robôs
    // que preenchem e enviam tudo em menos de 3 segundos (pessoa real não consegue).
    var abertoEm = Date.now();

    function showMsg(text, isError) {
      msg.textContent = text;
      msg.classList.toggle('error', !!isError);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Duas travas contra robôs, nenhuma delas visível para uma pessoa real:
      // 1) campo-isca preenchido (só um robô preenche um campo escondido);
      // 2) formulário enviado rápido demais para ter sido digitado por alguém.
      if (form._honey && form._honey.value) return;
      if (Date.now() - abertoEm < 3000) return;

      var invalid = null;
      form.querySelectorAll('input:not(.hp), textarea').forEach(function (f) {
        var bad = (f.required && !f.value.trim()) || (f.type === 'email' && f.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.classList.toggle('invalid', bad);
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !invalid) invalid = f;
      });
      if (invalid) {
        showMsg('Por favor, preencha corretamente os campos obrigatórios.', true);
        invalid.focus();
        return;
      }

      var data = {
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        cidade: form.cidade.value.trim(),
        telefone: form.telefone.value.trim(),
        mensagem: form.mensagem.value.trim()
      };

      if (!CONFIG.formEndpoint) {
        var text = 'Olá, vim pelo site e gostaria de mais informações.\n\n' +
          'Nome: ' + (data.nome || '-') + '\nE-mail: ' + data.email + '\nCidade/UF: ' + data.cidade +
          '\nTelefone: ' + data.telefone + (data.mensagem ? '\n\nMensagem: ' + data.mensagem : '');
        window.open('https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        showMsg('Abrimos o WhatsApp com a sua mensagem. É só enviar!');
        form.reset();
        return;
      }

      submit.disabled = true;
      showMsg('Enviando...');
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({
          _subject: 'Novo contato pelo site - Sistema Pax Cristo Rei',
          _template: 'table', // e-mail recebido em formato de tabela, mais fácil de ler
          _captcha: 'false' // o site já barra robôs com o campo-isca e o teste de tempo acima
        }, data))
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        showMsg('A mensagem foi enviada com sucesso.');
        form.reset();
        abertoEm = Date.now();
      }).catch(function () {
        showMsg('Ocorreu um erro ao enviar. Tente novamente ou fale conosco pelo WhatsApp.', true);
      }).then(function () { submit.disabled = false; });
    });
  }
})();
