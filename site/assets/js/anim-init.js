/* Liga as animações só quando há JavaScript e o sistema não pede "menos animações".
   Fica no <head>, antes do CSS/conteúdo, pra valer já na primeira pintura, sem piscar nada na tela. */
try {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('anim');
  }
} catch (e) { /* sem suporte: segue sem animação */ }
