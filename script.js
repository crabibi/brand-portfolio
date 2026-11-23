document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.nav-links a');

const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const closeMenu = () => {
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航菜单');
};

menuToggle.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单');
});

navLinks.forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach(item => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -45px' });
  revealItems.forEach(item => revealObserver.observe(item));
}

const sections = [...document.querySelectorAll('#work, #about, #experience, #contact')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
  sections.forEach(section => sectionObserver.observe(section));
}

const counters = document.querySelectorAll('[data-count]');
const animateCounter = element => {
  const target = Number(element.dataset.count);
  if (reducedMotion) {
    element.textContent = target;
    return;
  }
  const duration = 1300;
  const start = performance.now();
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if ('IntersectionObserver' in window && !reducedMotion) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(counter => counterObserver.observe(counter));
}

const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('p');

document.querySelectorAll('[data-lightbox]').forEach(button => {
  button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.lightbox;
    lightboxImage.alt = button.dataset.caption;
    lightboxCaption.textContent = button.dataset.caption;
    lightbox.showModal();
  });
});

lightbox.querySelector('.dialog-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});

document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.poster-track');
  const slides = [...track.children];
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const open = carousel.querySelector('[data-carousel-open]');
  const status = carousel.querySelector('.carousel-status');
  let currentIndex = 0;
  let pointerActive = false;
  let pointerId = null;
  let startX = 0;
  let dragged = false;

  const getStep = () => slides[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const goTo = index => {
    currentIndex = Math.max(0, Math.min(slides.length - 1, index));
    track.style.transform = `translateX(${-currentIndex * getStep()}px)`;
    status.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    open.dataset.lightbox = slides[currentIndex].dataset.lightbox;
    open.dataset.caption = slides[currentIndex].dataset.caption;
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === slides.length - 1;
    next.setAttribute('aria-label', `下一张海报，当前第 ${currentIndex + 1} 张`);
  };

  previous.addEventListener('click', () => goTo(currentIndex - 1));
  next.addEventListener('click', () => goTo(currentIndex + 1));
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goTo(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    pointerActive = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    dragged = false;
  });
  track.addEventListener('pointermove', event => {
    if (!pointerActive || event.pointerId !== pointerId) return;
    if (Math.abs(event.clientX - startX) < 12) return;
    dragged = true;
    track.setPointerCapture(pointerId);
  });
  track.addEventListener('pointerup', event => {
    if (!pointerActive || event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (dragged && Math.abs(distance) > 45) goTo(currentIndex + (distance < 0 ? 1 : -1));
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
    pointerActive = false;
  });
  track.addEventListener('pointercancel', () => {
    pointerActive = false;
    dragged = false;
  });
  track.addEventListener('touchstart', event => {
    startX = event.touches[0].clientX;
    dragged = false;
  }, { passive: true });
  track.addEventListener('touchmove', event => {
    if (Math.abs(event.touches[0].clientX - startX) > 12) dragged = true;
  }, { passive: true });
  track.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - startX;
    if (dragged && Math.abs(distance) > 45) goTo(currentIndex + (distance < 0 ? 1 : -1));
  });
  track.addEventListener('click', event => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
  window.addEventListener('resize', () => goTo(currentIndex));
  goTo(0);
});

const cases = {
  blue: {
    kicker: 'PROJECT 01 / OFFLINE EXHIBITION',
    title: 'ZONIX 品牌焕新 · 蓝色主视觉展位',
    summary: '以统一品牌视觉承接展会现场传播，让品牌定位、核心主张与产品信息在同一个空间内形成连贯表达。',
    image: 'assets/exhibition-blue.jpg',
    alt: 'ZONIX 蓝色主视觉展位效果图',
    columns: [
      ['项目背景', 'B2B 技术品牌需要同时面对行业客户、创作者与潜在合作方。展会现场不仅要被快速识别，更要在有限时间内讲清品牌价值。'],
      ['核心策略', '围绕「全球普适性」差异化定位，以品牌蓝建立空间主视觉，将「让 3D 打印走进每一家工厂」等信息前置，强化品牌记忆。'],
      ['执行落地', '协同研发、产品、销售及外部供应商，推进背景板、吊旗、画册与论坛内容，保持不同触点的信息调性与视觉标准一致。']
    ],
    resultLabel: '整体项目成果',
    result: '6 场展会累计沉淀 240+ 条有效合作线索'
  },
  white: {
    kicker: 'PROJECT 02 / OFFLINE EXHIBITION',
    title: 'ZONIX 白境展位 · 信息动线设计',
    summary: '把展位看作一份可被行走阅读的品牌内容，通过信息分层与观看节奏，让复杂技术从远观到近读都清晰可懂。',
    image: 'assets/exhibition-white.jpg',
    alt: 'ZONIX 白境信息型展位效果图',
    columns: [
      ['项目背景', '企业介绍、技术能力、行业应用与服务流程信息密度较高，需要在开放展位中建立清楚的主次关系，避免内容堆叠。'],
      ['核心策略', '遵循「我们是谁 — 我们有什么 — 我们能做什么」的认知逻辑，用品牌吊旗吸引远距注意，以应用墙和服务流程承接近距阅读。'],
      ['执行落地', '将技术原理转化为图解式展示，从客户需求倒推产品卖点；输出展板、导视与展示界面等视觉物料，并对接制作落地。']
    ],
    resultLabel: '整体项目价值',
    result: '统一线上线下视觉，建立行业展会中的品牌认知'
  }
};

const caseModal = document.querySelector('#case-modal');
const caseModalContent = document.querySelector('#case-modal-content');

document.querySelectorAll('[data-case]').forEach(button => {
  button.addEventListener('click', () => {
    const project = cases[button.dataset.case];
    caseModalContent.innerHTML = `
      <article class="modal-inner">
        <span class="modal-kicker">${project.kicker}</span>
        <h2 id="modal-title">${project.title}</h2>
        <p class="modal-summary">${project.summary}</p>
        <div class="modal-image"><img src="${project.image}" alt="${project.alt}"></div>
        <div class="modal-columns">
          ${project.columns.map(([title, copy]) => `<section><h3>${title}</h3><p>${copy}</p></section>`).join('')}
        </div>
        <div class="modal-result"><span>${project.resultLabel}</span><strong>${project.result}</strong></div>
      </article>`;
    caseModal.showModal();
    caseModal.scrollTop = 0;
  });
});

caseModal.querySelector('.dialog-close').addEventListener('click', () => caseModal.close());
caseModal.addEventListener('click', event => {
  if (event.target === caseModal) caseModal.close();
});
