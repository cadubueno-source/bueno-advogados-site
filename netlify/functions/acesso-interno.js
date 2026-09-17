// Netlify Function: protege a página /acesso-interno com usuário e senha únicos.
// Funciona no plano gratuito do Netlify (Functions estão incluídas).

const USUARIO = "parceiro";
const SENHA = "clientes2026";

const HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<script>
(function () {
  try {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("vortex-pending");
    }
  } catch (e) {}
})();
</script>
<title>Acesso Interno — Bueno Advogados</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<div class="nav-backdrop" data-nav-backdrop></div>

<header class="site-header">
  <div class="container">
    <a href="/index.html" class="brand-row">
      <span class="brand"><strong>Bueno Advogados</strong><span>DIREITO TRIBUTÁRIO</span></span>
    </a>
    <button class="nav-toggle" aria-label="Abrir menu" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <nav class="main-nav" aria-label="Navegação principal">
      <ul>
        <li><a class="nav-link" href="/index.html">Início</a></li>
        <li class="current"><a class="nav-link" href="/acesso-interno/">Acesso Interno</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="conteudo">

  <section class="page-hero">
    <canvas id="vortex-canvas" class="vortex-canvas" aria-hidden="true"></canvas>
    <div class="container">
      <span class="hero-kicker">Área restrita</span>
      <h1>Acesso Interno</h1>
      <p class="hero-lede">Espaço reservado a colaboradores do Bueno Advogados, com avisos, modelos e informações de uso interno.</p>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="grid grid-3 reveal-stagger reveal">
        <div class="area-card" style="--stagger-i:0">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>
          <h3>Avisos internos</h3>
          <p>Comunicados, rotinas e orientações da semana para a equipe.</p>
        </div>
        <div class="area-card" style="--stagger-i:1">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M5 6h14M7 6l-4 8a4 4 0 008 0l-4-8zM17 6l-4 8a4 4 0 008 0l-4-8z"/></svg>
          <h3>Documentos e modelos</h3>
          <p>Modelos de peças, planilhas e materiais de referência do escritório.</p>
        </div>
        <div class="area-card" style="--stagger-i:2">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          <h3>Contatos internos</h3>
          <p>Referências rápidas de contato entre a equipe.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section-alt">
    <div class="container reveal">
      <div class="two-col lead-narrow">
        <div>
          <span class="eyebrow-gold">Conteúdo em construção</span>
          <h2>Esta área ainda está sendo organizada</h2>
        </div>
        <div>
          <p class="text-justify">Esta página fica visível apenas para quem tem o usuário e a senha de acesso interno. Conforme o conteúdo for definido — avisos, modelos de documentos, orientações — ele será adicionado aqui.</p>
        </div>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="container footer-bottom">
    <span>© <span id="ano-atual">2026</span> Bueno Advogados. Área de acesso restrito a colaboradores.</span>
  </div>
</footer>

<script src="/js/main.js"></script>
<script src="/js/vortex-bg.js"></script>
</body>
</html>
`;

exports.handler = async (event) => {
  const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const expected = "Basic " + Buffer.from(`${USUARIO}:${SENHA}`).toString("base64");

  if (authHeader !== expected) {
    return {
      statusCode: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Acesso Interno - Bueno Advogados"',
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: "Autenticação necessária.",
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: HTML,
  };
};
