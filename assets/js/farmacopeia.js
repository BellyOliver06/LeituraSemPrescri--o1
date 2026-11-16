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
  const filterCarimbo = document.getElementById('filterCarimbo');
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

  // 3. Renderizar Carimbo Editorial LSP (Prescrito, Uso com Cautela, Contraindicado)
  function renderCarimbo(carimboTipo, tamanho = 'normal') {
    if (!carimboTipo) return '';
    const tipo = carimboTipo.toUpperCase().trim();
    
    let classeCss = '';
    let textoPrincipal = '';
    let textoComplementar = '';
    let icone = '';

    if (tipo === 'PRESCRITO') {
      classeCss = 'carimbo-prescrito';
      textoPrincipal = 'PRESCRITO';
      textoComplementar = 'Vale a leitura!';
      icone = '✓';
    } else if (tipo === 'USO COM CAUTELA' || tipo === 'CAUTELA') {
      classeCss = 'carimbo-cautela';
      textoPrincipal = 'USO COM CAUTELA';
      textoComplementar = 'Leia a bula!';
      icone = '⚠️';
    } else if (tipo === 'CONTRAINDICADO') {
      classeCss = 'carimbo-contraindicado';
      textoPrincipal = 'CONTRAINDICADO';
      textoComplementar = 'Não recomendo!';
      icone = '✕';
    } else {
      return '';
    }

    if (tamanho === 'card') {
      return `
        <div class="stamp-editorial stamp-card ${classeCss}" title="${textoPrincipal} — ${textoComplementar}">
          <span class="stamp-icon">${icone}</span>
          <div class="stamp-text-group">
            <span class="stamp-main-text">${textoPrincipal}</span>
            <span class="stamp-sub-text">${textoComplementar}</span>
          </div>
        </div>
      `;
    }

    // Tamanho maior para ficha detalhada
    return `
      <div class="stamp-editorial stamp-ficha ${classeCss}">
        <div class="stamp-inner-border">
          <div class="stamp-header-row">
            <span class="stamp-lsp-tag">LSP • PRONTUÁRIO EDITORIAL</span>
            <span class="stamp-icon-large">${icone}</span>
          </div>
          <div class="stamp-main-text-large">${textoPrincipal}</div>
          <div class="stamp-sub-text-large">"${textoComplementar}"</div>
        </div>
      </div>
    `;
  }

  // 4. Renderizar Capa ou Placeholder Editorial com identidade do LSP
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
          <div class="book-card-top-meta">
            <div class="book-card-genres">${generosBadges}</div>
            ${livro.carimbo ? renderCarimbo(livro.carimbo, 'card') : ''}
          </div>
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
    const carimboVal = filterCarimbo ? filterCarimbo.value : '';

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

      // Filtro de carimbo editorial
      const matchCarimbo = !carimboVal || 
        (livro.carimbo && livro.carimbo.toUpperCase() === carimboVal.toUpperCase());

      return matchBusca && matchGenero && matchAvaliacao && matchClassificacao && matchCarimbo;
    });

    renderizarCatalogo(filtrados);
  }

  // Event Listeners dos Filtros
  searchInput.addEventListener('input', aplicarFiltros);
  filterGenero.addEventListener('change', aplicarFiltros);
  filterAvaliacao.addEventListener('change', aplicarFiltros);
  filterClassificacao.addEventListener('change', aplicarFiltros);
  if (filterCarimbo) filterCarimbo.addEventListener('change', aplicarFiltros);

  btnLimpar.addEventListener('click', () => {
    searchInput.value = '';
    filterGenero.value = '';
    filterAvaliacao.value = '';
    filterClassificacao.value = '';
    if (filterCarimbo) filterCarimbo.value = '';
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

    // Construção da Seção "Efeitos Adversos" (Observados e Possíveis)
    let efeitosAdversosHtml = '';
    if (Array.isArray(livro.efeitosAdversos) && livro.efeitosAdversos.length > 0) {
      const observados = livro.efeitosAdversos.filter(e => e.tipo === 'OBSERVADO');
      const possiveis = livro.efeitosAdversos.filter(e => e.tipo === 'POSSÍVEL' || e.tipo === 'POSSIVEL');

      let categoriasHtml = '';

      if (observados.length > 0) {
        const itensObs = observados.map(e => `
          <div class="adverse-effect-card effect-observed">
            <div class="effect-header-row">
              <span class="effect-badge badge-observed">OBSERVADO</span>
              <h5 class="effect-name">${e.nome}</h5>
            </div>
            <p class="effect-desc">${e.descricao}</p>
          </div>
        `).join('');

        categoriasHtml += `
          <div class="effects-subgroup">
            <div class="effects-subgroup-title">
              <span class="subgroup-dot dot-observed"></span>
              <span>Reações Clínicas Vivenciadas (Efeitos Observados)</span>
            </div>
            <div class="effects-grid">${itensObs}</div>
          </div>
        `;
      }

      if (possiveis.length > 0) {
        const itensPos = possiveis.map(e => `
          <div class="adverse-effect-card effect-possible">
            <div class="effect-header-row">
              <span class="effect-badge badge-possible">POSSÍVEL</span>
              <h5 class="effect-name">${e.nome}</h5>
            </div>
            <p class="effect-desc">${e.descricao}</p>
          </div>
        `).join('');

        categoriasHtml += `
          <div class="effects-subgroup">
            <div class="effects-subgroup-title">
              <span class="subgroup-dot dot-possible"></span>
              <span>Reações Potenciais em Outros Leitores (Efeitos Possíveis)</span>
            </div>
            <div class="effects-grid">${itensPos}</div>
          </div>
        `;
      }

      // Observação clínica complementar, se houver
      const obsClinicaHtml = livro.observacaoClinica ? `
        <div class="effects-clinical-note font-hand">
          <strong>Nota de Prontuário:</strong> "${livro.observacaoClinica}"
        </div>
      ` : '';

      efeitosAdversosHtml = `
        <div class="ficha-section-block block-efeitos-adversos">
          <div class="ficha-block-header">
            <span class="ficha-block-icon">⚡</span>
            <h4>Efeitos Adversos Literários</h4>
          </div>
          <div class="ficha-block-content">
            <p class="effects-intro-text">
              Reações emocionais, comportamentais e cognitivas desencadeadas pelo contato com a substância literária. Consulte os registros antes de iniciar o tratamento:
            </p>
            ${categoriasHtml}
            ${obsClinicaHtml}
          </div>
        </div>
      `;
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
              ${livro.subtitulo ? `<p class="ficha-book-subtitle font-hand">${livro.subtitulo}</p>` : ''}
              <p class="ficha-book-author">Autoria: <strong>${livro.autor}</strong></p>
            </div>

            <!-- Dados Técnicos (Ocultos se vazios) -->
            <div class="ficha-meta-grid">
              ${renderCampoSeHouver('Origem', livro.origem ? livro.origem : (livro.nacional ? 'Nacional (Brasil)' : ''))}
              ${renderCampoSeHouver('Editora', livro.editora)}
              ${renderCampoSeHouver('Série / Volume', (livro.serie && livro.volume) ? `${livro.serie} (Vol. ${livro.volume})` : (livro.serie || ''))}
              ${renderCampoSeHouver('Ano de Publicação', livro.ano)}
              ${renderCampoSeHouver('Data de Lançamento', livro.dataLancamento)}
              ${renderCampoSeHouver('Número de Páginas', livro.paginas ? `${livro.paginas} páginas` : '')}
              ${renderCampoSeHouver('ISBN', livro.isbn)}
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

            <!-- Efeitos Adversos -->
            ${efeitosAdversosHtml}

            <!-- Veredito & Carimbo Oficial LSP -->
            <div class="ficha-veredito-wrapper">
              ${livro.carimbo ? renderCarimbo(livro.carimbo, 'ficha') : ''}
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
