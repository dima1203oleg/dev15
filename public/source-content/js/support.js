/* ============================================================
   SirenUA.online — Support Page JavaScript
   FAQ accordion, chat widget, form validation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initFAQAccordion();
  initFAQCategories();
  initChatWidget();
  initContactForm();
  initSearchFAQ();
});

/* ── FAQ Accordion ── */
function initFAQAccordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const content = item.querySelector('.accordion-content');
      const isActive = item.classList.contains('active');

      // Close all other items
      document.querySelectorAll('.accordion-item.active').forEach(activeItem => {
        if (activeItem !== item) {
          activeItem.classList.remove('active');
          const activeContent = activeItem.querySelector('.accordion-content');
          activeContent.style.maxHeight = '0';
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        content.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

/* ── FAQ Category Filter ── */
function initFAQCategories() {
  const categoryBtns = document.querySelectorAll('.faq-category-btn');
  const faqItems = document.querySelectorAll('.accordion-item[data-category]');

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;

      // Update active button
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter items
      faqItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.style.display = '';
          // Animate in
          item.style.opacity = '0';
          item.style.transform = 'translateY(10px)';
          requestAnimationFrame(() => {
            item.style.transition = 'opacity 0.3s, transform 0.3s';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          });
        } else {
          item.style.display = 'none';
          // Close if it was open
          item.classList.remove('active');
          const content = item.querySelector('.accordion-content');
          if (content) content.style.maxHeight = '0';
        }
      });
    });
  });
}

/* ── Search FAQ ── */
function initSearchFAQ() {
  const searchInput = document.getElementById('faq-search');
  if (!searchInput) return;

  const faqItems = document.querySelectorAll('.accordion-item');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    faqItems.forEach(item => {
      const question = item.querySelector('.accordion-trigger')?.textContent.toLowerCase() || '';
      const answer = item.querySelector('.accordion-content-inner')?.textContent.toLowerCase() || '';

      if (!query || question.includes(query) || answer.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // Reset category buttons
    if (query) {
      document.querySelectorAll('.faq-category-btn').forEach(btn => btn.classList.remove('active'));
    }
  });
}

/* ── Chat Widget ── */
function initChatWidget() {
  const toggle = document.querySelector('.chat-toggle');
  const window_ = document.querySelector('.chat-window');
  const closeBtn = document.querySelector('.chat-close');

  if (!toggle || !window_) return;

  toggle.addEventListener('click', () => {
    const isOpen = window_.classList.contains('open');
    if (isOpen) {
      window_.classList.remove('open');
    } else {
      window_.classList.add('open');
      // Show welcome message if first time
      const body = window_.querySelector('.chat-body');
      if (body && !body.querySelector('.chat-message')) {
        addBotMessage(body, 'Вітаємо! 👋 Як ми можемо вам допомогти? Опишіть вашу проблему або оберіть тему.');
      }
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window_.classList.remove('open');
    });
  }

  // Chat form submission
  const chatForm = document.getElementById('chat-support-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleChatSubmit(chatForm);
    });
  }
}

function handleChatSubmit(form) {
  const nameInput = form.querySelector('[name="chat-name"]');
  const emailInput = form.querySelector('[name="chat-email"]');
  const topicSelect = form.querySelector('[name="chat-topic"]');
  const messageInput = form.querySelector('[name="chat-message"]');

  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const topic = topicSelect?.value;
  const message = messageInput?.value.trim();

  if (!name || !email || !message) {
    showChatError('Будь ласка, заповніть всі обов\'язкові поля.');
    return;
  }

  if (!isValidEmail(email)) {
    showChatError('Будь ласка, введіть коректну email адресу.');
    return;
  }

  const body = document.querySelector('.chat-body');
  if (body) {
    addUserMessage(body, message);

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    // Simulate response
    setTimeout(() => {
      typing.remove();
      const response = getAutoResponse(topic, message);
      addBotMessage(body, response);
    }, 1500);
  }

  // Clear form
  if (messageInput) messageInput.value = '';
}

function addBotMessage(container, text) {
  const msg = document.createElement('div');
  msg.className = 'chat-message chat-message--bot';
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addUserMessage(container, text) {
  const msg = document.createElement('div');
  msg.className = 'chat-message chat-message--user';
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showChatError(text) {
  const body = document.querySelector('.chat-body');
  if (!body) return;

  const existing = body.querySelector('.chat-error');
  if (existing) existing.remove();

  const err = document.createElement('div');
  err.className = 'chat-message chat-message--bot chat-error';
  err.style.borderColor = 'rgba(239,68,68,0.3)';
  err.style.color = '#ef4444';
  err.textContent = text;
  body.appendChild(err);
  body.scrollTop = body.scrollHeight;

  setTimeout(() => err.remove(), 5000);
}

function getAutoResponse(topic, message) {
  const lowMsg = message.toLowerCase();

  if (lowMsg.includes('не працю') || lowMsg.includes('не приходять') || lowMsg.includes('звук')) {
    return 'Перевірте наступні параметри:\n1. Дозволи на сповіщення в системних Параметрах iOS → SirenUA\n2. Чи увімкнено опцію «Критичні сповіщення»\n3. Чи обрано вашу область або конкретний район у додатку\n\nЯкщо питання залишається — ми передамо звернення інженерам. Очікуйте відповіді на вказаний Email протягом 24 годин.';
  }

  if (lowMsg.includes('преміум') || lowMsg.includes('підписк') || lowMsg.includes('оплат') || lowMsg.includes('premium')) {
    return 'Щодо керування підпискою:\n• Скасувати підписку можна через Параметри iOS → Ваш обліковий запис Apple ID → Підписки\n• Для перенесення на новий iPhone натисніть «Відновити покупки» в налаштуваннях додатку\n• Базові тривоги та пошук укриттів завжди залишаються безкоштовними.';
  }

  if (lowMsg.includes('укриття') || lowMsg.includes('навігац') || lowMsg.includes('маршрут')) {
    return 'Для пошуку безпечного укриття:\n1. Натисніть вкладку «Укриття» (🛡️) у нижньому меню\n2. Додаток автоматично знайде найближчі перевірені сховища\n3. Натисніть на вибране укриття для запуску навігації\n\nПереконайтеся, що додатку надано дозвіл на доступ до геолокації під час використання.';
  }

  if (lowMsg.includes('батарея') || lowMsg.includes('акумулятор') || lowMsg.includes('заряд')) {
    return 'SirenUA спроєктовано для максимальної економії заряду. Основні обчислення та аналіз загроз виконуються на захищених серверах, тому додаток у фоновому режимі споживає менше 2–3% заряду акумулятора на добу.';
  }

  return `Дякуємо за звернення${topic ? ` щодо теми «${topic}»` : ''}! 📩\n\nВаше повідомлення зареєстровано у системі підтримки. Ми надішлемо детальну відповідь на вашу електронну адресу протягом 24 годин.`;
}

/* ── Contact Form (standalone) ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();

    if (!name || !email || !message) {
      alert('Будь ласка, заповніть всі обов\'язкові поля.');
      return;
    }

    if (!isValidEmail(email)) {
      alert('Будь ласка, введіть коректну email адресу.');
      return;
    }

    // Show success
    const successMsg = form.querySelector('.success-message') || form.parentElement.querySelector('.success-message');
    if (successMsg) {
      successMsg.classList.add('show');
      form.reset();
      setTimeout(() => successMsg.classList.remove('show'), 8000);
    }
  });
}

/* ── Email Validation ── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
