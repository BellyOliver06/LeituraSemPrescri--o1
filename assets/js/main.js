// Leitura Sem Prescrição - Scripts Interativos

document.addEventListener('DOMContentLoaded', () => {
  // 1. Menu Mobile Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isOpen = navMenu.classList.contains('active');
      mobileToggle.innerHTML = isOpen 
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    });

    // Fechar menu ao clicar em qualquer link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      });
    });
  }

  // 2. Slider / Carrossel Horizontal de Posts
  const slider = document.getElementById('postSlider');
  const btnPrev = document.getElementById('sliderPrev');
  const btnNext = document.getElementById('sliderNext');

  if (slider && btnPrev && btnNext) {
    btnNext.addEventListener('click', () => {
      slider.scrollBy({ left: 280, behavior: 'smooth' });
    });

    btnPrev.addEventListener('click', () => {
      slider.scrollBy({ left: -280, behavior: 'smooth' });
    });
  }

  // 3. Gerador Interativo: "Receita Literária Sem Prescrição"
  const moodButtons = document.querySelectorAll('.mood-btn');
  const resultBox = document.getElementById('rxResult');
  const rxTitle = document.getElementById('rxTitle');
  const rxTag = document.getElementById('rxTag');
  const rxDesc = document.getElementById('rxDesc');
  const rxSideEffect = document.getElementById('rxSideEffect');

  // Base de dados bem-humorada alinhada à estética do carrossel/bio
  const prescriptions = {
    ressaca: {
      title: "Leitura Rápida & Viciante",
      tag: "Dose Emergencial Anti-Tédio",
      desc: "Um thriller ágil de ritmo alucinante ou um romance de poucas páginas que você devora em uma sentada sem pensar nos boletos.",
      warning: "Efeito adverso: você vai prometer 'só mais um capítulo' e terminar às 4h30 da manhã."
    },
    surtar: {
      title: "Dark Fantasy / Plot Twist Cruel",
      tag: "Tarja Preta Literária",
      desc: "Livro denso, com traições chocantes, personagens altamente moralmente questionáveis e um final que vai te fazer encarar o teto por 40 minutos.",
      warning: "Efeito adverso: apego emocional a personagens que obviamente não chegam vivos ao fim."
    },
    conforto: {
      title: "Cozy Pop & Romance Leve",
      tag: "Dose de Dopamina Pura",
      desc: "Aquela história quentinha com clima de cafeteria, piadas internas e que faz parecer que o mundo lá fora não está pegando fogo.",
      warning: "Efeito adverso: sorrisos bobos para a tela/página em locais públicos."
    },
    problema: {
      title: "Romance Duvidoso com Red Flags",
      tag: "Contraindicado pela Razão",
      desc: "Aquele romance de gosto duvidoso que você jamais admitiria em tribunal, mas lê vorazmente porque o entretenimento é de altíssima qualidade.",
      warning: "Efeito adverso: julgar a protagonista e depois concordar com tudo o que ela fez."
    },
    geek: {
      title: "Imersão Nerd / Animes & Games",
      tag: "Multiverso Sem Regras",
      desc: "Uma jornada fantástica em RPGs, animes clássicos ou universos sci-fi com worldbuilding profundo para esquecer a realidade.",
      warning: "Efeito adverso: comprar action figures e passar 3 horas na wiki do universo."
    }
  };

  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mood = btn.getAttribute('data-mood');
      const data = prescriptions[mood];

      if (data && resultBox) {
        resultBox.classList.remove('active');
        setTimeout(() => {
          rxTitle.textContent = data.title;
          rxTag.textContent = data.tag;
          rxDesc.textContent = data.desc;
          rxSideEffect.textContent = `Aviso de bula: ${data.warning}`;
          resultBox.classList.add('active');
        }, 150);
      }
    });
  });

  // Ativar o primeiro botão por padrão
  if (moodButtons.length > 0) {
    moodButtons[0].click();
  }

  // 4. Copiar Link / Toast notification
  const shareBtn = document.getElementById('shareBtn');
  const toast = document.getElementById('toastNotice');

  if (shareBtn && toast) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }).catch(() => {
        toast.textContent = "Link pronto para compartilhar!";
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      });
    });
  }

  // 5. Scroll suave para âncoras
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});
