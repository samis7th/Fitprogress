<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FitProgress AI — Documentação</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c0d0f;
    --bg2: #131517;
    --bg3: #1a1c1f;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.13);
    --accent: #d4f54a;
    --accent2: #a8e020;
    --accent-dim: rgba(212,245,74,0.12);
    --text: #f0f0ee;
    --muted: #8a8d7a;
    --code-bg: #161a14;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    min-height: 100vh;
  }

  /* ── HERO ── */
  .hero {
    position: relative;
    padding: 5rem 2rem 4rem;
    text-align: center;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
  }

  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% -10%, rgba(212,245,74,0.18) 0%, transparent 70%),
      repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 40px);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-block;
    background: var(--accent-dim);
    border: 1px solid rgba(212,245,74,0.3);
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(4rem, 10vw, 8rem);
    letter-spacing: 0.03em;
    line-height: 0.95;
    color: #fff;
    position: relative;
    margin-bottom: 0.4rem;
  }

  .hero h1 span {
    color: var(--accent);
    display: block;
  }

  .hero-sub {
    font-size: 1.05rem;
    color: var(--muted);
    max-width: 560px;
    margin: 1.2rem auto 2rem;
    position: relative;
    font-weight: 300;
  }

  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    position: relative;
  }

  .tag {
    background: var(--bg3);
    border: 1px solid var(--border2);
    color: var(--muted);
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    padding: 5px 12px;
    border-radius: 6px;
    letter-spacing: 0.02em;
  }

  /* ── LAYOUT ── */
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 2rem 6rem;
  }

  /* ── SECTION ── */
  section { margin-top: 4rem; }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.5rem;
  }

  h2 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.4rem;
    letter-spacing: 0.04em;
    color: #fff;
    margin-bottom: 1.2rem;
  }

  h3 {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 2rem 0 0.6rem;
  }

  p { color: var(--muted); margin-bottom: 0.8rem; }

  /* ── DIVIDER ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border2), transparent);
    margin: 0;
  }

  /* ── FEATURE GRID ── */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .feature-card {
    background: var(--bg2);
    padding: 1.4rem;
    transition: background 0.2s;
  }

  .feature-card:hover { background: var(--bg3); }

  .feature-icon {
    width: 36px;
    height: 36px;
    background: var(--accent-dim);
    border: 1px solid rgba(212,245,74,0.25);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.9rem;
  }

  .feature-icon svg { width: 18px; height: 18px; stroke: var(--accent); fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

  .feature-card strong {
    display: block;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.3rem;
  }

  .feature-card p { font-size: 0.83rem; margin: 0; }

  /* ── STACK ── */
  .stack-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 600px) { .stack-row { grid-template-columns: 1fr; } }

  .stack-col {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.2rem;
  }

  .stack-col h4 {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.8rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--border);
  }

  .stack-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stack-list li {
    font-size: 0.82rem;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .stack-list li::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    opacity: 0.7;
  }

  /* ── TABLES ── */
  .table-section { margin-top: 2rem; }

  .db-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.83rem;
  }

  .db-table thead th {
    background: var(--bg3);
    color: var(--accent);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border2);
  }

  .db-table tbody tr { border-bottom: 1px solid var(--border); }
  .db-table tbody tr:hover td { background: var(--bg3); }

  .db-table td {
    padding: 9px 14px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
  }

  .db-table td:first-child { color: var(--text); }

  .table-wrapper {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .table-title {
    background: var(--bg3);
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text);
  }

  /* ── ROUTES ── */
  .route-group { margin-bottom: 2rem; }

  .route-group-title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.6rem;
  }

  .route-list { display: flex; flex-direction: column; gap: 4px; }

  .route {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    transition: border-color 0.2s;
  }

  .route:hover { border-color: var(--border2); }

  .method {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    flex-shrink: 0;
    letter-spacing: 0.05em;
  }

  .GET  { background: rgba(59,201,149,0.15); color: #3bc995; }
  .POST { background: rgba(93,130,244,0.15); color: #5d82f4; }
  .PATCH { background: rgba(245,166,67,0.15); color: #f5a643; }
  .DELETE { background: rgba(230,80,80,0.15); color: #e65050; }

  .route-path { color: var(--text); flex: 1; }

  /* ── CODE BLOCKS ── */
  pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.2rem 1.4rem;
    overflow-x: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    color: #b8c4a0;
    line-height: 1.7;
    margin: 0.8rem 0;
  }

  code { font-family: 'JetBrains Mono', monospace; font-size: 0.82em; color: var(--accent); background: var(--accent-dim); padding: 1px 6px; border-radius: 4px; }

  pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

  /* ── ENV BLOCK ── */
  .env-block {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 0 10px 10px 0;
    padding: 1.2rem 1.4rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #b8c4a0;
    margin: 0.8rem 0;
  }

  .env-key { color: var(--accent); }
  .env-val { color: #6ec6c6; }
  .env-comment { color: #555; }

  /* ── SECURITY CARDS ── */
  .security-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  .security-item {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .security-bullet {
    width: 22px;
    height: 22px;
    background: var(--accent-dim);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .security-bullet svg { width: 12px; height: 12px; stroke: var(--accent); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  .security-item p { font-size: 0.82rem; margin: 0; line-height: 1.5; }

  /* ── STRUCTURE ── */
  .file-tree {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.4rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.79rem;
    line-height: 2;
    color: var(--muted);
  }

  .file-tree .dir { color: var(--text); font-weight: 500; }
  .file-tree .file { color: #7a9c6a; }
  .file-tree .hi { color: var(--accent); }

  /* ── COMMANDS ── */
  .cmd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 1rem;
  }

  .cmd-block {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .cmd-block-title {
    background: var(--bg3);
    border-bottom: 1px solid var(--border);
    padding: 8px 14px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .cmd-block pre {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 1rem 1.4rem;
    margin: 0;
  }

  /* ── STATUS BADGE ── */
  .status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(212,245,74,0.06);
    border: 1px solid rgba(212,245,74,0.2);
    border-radius: 10px;
    padding: 1rem 1.4rem;
    margin-top: 1.5rem;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

  .status-bar p { margin: 0; font-size: 0.88rem; color: var(--text); }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--border);
    padding: 2.5rem 2rem;
    text-align: center;
    color: var(--muted);
    font-size: 0.82rem;
  }

  footer span { color: var(--accent); }
</style>
</head>
<body>

<!-- ══════════ HERO ══════════ -->
<div class="hero">
  <div class="hero-badge">Full Stack · Open Source</div>
  <h1>FitProgress<span>AI</span></h1>
  <p class="hero-sub">Plataforma completa para acompanhamento de treinos, evolução corporal, metas de carga e nutrição — com autenticação real e segurança por design.</p>
  <div class="hero-tags">
    <span class="tag">FastAPI</span>
    <span class="tag">React</span>
    <span class="tag">Supabase</span>
    <span class="tag">PostgreSQL</span>
    <span class="tag">TailwindCSS</span>
    <span class="tag">Docker</span>
    <span class="tag">Recharts</span>
    <span class="tag">JWT Auth</span>
    <span class="tag">RLS</span>
  </div>
</div>

<div class="page">

  <!-- ══════════ FUNCIONALIDADES ══════════ -->
  <section>
    <div class="section-label">O que você pode fazer</div>
    <h2>Funcionalidades</h2>
    <div class="feature-grid">

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M12 7V5M8 7V5M16 7V5"/></svg></div>
        <strong>Planejamento Semanal</strong>
        <p>Monte treinos por dia da semana com exercícios, séries, reps e carga alvo.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <strong>Registro de Execução</strong>
        <p>Execute treinos registrando cargas e repetições reais. Histórico completo por sessão.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div>
        <strong>Recordes Pessoais</strong>
        <p>Cálculo automático de PRs por exercício. Veja sua evolução em tempo real.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
        <strong>Metas de Carga</strong>
        <p>Crie metas por exercício. Detecção automática de meta atingida com base nos PRs.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
        <strong>Evolução de Peso</strong>
        <p>Registre peso por data e acompanhe o gráfico de evolução corporal.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
        <strong>Dieta & Nutrição</strong>
        <p>Registre refeições com tipo, calorias, proteína e descrição por data.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <strong>Catálogo de Exercícios</strong>
        <p>Busca por nome, filtro por grupo muscular, criação própria e favoritos.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>
        <strong>Dashboard</strong>
        <p>Visão geral com treinos, peso atual, metas ativas, PRs recentes e gráficos.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <strong>Auth & Segurança</strong>
        <p>Login via Supabase Auth, JWT, RLS por usuário e renovação de sessão.</p>
      </div>

    </div>
  </section>

  <!-- ══════════ STACK ══════════ -->
  <section>
    <div class="section-label">Tecnologias</div>
    <h2>Stack</h2>
    <div class="stack-row">
      <div class="stack-col">
        <h4>Backend</h4>
        <ul class="stack-list">
          <li>Python</li>
          <li>FastAPI</li>
          <li>Pydantic</li>
          <li>Uvicorn</li>
          <li>Supabase Python</li>
          <li>Docker</li>
        </ul>
      </div>
      <div class="stack-col">
        <h4>Frontend</h4>
        <ul class="stack-list">
          <li>React</li>
          <li>Vite</li>
          <li>TailwindCSS</li>
          <li>Axios</li>
          <li>React Router</li>
          <li>Recharts</li>
          <li>Nginx (prod)</li>
        </ul>
      </div>
      <div class="stack-col">
        <h4>Banco & Auth</h4>
        <ul class="stack-list">
          <li>Supabase PostgreSQL</li>
          <li>Supabase Auth</li>
          <li>JWT</li>
          <li>Row Level Security</li>
          <li>Políticas por usuário</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ══════════ ESTRUTURA ══════════ -->
  <section>
    <div class="section-label">Organização do código</div>
    <h2>Estrutura do Projeto</h2>
    <div class="file-tree">
      <span class="hi">project01/</span><br>
      &nbsp;&nbsp;<span class="dir">backend/</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="file">main.py &nbsp;db.py &nbsp;auth.py</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="dir">routes/ &nbsp;</span><span class="file">dashboard · dieta · exercicios · metas · peso · semana · treinos</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="dir">schemas/ &nbsp;</span><span class="file">dieta · exercicio · meta · peso · semana · treino</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="dir">services/ &nbsp;</span><span class="file">dashboard_service · pr_service</span><br>
      <br>
      &nbsp;&nbsp;<span class="dir">frontend/src/</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="file">components/ &nbsp;context/ &nbsp;layout/ &nbsp;pages/ &nbsp;services/ &nbsp;utils/</span><br>
      <br>
      &nbsp;&nbsp;<span class="dir">supabase/</span><br>
      &nbsp;&nbsp;&nbsp;&nbsp;<span class="hi">schema.sql</span><br>
      <br>
      &nbsp;&nbsp;<span class="file">docker-compose.yml &nbsp;docker-compose.prod.yml</span><br>
      &nbsp;&nbsp;<span class="file">requirements.txt &nbsp;README.md &nbsp;README_AWS.md</span>
    </div>
  </section>

  <!-- ══════════ BANCO DE DADOS ══════════ -->
  <section>
    <div class="section-label">Banco de dados</div>
    <h2>Tabelas Principais</h2>

    <div class="table-section">
      <div class="table-wrapper">
        <div class="table-title">treinos</div>
        <table class="db-table">
          <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
          <tbody>
            <tr><td>id</td><td>Identificador único</td></tr>
            <tr><td>usuario_id</td><td>Vinculado ao auth.uid()</td></tr>
            <tr><td>sessao_id</td><td>Agrupador de sessão</td></tr>
            <tr><td>exercicio / grupo / categoria</td><td>Dados do exercício</td></tr>
            <tr><td>series / carga / repeticoes</td><td>Execução real</td></tr>
            <tr><td>data / created_at</td><td>Timestamps</td></tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrapper">
        <div class="table-title">metas</div>
        <table class="db-table">
          <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
          <tbody>
            <tr><td>exercicio</td><td>Exercício alvo da meta</td></tr>
            <tr><td>meta_carga / meta_repeticoes</td><td>Valores alvo</td></tr>
            <tr><td>concluida</td><td>Status da meta</td></tr>
            <tr><td>concluida_em</td><td>Data de conclusão</td></tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrapper">
        <div class="table-title">exercicios</div>
        <table class="db-table">
          <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
          <tbody>
            <tr><td>nome / grupo / categoria</td><td>Dados do exercício</td></tr>
            <tr><td>criado_por</td><td>null = padrão · auth.uid() = personalizado</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ══════════ SEGURANÇA ══════════ -->
  <section>
    <div class="section-label">Auth & RLS</div>
    <h2>Segurança</h2>
    <div class="security-grid">
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p>Backend valida JWT antes de qualquer rota protegida.</p>
      </div>
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p><code>usuario_id</code> nunca vem do body — vem do token autenticado.</p>
      </div>
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p>RLS garante isolamento total de dados por usuário no Supabase.</p>
      </div>
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p>Todas as rotas usam <code>Depends(get_current_user)</code>.</p>
      </div>
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p>Favoritos e exercícios personalizados também são isolados por usuário.</p>
      </div>
      <div class="security-item">
        <div class="security-bullet"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
        <p>Nunca use a chave <code>service_role</code> no backend deste projeto.</p>
      </div>
    </div>
  </section>

  <!-- ══════════ ENV ══════════ -->
  <section>
    <div class="section-label">Configuração</div>
    <h2>Variáveis de Ambiente</h2>

    <h3>Backend — <code>.env</code></h3>
    <div class="env-block">
      <span class="env-comment"># raiz do projeto</span><br>
      <span class="env-key">SUPABASE_URL</span>=<span class="env-val">https://seu-projeto.supabase.co</span><br>
      <span class="env-key">SUPABASE_KEY</span>=<span class="env-val">sua-chave-anon-public</span><br>
      <span class="env-key">CORS_ORIGINS</span>=<span class="env-val">http://localhost:3001,http://127.0.0.1:3001</span>
    </div>

    <h3>Frontend — <code>frontend/.env</code></h3>
    <div class="env-block">
      <span class="env-key">VITE_API_URL</span>=<span class="env-val">http://localhost:8000</span><br>
      <span class="env-key">VITE_SUPABASE_URL</span>=<span class="env-val">https://seu-projeto.supabase.co</span><br>
      <span class="env-key">VITE_SUPABASE_ANON_KEY</span>=<span class="env-val">sua-chave-anon-public</span>
    </div>
  </section>

  <!-- ══════════ ROTAS ══════════ -->
  <section>
    <div class="section-label">API Reference</div>
    <h2>Rotas da API</h2>

    <div class="route-group">
      <div class="route-group-title">Treinos</div>
      <div class="route-list">
        <div class="route"><span class="method GET">GET</span><span class="route-path">/treinos</span></div>
        <div class="route"><span class="method POST">POST</span><span class="route-path">/treinos</span></div>
        <div class="route"><span class="method GET">GET</span><span class="route-path">/treinos/sessoes</span></div>
        <div class="route"><span class="method POST">POST</span><span class="route-path">/treinos/sessao</span></div>
        <div class="route"><span class="method GET">GET</span><span class="route-path">/treinos/pr</span></div>
        <div class="route"><span class="method PATCH">PATCH</span><span class="route-path">/treinos/{treino_id}</span></div>
        <div class="route"><span class="method DELETE">DELETE</span><span class="route-path">/treinos/{treino_id}</span></div>
      </div>
    </div>

    <div class="route-group">
      <div class="route-group-title">Semana · Peso · Metas · Dieta</div>
      <div class="route-list">
        <div class="route"><span class="method GET">GET</span><span class="route-path">/semana &nbsp;/peso &nbsp;/metas &nbsp;/dieta</span></div>
        <div class="route"><span class="method POST">POST</span><span class="route-path">/semana &nbsp;/peso &nbsp;/metas &nbsp;/dieta</span></div>
        <div class="route"><span class="method PATCH">PATCH</span><span class="route-path">/{recurso}/{id}</span></div>
        <div class="route"><span class="method DELETE">DELETE</span><span class="route-path">/{recurso}/{id}</span></div>
      </div>
    </div>

    <div class="route-group">
      <div class="route-group-title">Exercícios</div>
      <div class="route-list">
        <div class="route"><span class="method GET">GET</span><span class="route-path">/exercicios</span></div>
        <div class="route"><span class="method POST">POST</span><span class="route-path">/exercicios</span></div>
        <div class="route"><span class="method GET">GET</span><span class="route-path">/exercicios/favoritos</span></div>
        <div class="route"><span class="method POST">POST</span><span class="route-path">/exercicios/favoritos</span></div>
        <div class="route"><span class="method DELETE">DELETE</span><span class="route-path">/exercicios/favoritos/{favorito_id}</span></div>
      </div>
    </div>

    <h3>Autorização</h3>
    <pre><code>Authorization: Bearer SEU_ACCESS_TOKEN</code></pre>
  </section>

  <!-- ══════════ COMANDOS ══════════ -->
  <section>
    <div class="section-label">Como rodar</div>
    <h2>Comandos Úteis</h2>

    <div class="cmd-grid">
      <div class="cmd-block">
        <div class="cmd-block-title">Docker — Local</div>
        <pre><code>docker compose up --build
docker compose down
docker compose restart backend
docker compose restart frontend</code></pre>
      </div>

      <div class="cmd-block">
        <div class="cmd-block-title">Docker — Produção</div>
        <pre><code>docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down</code></pre>
      </div>

      <div class="cmd-block">
        <div class="cmd-block-title">Backend — Sem Docker</div>
        <pre><code>python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload</code></pre>
      </div>

      <div class="cmd-block">
        <div class="cmd-block-title">Frontend — Sem Docker</div>
        <pre><code>cd frontend
npm install
npm run dev
npm run build</code></pre>
      </div>
    </div>

    <h3>Acessos após subir</h3>
    <div class="env-block">
      <span class="env-comment"># Local</span><br>
      <span class="env-key">Frontend</span>&nbsp; <span class="env-val">http://localhost:3001</span><br>
      <span class="env-key">API</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="env-val">http://localhost:8000</span><br>
      <span class="env-key">Swagger</span>&nbsp; <span class="env-val">http://localhost:8000/docs</span>
    </div>
  </section>

  <!-- ══════════ STATUS ══════════ -->
  <section>
    <div class="section-label">Status</div>
    <h2>Estado do Projeto</h2>
    <div class="status-bar">
      <div class="status-dot"></div>
      <p>Pronto para produção inicial — autenticação integrada, RLS ativo, backend modular, frontend responsivo, Docker local e produção configurados, estrutura preparada para deploy em AWS EC2.</p>
    </div>
  </section>

</div>

<footer>
  Desenvolvido para portfólio e estudos · <span>FitProgress AI</span>
</footer>

</body>
</html>
