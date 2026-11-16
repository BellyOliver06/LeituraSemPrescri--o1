// Farmacopeia Literária - Leitura Sem Prescrição
// Motor de renderização, filtros, pesquisa em tempo real e ficha individual

document.addEventListener('DOMContentLoaded', () => {
  // Dados de livros carregados globalmente
  const livros = window.LSP_FARMACOPEIA_LIVROS || [];

  // Elementos do DOM
  const searchInput = document.getElementById('searchInput');
  const filterGenero = document.getElementById('filterGenero');
  const filterAvaliacao = document.getElementById('filterAvaliacao');
  const filterClassificacao = document.getElementById('filterClassificacao');
  const btnLimpar = document.getElementById('btnLimparFiltros');
  const catalogGrid = document.getElementById('catalogGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCounter = document.getElementById('resultsCounter');

  // Modal / Painel da Ficha
  const modal = document.getElementById('fichaModal');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const fichaContent = document.getElementById('fichaContent');

  // Menu Mobile Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // 1. Povoar os filtros dinamicamente com base nas obras cadastradas
  function inicializarFiltros() {
    const generosSet = new Set();
    const classificacaoSet = new Set();

    livros.forEach(livro => {
      if (Array.isArray(livro.generos)) {
        livro.generos.forEach(g => generosSet.add(g.trim()));
      }
      if (livro.classificacaoIndicativa && livro.classificacaoIndicativa.trim() !== "") {
        classificacaoSet.add(livro.classificacaoIndicativa.trim());
      }
    });

    // Povoar Gêneros
    Array.from(generosSet).sort().forEach(gen => {
      const opt = document.createElement('option');
      opt.value = gen;
      opt.textContent = gen;
      filterGenero.appendChild(opt);
    });

    // Povoar Classificação
    Array.from(classificacaoSet).sort().forEach(clas => {
      const opt = document.createElement('option');
      opt.value = clas;
      opt.textContent = clas;
      filterClassificacao.appendChild(opt);
    });
  }

  // 2. Renderização de estrelas
  function formatarEstrelas(nota) {
    if (typeof nota !== 'number') return '';
    const estrelasCheias = Math.floor(nota);
    const meiaEstrela = (nota % 1) >= 0.5;
    let html = '';
    for (let i = 0; i < estrelasCheias; i++) {
      html += '<span class="star-filled">★</span>';
    }
    if (meiaEstrela) {
      html += '<span class="star-half">★</span>';
    }
    const totalEstrelas = Math.ceil(nota);
    for (let i = totalEstrelas; i < 5; i++) {
      html += '<span class="star-empty">☆</span>';
    }
    return `${html} <span class="star-score">${nota.toFixed(1)}/5</span>`;
  }

  // 3. Renderizar Capa ou Placeholder Editorial com identidade do LSP
  function renderCapa(livro, extraClass = '') {
    if (livro.capa && livro.capa.trim() !== '') {
      return `<img src="${livro.capa}" alt="Capa de ${livro.titulo}" class="book-cover-img ${extraClass}" loading="lazy">`;
    }
    // Placeholder estilizado fiel à marca (sem usar imagens genéricas falsas)
    const generoPrincipal = (livro.generos && livro.generos[0]) ? livro.generos[0] : 'Registro Oficial';
    return `
      <div class="book-cover-placeholder ${extraClass}">
        <div class="placeholder-tape">ARQUIVO LSP</div>
        <div class="placeholder-icon">📖</div>
        <div class="placeholder-title">${livro.titulo}</div>
        <div class="placeholder-author">${livro.autor}</div>
        <div class="placeholder-tag">${generoPrincipal}</div>
      </div>
    `;
  }

  // 4. Renderizar Cards do Catálogo
  function renderizarCatalogo(lista) {
    catalogGrid.innerHTML = '';

    if (!lista || lista.length === 0) {
      catalogGrid.style.display = 'none';
      emptyState.style.display = 'block';
      resultsCounter.textContent = '0 fórmulas encontradas';
      return;
    }

    catalogGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    resultsCounter.textContent = `${lista.length} ${lista.length === 1 ? 'fórmula catalogada' : 'fórmulas catalogadas'}`;

    lista.forEach(livro => {
      const card = document.createElement('article');
      card.className = 'book-card';
      card.setAttribute('data-id', livro.id);

      const generosBadges = (livro.generos || [])
        .map(g => `<span class="badge-genero">${g}</span>`)
        .join('');

      card.innerHTML = `
        <div class="book-card-cover-wrap">
          ${renderCapa(livro)}
          ${livro.nacional ? `<span class="badge-nacional">🇧🇷 Nacional</span>` : ''}
          ${livro.classificacaoIndicativa ? `<span class="badge-rating-age">${livro.classificacaoIndicativa}</span>` : ''}
        </div>
        <div class="book-card-body">
          <div class="book-card-genres">${generosBadges}</div>
          <h3 class="book-card-title">${livro.titulo}</h3>
          <p class="book-card-author">Por <strong>${livro.autor}</strong></p>
          <div class="book-card-rating">${formatarEstrelas(livro.avaliacao)}</div>
          ${livro.chamada ? `<p class="book-card-quote font-hand">"${livro.chamada}"</p>` : ''}
          <button type="button" class="btn-consultar-ficha" data-book-id="${livro.id}">
            <span>Consultar Ficha</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      `;

      catalogGrid.appendChild(card);
    });

    // Vincular clique nos botões de ficha
    document.querySelectorAll('.btn-consultar-ficha').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-book-id');
        abrirFichaLivro(id);
      });
    });
  }

  // 5. Filtragem em tempo real
  function aplicarFiltros() {
    const termo = searchInput.value.toLowerCase().trim();
    const genVal = filterGenero.value;
    const avalVal = filterAvaliacao.value ? parseFloat(filterAvaliacao.value) : null;
    const clasVal = filterClassificacao.value;

    const filtrados = livros.filter(livro => {
      // Busca por título ou autor
      const matchBusca = !termo || 
        livro.titulo.toLowerCase().includes(termo) || 
        livro.autor.toLowerCase().includes(termo);

      // Filtro de gênero
      const matchGenero = !genVal || 
        (Array.isArray(livro.generos) && livro.generos.includes(genVal));

      // Filtro de avaliação mínima
      const matchAvaliacao = avalVal === null || 
        (typeof livro.avaliacao === 'number' && livro.avaliacao >= avalVal);

      // Filtro de classificação indicativa
      const matchClassificacao = !clasVal || 
        (livro.classificacaoIndicativa && livro.classificacaoIndicativa === clasVal);

      return matchBusca && matchGenero && matchAvaliacao && matchClassificacao;
    });

    renderizarCatalogo(filtrados);
  }

  // Event Listeners dos Filtros
  searchInput.addEventListener('input', aplicarFiltros);
  filterGenero.addEventListener('change', aplicarFiltros);
  filterAvaliacao.addEventListener('change', aplicarFiltros);
  filterClassificacao.addEventListener('change', aplicarFiltros);

  btnLimpar.addEventListener('click', () => {
    searchInput.value = '';
    filterGenero.value = '';
    filterAvaliacao.value = '';
    filterClassificacao.value = '';
    aplicarFiltros();
  });

  // 6. Abrir e preencher a Ficha Individual (Documento Farmacêutico)
  function abrirFichaLivro(bookId) {
    const livro = livros.find(l => l.id === bookId);
    if (!livro) return;

    // Helper para exibir campo somente se preenchido
    const renderCampoSeHouver = (label, valor) => {
      if (!valor || valor.trim() === '') return '';
      return `
        <div class="ficha-meta-item">
          <span class="ficha-label">${label}:</span>
          <span class="ficha-value">${valor}</span>
        </div>
      `;
    };

    const renderSecaoSeHouver = (titulo, conteudo, classeExtra = '', icone = '💊') => {
      if (!conteudo) return '';
      let corpoHtml = '';
      if (Array.isArray(conteudo)) {
        if (conteudo.length === 0) return '';
        corpoHtml = `<ul class="ficha-list-items">${conteudo.map(item => `<li>${item}</li>`).join('')}</ul>`;
      } else if (typeof conteudo === 'string') {
        if (conteudo.trim() === '') return '';
        corpoHtml = `<p>${conteudo.replace(/\n\n/g, '</p><p>')}</p>`;
      }
      return `
        <div class="ficha-section-block ${classeExtra}">
          <div class="ficha-block-header">
            <span class="ficha-block-icon">${icone}</span>
            <h4>${titulo}</h4>
          </div>
          <div class="ficha-block-content">${corpoHtml}</div>
        </div>
      `;
    };

    // Construção das partes de posologia
    let posologiaHtml = '';
    if (livro.posologia) {
      const p = livro.posologia;
      const partes = [];
      if (p.opiniao) partes.push(`<p>${p.opiniao.replace(/\n\n/g, '</p><p>')}</p>`);
      if (p.gostou) partes.push(`<p><strong>O que gostei:</strong> ${p.gostou}</p>`);
      if (p.naoGostou) partes.push(`<p><strong>O que não funcionou tão bem:</strong> ${p.naoGostou}</p>`);
      if (p.personagens) partes.push(`<p><strong>Personagens & Desenvolvimento:</strong> ${p.personagens}</p>`);
      if (p.destaques) partes.push(`<p><strong>Elementos de destaque:</strong> ${p.destaques}</p>`);
      if (p.experiencia) partes.push(`<p><strong>Experiência geral de leitura:</strong> ${p.experiencia}</p>`);
      posologiaHtml = partes.join('');
    }

    // Montar HTML da Ficha Farmacêutica
    fichaContent.innerHTML = `
      <div class="ficha-document">
        <!-- Tarja / Cabeçalho de Formulário Farmacêutico -->
        <div class="ficha-doc-header">
          <div class="ficha-doc-stamp">
            <span>REGISTRO OFICIAL LSP</span>
            <strong>FARMACOPEIA LITERÁRIA • ARQUIVO #${livro.id.toUpperCase()}</strong>
          </div>
          <div class="ficha-doc-tag">USO LITERÁRIO NÃO RESTRITO</div>
        </div>

        <div class="ficha-main-grid">
          <!-- Coluna 1: Capa & Identificação Primária -->
          <div class="ficha-sidebar">
            <div class="ficha-cover-wrapper">
              ${renderCapa(livro, 'ficha-cover-img')}
            </div>

            <div class="ficha-tags-list">
              ${livro.nacional ? `<span class="ficha-pill-tag tag-nacional">🇧🇷 Literatura Nacional</span>` : ''}
              ${(livro.generos || []).map(g => `<span class="ficha-pill-tag">${g}</span>`).join('')}
              ${livro.statusLeitura ? `<span class="ficha-pill-tag tag-status">${livro.statusLeitura}</span>` : ''}
              ${livro.classificacaoIndicativa ? `<span class="ficha-pill-tag tag-age">${livro.classificacaoIndicativa}</span>` : ''}
            </div>

            <div class="ficha-score-box">
              <span class="score-title">AVALIAÇÃO DA CRIADORA</span>
              <div class="score-stars">${formatarEstrelas(livro.avaliacao)}</div>
            </div>
          </div>

          <!-- Coluna 2: Informações Técnicas & Bula -->
          <div class="ficha-details">
            <div class="ficha-title-block">
              <span class="ficha-subtitle-author">SUBSTÂNCIA:</span>
              <h2 class="ficha-book-title">${livro.titulo}</h2>
              <p class="ficha-book-author">Autoria: <strong>${livro.autor}</strong></p>
            </div>

            <!-- Dados Técnicos (Ocultos se vazios) -->
            <div class="ficha-meta-grid">
              ${renderCampoSeHouver('Origem', livro.nacional ? 'Nacional (Brasil)' : '')}
              ${renderCampoSeHouver('Editora', livro.editora)}
              ${renderCampoSeHouver('Ano de Publicação', livro.ano)}
              ${renderCampoSeHouver('Classificação Indicativa', livro.classificacaoIndicativa)}
              ${renderCampoSeHouver('Status de Leitura', livro.statusLeitura)}
            </div>

            <!-- Composição / Sinopse -->
            ${livro.composicao && (livro.composicao.sinopse || livro.composicao.caracteristicas) ? `
              <div class="ficha-section-block">
                <div class="ficha-block-header">
                  <span class="ficha-block-icon">🧪</span>
                  <h4>Composição da Obra (Sinopse)</h4>
                </div>
                <div class="ficha-block-content">
                  ${livro.composicao.sinopse ? `<p>${livro.composicao.sinopse.replace(/\n\n/g, '</p><p>')}</p>` : ''}
                  ${livro.composicao.caracteristicas ? `<p class="ficha-subtext"><strong>Características da narrativa:</strong> ${livro.composicao.caracteristicas}</p>` : ''}
                </div>
              </div>
            ` : `
              <div class="ficha-section-block ficha-pendente-block">
                <div class="ficha-block-header">
                  <span class="ficha-block-icon">🧪</span>
                  <h4>Composição da Obra (Sinopse)</h4>
                </div>
                <div class="ficha-block-content">
                  <p class="text-pendente">Sinopse pendente de cadastro oficial pela leitora.</p>
                </div>
              </div>
            `}

            <!-- Indicações -->
            ${renderSecaoSeHouver('Indicações Literárias', livro.indicacoes, 'block-indicacoes', '✓')}

            <!-- Contraindicações e Efeitos Adversos -->
            ${renderSecaoSeHouver('Contraindicações & Avisos de Conteúdo', livro.contraindicacoes, 'block-contraindicacoes', '⚠️')}

            <!-- Posologia Literária (Opinião Pessoal) -->
            ${posologiaHtml ? `
              <div class="ficha-section-block block-posologia">
                <div class="ficha-block-header">
                  <span class="ficha-block-icon">📝</span>
                  <h4>Posologia Literária (Opiniões da Isabelly)</h4>
                </div>
                <div class="ficha-block-content">${posologiaHtml}</div>
              </div>
            ` : ''}

            <!-- Veredito -->
            ${livro.veredito ? `
              <div class="ficha-veredito-box">
                <div class="veredito-badge">VEREDITO FINAL LSP</div>
                <p class="font-hand veredito-text">"${livro.veredito}"</p>
                <div class="veredito-signature">— Isabelly • Leitura Sem Prescrição ♡</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Fechar Modal
  function fecharModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', fecharModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', fecharModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      fecharModal();
    }
  });

  // Inicialização
  inicializarFiltros();
  renderizarCatalogo(livros);
});
