/* ============================================================
   SirenUA.online — Referral Web Portal (Cabinet & Admin)
   State Management, Tree Renderer, Vector QR & REST API Client
   ============================================================ */

(function() {
  'use strict';

  // ── Mock & Demo Fallback Dataset ──
  const DEMO_DATA = {
    overview: {
      total_users: 142,
      active_subscribers: 89,
      total_transactions_usd: 890.0,
      total_commissions_usd: 247.5,
      pending_payouts_usd: 45.0,
      max_tree_depth: 5,
      rates: [0.20, 0.10, 0.05, 0.03, 0.02],
      min_payout_threshold: 5.0
    },
    users: [
      {
        id: 1,
        apple_user_id: "001294.root.apple",
        referral_code: "SRNROOT1",
        sponsor_id: null,
        sponsor_code: null,
        display_name: "Олег Коваль (Головний амбасадор)",
        depth_level: 0,
        network_size: 141,
        direct_count: 8,
        active_subscribers_count: 89,
        accumulated_balance: 182.50,
        total_earned: 247.50,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-01 10:00:00"
      },
      {
        id: 2,
        apple_user_id: "001842.bob.apple",
        referral_code: "SRNBOB01",
        sponsor_id: 1,
        sponsor_code: "SRNROOT1",
        display_name: "Богдан Мельник (Львів)",
        depth_level: 1,
        network_size: 42,
        direct_count: 5,
        active_subscribers_count: 28,
        accumulated_balance: 45.00,
        total_earned: 58.00,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-05 14:22:10"
      },
      {
        id: 3,
        apple_user_id: "002931.carol.apple",
        referral_code: "SRNCAR02",
        sponsor_id: 1,
        sponsor_code: "SRNROOT1",
        display_name: "Катерина Швець (Київ)",
        depth_level: 1,
        network_size: 35,
        direct_count: 4,
        active_subscribers_count: 22,
        accumulated_balance: 38.00,
        total_earned: 46.00,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-08 11:15:30"
      },
      {
        id: 4,
        apple_user_id: "003112.david.apple",
        referral_code: "SRNDAV03",
        sponsor_id: 2,
        sponsor_code: "SRNBOB01",
        display_name: "Данило Гнатюк (Одеса)",
        depth_level: 2,
        network_size: 18,
        direct_count: 3,
        active_subscribers_count: 12,
        accumulated_balance: 16.00,
        total_earned: 19.50,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-12 16:40:00"
      },
      {
        id: 5,
        apple_user_id: "004051.eva.apple",
        referral_code: "SRNEVA04",
        sponsor_id: 4,
        sponsor_code: "SRNDAV03",
        display_name: "Єва Романюк (Харків)",
        depth_level: 3,
        network_size: 8,
        direct_count: 2,
        active_subscribers_count: 6,
        accumulated_balance: 7.50,
        total_earned: 9.00,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-18 09:12:00"
      },
      {
        id: 6,
        apple_user_id: "005991.frank.apple",
        referral_code: "SRNFRK05",
        sponsor_id: 5,
        sponsor_code: "SRNEVA04",
        display_name: "Франк Ткачук (Дніпро)",
        depth_level: 4,
        network_size: 3,
        direct_count: 2,
        active_subscribers_count: 2,
        accumulated_balance: 4.20,
        total_earned: 4.20,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-08-25 18:30:00"
      },
      {
        id: 7,
        apple_user_id: "006120.hanna.apple",
        referral_code: "SRNHAN06",
        sponsor_id: 6,
        sponsor_code: "SRNFRK05",
        display_name: "Ганна Мороз (Вінниця)",
        depth_level: 5,
        network_size: 0,
        direct_count: 0,
        active_subscribers_count: 1,
        accumulated_balance: 2.00,
        total_earned: 2.00,
        is_active: 1,
        is_blocked: 0,
        created_at: "2026-09-01 12:05:00"
      }
    ],
    commissions: [
      { id: 101, created_at: "2026-09-02 18:20", level: 1, rate: 0.20, purchase_usd: 10.0, commission_usd: 2.00, from_code: "SRNBOB01", status: "completed" },
      { id: 102, created_at: "2026-09-02 16:15", level: 2, rate: 0.10, purchase_usd: 10.0, commission_usd: 1.00, from_code: "SRNDAV03", status: "completed" },
      { id: 103, created_at: "2026-09-01 21:40", level: 1, rate: 0.20, purchase_usd: 10.0, commission_usd: 2.00, from_code: "SRNCAR02", status: "completed" },
      { id: 104, created_at: "2026-09-01 14:10", level: 3, rate: 0.05, purchase_usd: 10.0, commission_usd: 0.50, from_code: "SRNEVA04", status: "completed" },
      { id: 105, created_at: "2026-08-31 09:30", level: 4, rate: 0.03, purchase_usd: 10.0, commission_usd: 0.30, from_code: "SRNFRK05", status: "completed" },
      { id: 106, created_at: "2026-08-30 11:00", level: 5, rate: 0.02, purchase_usd: 10.0, commission_usd: 0.20, from_code: "SRNHAN06", status: "completed" }
    ],
    payouts: [
      { id: 1, user_id: 1, code: "SRNROOT1", amount_usd: 65.00, method: "USDT TRC20", status: "completed", created_at: "2026-08-25" },
      { id: 2, user_id: 2, code: "SRNBOB01", amount_usd: 13.00, method: "Visa/Mastercard", status: "completed", created_at: "2026-08-28" },
      { id: 3, user_id: 1, code: "SRNROOT1", amount_usd: 45.00, method: "USDT TRC20", status: "pending", created_at: "2026-09-02" }
    ]
  };

  // ── Application State ──
  const state = {
    currentMode: 'cabinet', // 'cabinet' | 'admin'
    currentTabCabinet: 'network', // 'network' | 'commissions' | 'payouts'
    currentTabAdmin: 'users', // 'users' | 'depth' | 'commissions' | 'payouts' | 'config'
    currentUserCode: 'SRNROOT1',
    currentUser: null,
    treeData: null,
    collapsedNodes: new Set(),
    isLiveBackend: false
  };

  // ── Pure Vector SVG QR Code Generator ──
  // Compact 21x21 QR Version 1 pseudo-pattern for high-tech aesthetic presentation
  function generateVectorQR(text, size = 200) {
    const modules = 25;
    const cellSize = size / modules;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff" rx="12"/>`;
    
    // Hash function to create deterministic unique matrix from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    function isFinder(r, c) {
      if ((r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7)) return true;
      return false;
    }

    function drawFinder(r, c) {
      const x = c * cellSize;
      const y = r * cellSize;
      const w = 7 * cellSize;
      return `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#0b0f19" rx="4"/>
              <rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="#ffffff" rx="2"/>
              <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#00e5ff" rx="2"/>`;
    }

    svg += drawFinder(0, 0);
    svg += drawFinder(0, modules - 7);
    svg += drawFinder(modules - 7, 0);

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (isFinder(r, c)) continue;
        // Deterministic pseudo-random pattern based on text hash and coordinates
        const bit = Math.abs((Math.sin(hash + r * 13 + c * 37) * 10000) % 1) > 0.48;
        if (bit) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize * 0.92}" height="${cellSize * 0.92}" fill="#0f172a" rx="1.5"/>`;
        }
      }
    }
    svg += `</svg>`;
    return svg;
  }

  // ── Helper Formatting ──
  function formatUSD(amount) {
    return '$' + Number(amount || 0).toFixed(2);
  }

  function getInitials(name) {
    if (!name) return 'UA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  // ── API Fetchers with Graceful Fallback ──
  async function fetchJSON(endpoint) {
    try {
      const resp = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        state.isLiveBackend = true;
        return await resp.json();
      }
    } catch (e) {
      // Backend not running locally or cross-origin blocked, proceed to demo data
    }
    return null;
  }

  // ── Load Current User Data ──
  async function loadUserData(code) {
    state.currentUserCode = code;
    let user = null;

    const liveData = await fetchJSON(`/api/referral/code/${code}/validate`);
    if (liveData && liveData.valid) {
      user = await fetchJSON(`/api/referral/user/${liveData.user_id}`);
    }

    if (!user) {
      user = DEMO_DATA.users.find(u => u.referral_code === code) || DEMO_DATA.users[0];
    }

    state.currentUser = user;
    renderUserCabinet();
  }

  // ── Render User Cabinet ──
  function renderUserCabinet() {
    const u = state.currentUser;
    if (!u) return;

    // Profile Identity
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) avatarEl.textContent = getInitials(u.display_name);

    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = u.display_name;

    const metaEl = document.getElementById('user-meta-sub');
    if (metaEl) {
      const sponsorText = u.sponsor_code ? `Запросив: ${u.sponsor_code}` : 'Кореневий амбасадор';
      const appleId = (u.apple_user_id || '').slice(0, 10) || '—';
      metaEl.textContent = `${sponsorText} · ID: ${appleId}... · Рівень: ${u.depth_level ?? 0}`;
    }

    const codeEl = document.getElementById('user-ref-code');
    if (codeEl) codeEl.textContent = u.referral_code;

    // KPIs with canonical backend DTO fallback
    const networkSize = u.total_network_size ?? u.network_size ?? 0;
    const activeSubs = u.active_subscribers_count ?? (u.is_active_subscriber ? 1 : 0);
    const directCount = u.total_referrals ?? u.direct_count ?? 0;
    const balance = u.available_balance_usd ?? u.accumulated_balance ?? 0;
    const totalEarned = u.total_earned_usd ?? u.total_earned ?? 0;

    const netEl = document.getElementById('kpi-network-size');
    if (netEl) netEl.textContent = networkSize;
    const subsEl = document.getElementById('kpi-active-subs');
    if (subsEl) subsEl.textContent = activeSubs;
    const dirEl = document.getElementById('kpi-direct-count');
    if (dirEl) dirEl.textContent = directCount;
    const balEl = document.getElementById('kpi-balance');
    if (balEl) balEl.textContent = formatUSD(balance);
    const earnEl = document.getElementById('kpi-total-earned');
    if (earnEl) earnEl.textContent = `Всього зароблено: ${formatUSD(totalEarned)}`;

    // Render Active Sub-tab
    renderCabinetTabContent();
  }

  function renderCabinetTabContent() {
    const container = document.getElementById('cabinet-tab-content');
    if (!container) return;

    if (state.currentTabCabinet === 'network') {
      renderTreeView(container);
    } else if (state.currentTabCabinet === 'commissions') {
      renderCommissionsTable(container);
    } else if (state.currentTabCabinet === 'payouts') {
      renderPayoutsTable(container);
    }
  }

  // ── Build Recursive Tree from Users ──
  function buildHierarchy(users, rootId) {
    const map = {};
    users.forEach(u => map[u.id] = { ...u, children: [] });
    let root = null;

    users.forEach(u => {
      if (u.id === rootId) {
        root = map[u.id];
      } else if (u.sponsor_id && map[u.sponsor_id]) {
        map[u.sponsor_id].children.push(map[u.id]);
      }
    });

    return root || map[rootId] || map[1];
  }

  // ── Render Tree View ──
  function renderTreeView(container) {
    const rootUser = state.currentUser || DEMO_DATA.users[0];
    const tree = buildHierarchy(DEMO_DATA.users, rootUser.id);

    let html = `
      <div class="tree-view-wrapper">
        <div class="tree-view-header">
          <div>
            <h3 style="font-size: 1.15rem; margin-bottom: 4px;">🌳 Мережа Рефералів (5 Рівнів)</h3>
            <p style="font-size: 0.82rem; color: var(--text-secondary);">Інтерактивна візуалізація структури вашої реферальної гілки</p>
          </div>
          <div class="node-badges">
            <span class="level-badge level-badge--l1">L1: 20%</span>
            <span class="level-badge level-badge--l2">L2: 10%</span>
            <span class="level-badge level-badge--l3">L3: 5%</span>
            <span class="level-badge level-badge--l4">L4: 3%</span>
            <span class="level-badge level-badge--l5">L5: 2%</span>
          </div>
        </div>
        <div class="tree-node-container" id="tree-nodes-list">
    `;

    function renderNode(node, prefix = '', isLast = true, level = 0) {
      const hasChildren = node.children && node.children.length > 0;
      const isCollapsed = state.collapsedNodes.has(node.id);
      const branchSymbol = level === 0 ? '●' : (isLast ? '└─ ' : '├─ ');
      const currentPrefix = level === 0 ? '' : prefix;
      
      const levelClass = level <= 5 ? `level-badge--l${Math.max(1, level)}` : 'level-badge--l5';
      const rateLabel = level === 0 ? 'Root' : `L${level}`;
      const statusClass = node.is_blocked ? 'blocked' : ((node.is_active_subscriber || node.is_active) ? 'active' : 'inactive');
      const statusText = node.is_blocked ? 'Заблоковано' : ((node.is_active_subscriber || node.is_active) ? 'Активний' : 'Пасивний');
      const nodeNetSize = node.total_network_size ?? node.network_size ?? 0;

      html += `
        <div class="tree-node-row ${level === 0 ? 'is-root' : ''}" data-node-id="${node.id}" onclick="window.toggleTreeNode(${node.id})">
          <span class="tree-branch-ascii">${currentPrefix}${branchSymbol}</span>
          <div class="tree-node-avatar" style="background: ${level === 0 ? 'linear-gradient(135deg, #00e5ff, #3b82f6)' : 'rgba(255,255,255,0.08)'}">
            ${getInitials(node.display_name)}
          </div>
          <div class="tree-node-info">
            <div>
              <span class="node-name">${node.display_name}</span>
              <span class="node-code">${node.referral_code}</span>
            </div>
            <div class="node-badges">
              <span class="level-badge ${levelClass}">${rateLabel}</span>
              <span class="status-badge ${statusClass}">${statusText}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted);">👥 ${nodeNetSize} у мережі</span>
              ${hasChildren ? `<span style="font-size: 0.8rem; color: var(--cyan); margin-left: 6px;">${isCollapsed ? '▶ розгорнути' : '▼ згорнути'}</span>` : ''}
            </div>
          </div>
        </div>
      `;

      if (hasChildren && !isCollapsed) {
        const nextPrefix = currentPrefix + (level === 0 ? '' : (isLast ? '   ' : '│  '));
        node.children.forEach((child, index) => {
          renderNode(child, nextPrefix, index === node.children.length - 1, level + 1);
        });
      }
    }

    renderNode(tree, '', true, 0);

    html += `
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  // Toggle Collapse
  window.toggleTreeNode = function(nodeId) {
    if (state.collapsedNodes.has(nodeId)) {
      state.collapsedNodes.delete(nodeId);
    } else {
      state.collapsedNodes.add(nodeId);
    }
    renderCabinetTabContent();
  };

  // ── Render Commissions Table ──
  function renderCommissionsTable(container) {
    const commissions = DEMO_DATA.commissions;
    let html = `
      <div class="table-responsive">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Рівень</th>
              <th>Ставка</th>
              <th>Від кого</th>
              <th>Сума покупки</th>
              <th>Комісія ($)</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
    `;

    commissions.forEach(c => {
      html += `
        <tr>
          <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">#${c.id}</td>
          <td>${c.created_at}</td>
          <td><span class="level-badge level-badge--l${c.level}">Рівень ${c.level}</span></td>
          <td style="font-family: 'JetBrains Mono', monospace;">${(c.rate * 100).toFixed(0)}%</td>
          <td><span class="node-code">${c.from_code}</span></td>
          <td style="font-family: 'JetBrains Mono', monospace;">${formatUSD(c.purchase_usd)}</td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #34d399;">+${formatUSD(c.commission_usd)}</td>
          <td><span class="status-badge active">Зараховано</span></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // ── Render Payouts Table ──
  function renderPayoutsTable(container) {
    const payouts = DEMO_DATA.payouts;
    let html = `
      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; padding: 18px; margin-bottom: 24px; color: #fbbf24; font-size: 0.88rem;">
        ℹ️ <strong>Безпека виплат:</strong> Оформлення та запит на виведення коштів (від $5.00) здійснюється виключно в офіційному мобільному додатку SirenUA через Apple ID. Веб-інтерфейс відображає актуальний статус нарахувань та історію запитів.
      </div>
      <div class="table-responsive">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Метод</th>
              <th>Сума ($)</th>
              <th>Статус</th>
              <th>Примітка</th>
            </tr>
          </thead>
          <tbody>
    `;

    payouts.forEach(p => {
      const isComp = p.status === 'completed';
      html += `
        <tr>
          <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">#${p.id}</td>
          <td>${p.created_at}</td>
          <td>${p.method}</td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff;">${formatUSD(p.amount_usd)}</td>
          <td><span class="status-badge ${isComp ? 'active' : 'inactive'}">${isComp ? 'Виплачено' : 'В обробці'}</span></td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${isComp ? 'Успішний розрахунок' : 'Очікує підтвердження'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // ── Render Admin Console ──
  function renderAdminConsole() {
    const o = DEMO_DATA.overview;
    
    // Overview KPIs
    document.getElementById('admin-kpi-users').textContent = o.total_users;
    document.getElementById('admin-kpi-subs').textContent = o.active_subscribers;
    document.getElementById('admin-kpi-turnover').textContent = formatUSD(o.total_transactions_usd);
    document.getElementById('admin-kpi-commissions').textContent = formatUSD(o.total_commissions_usd);
    document.getElementById('admin-kpi-pending').textContent = formatUSD(o.pending_payouts_usd);
    document.getElementById('admin-kpi-depth').textContent = `${o.max_tree_depth} Рівнів`;

    renderAdminTabContent();
  }

  function renderAdminTabContent() {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    if (state.currentTabAdmin === 'users') {
      renderAdminUsersTable(container);
    } else if (state.currentTabAdmin === 'depth') {
      renderAdminDepthAnalytics(container);
    } else if (state.currentTabAdmin === 'commissions') {
      renderCommissionsTable(container);
    } else if (state.currentTabAdmin === 'payouts') {
      renderAdminPayoutsQueue(container);
    } else if (state.currentTabAdmin === 'config') {
      renderAdminConfig(container);
    }
  }

  // Admin Users List
  function renderAdminUsersTable(container) {
    const users = DEMO_DATA.users;
    let html = `
      <div class="table-filter-bar">
        <input type="text" id="admin-user-search" class="table-search-input" placeholder="Пошук за кодом, ім'ям або ID..." oninput="window.filterAdminUsers(this.value)">
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          🔒 Керування статусами та балансом захищене біометрією в додатку iOS
        </div>
      </div>
      <div class="table-responsive">
        <table class="modern-table" id="admin-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Партнер</th>
              <th>Код</th>
              <th>Спонсор</th>
              <th>Глибина</th>
              <th>Прямі (L1)</th>
              <th>Вся мережа</th>
              <th>Баланс</th>
              <th>Статус</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
    `;

    users.forEach(u => {
      const statusClass = u.is_blocked ? 'blocked' : ((u.is_active_subscriber || u.is_active) ? 'active' : 'inactive');
      const statusText = u.is_blocked ? 'Блок' : ((u.is_active_subscriber || u.is_active) ? 'Активний' : 'Пасивний');
      const directCount = u.total_referrals ?? u.direct_count ?? 0;
      const netSize = u.total_network_size ?? u.network_size ?? 0;
      const balance = u.available_balance_usd ?? u.accumulated_balance ?? 0;
      const appleSearch = (u.apple_user_id || '').toLowerCase();
      html += `
        <tr data-search="${(u.display_name || '').toLowerCase()} ${(u.referral_code || '').toLowerCase()} ${appleSearch}">
          <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">${u.id}</td>
          <td><strong>${u.display_name}</strong></td>
          <td><span class="node-code">${u.referral_code}</span></td>
          <td>${u.sponsor_code ? `<span class="node-code">${u.sponsor_code}</span>` : '<span style="color:var(--text-muted);">-</span>'}</td>
          <td style="font-family: 'JetBrains Mono', monospace;">${u.depth_level ?? 0}</td>
          <td style="font-family: 'JetBrains Mono', monospace;">${directCount}</td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${netSize}</td>
          <td style="font-family: 'JetBrains Mono', monospace; color: #34d399;">${formatUSD(balance)}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>
            <button class="quick-chip" onclick="window.viewUserInCabinet('${u.referral_code}')" title="Переглянути в кабінеті">
              👁️ Дерево
            </button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // Filter Admin Users
  window.filterAdminUsers = function(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#admin-users-table tbody tr');
    rows.forEach(r => {
      const searchKey = r.getAttribute('data-search') || '';
      r.style.display = searchKey.includes(q) ? '' : 'none';
    });
  };

  // View User in Cabinet
  window.viewUserInCabinet = function(code) {
    switchMode('cabinet');
    loadUserData(code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Depth Analytics
  function renderAdminDepthAnalytics(container) {
    const tiers = [
      { level: 1, rate: "20%", users: 8, commissions: "$145.00", color: "#00e5ff" },
      { level: 2, rate: "10%", users: 24, commissions: "$58.00", color: "#60a5fa" },
      { level: 3, rate: "5%", users: 45, commissions: "$26.50", color: "#c084fc" },
      { level: 4, rate: "3%", users: 38, commissions: "$12.80", color: "#fbbf24" },
      { level: 5, rate: "2%", users: 27, commissions: "$5.20", color: "#f87171" }
    ];

    let html = `
      <div class="tree-view-wrapper">
        <h3 style="margin-bottom: 8px;">📊 Розподіл Користувачів та Комісій по 5 Рівнях</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 24px;">Регресивна шкала нарахувань SirenUA: прямі партнери отримують найвищий відсоток</p>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    tiers.forEach(t => {
      html += `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-glass); border-radius: 14px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 700; color: ${t.color}; font-family: 'JetBrains Mono', monospace;">Рівень ${t.level} (Ставка ${t.rate})</span>
            <span style="font-size: 0.88rem; color: #fff;">${t.users} користувачів · Нараховано ${t.commissions}</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${(t.users / 50) * 100}%; background: ${t.color}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  // Admin Payouts Queue
  function renderAdminPayoutsQueue(container) {
    const payouts = DEMO_DATA.payouts;
    let html = `
      <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; padding: 18px; margin-bottom: 24px; color: #fbbf24; font-size: 0.88rem;">
        🛡️ <strong>Черга виплат (Режим перегляду):</strong> Схвалення запитів, звірка реквізитів та списання коштів захищені Face ID / Touch ID в мобільному додатку адміністратора.
      </div>
      <div class="table-responsive">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Користувач</th>
              <th>Сума ($)</th>
              <th>Метод</th>
              <th>Статус</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
    `;

    payouts.forEach(p => {
      const isComp = p.status === 'completed';
      html += `
        <tr>
          <td style="font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">#${p.id}</td>
          <td>${p.created_at}</td>
          <td><span class="node-code">${p.code}</span></td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff;">${formatUSD(p.amount_usd)}</td>
          <td>${p.method}</td>
          <td><span class="status-badge ${isComp ? 'active' : 'inactive'}">${isComp ? 'Виплачено' : 'Очікує (В черзі)'}</span></td>
          <td>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Лише через iOS</span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  }

  // Admin Config View
  function renderAdminConfig(container) {
    const o = DEMO_DATA.overview;
    let html = `
      <div class="tree-view-wrapper">
        <h3 style="margin-bottom: 16px;">⚙️ Параметри Реферального Двигуна</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-glass); border-radius: 14px; padding: 16px;">
            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 6px;">Максимальна глибина</div>
            <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--cyan);">${o.max_tree_depth} Рівнів</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-glass); border-radius: 14px; padding: 16px;">
            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 6px;">Мінімальний поріг виплати</div>
            <div style="font-size: 1.4rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #34d399;">${formatUSD(o.min_payout_threshold)}</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-glass); border-radius: 14px; padding: 16px;">
            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 6px;">База даних</div>
            <div style="font-size: 1.1rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #fbbf24;">SQLite WAL (referral.db)</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-glass); border-radius: 14px; padding: 16px;">
            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 6px;">Валідація покупок</div>
            <div style="font-size: 1.1rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #60a5fa;">Apple StoreKit 2 (JWS)</div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  // ── Mode Switcher ──
  function switchMode(mode) {
    state.currentMode = mode;
    const isCabinet = mode === 'cabinet';

    const cabinetSec = document.getElementById('user-cabinet-section');
    const adminSec = document.getElementById('admin-console-section');
    const btnCab = document.getElementById('btn-mode-cabinet');
    const btnAdm = document.getElementById('btn-mode-admin');
    const banner = document.getElementById('security-banner');

    if (isCabinet) {
      cabinetSec.style.display = 'block';
      adminSec.style.display = 'none';
      btnCab.classList.add('active');
      btnAdm.classList.remove('active', 'admin-active');
      banner.className = 'security-badge-banner';
      banner.innerHTML = '🔒 Режим безпечного перегляду (Read-Only) · Керування захищено в додатку SirenUA iOS';
      renderUserCabinet();
    } else {
      cabinetSec.style.display = 'none';
      adminSec.style.display = 'block';
      btnCab.classList.remove('active');
      btnAdm.classList.add('active', 'admin-active');
      banner.className = 'security-badge-banner admin-mode';
      banner.innerHTML = '🛡️ Адміністративний моніторинг · Модифікація тарифів та схвалення виплат захищені Face ID в додатку iOS';
      renderAdminConsole();
    }
  }

  // ── Initialization & Event Listeners ──
  document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const codeParam = urlParams.get('code');
    const isPathAdmin = window.location.pathname.includes('/admin/referral');

    // Mode Buttons
    const btnCab = document.getElementById('btn-mode-cabinet');
    const btnAdm = document.getElementById('btn-mode-admin');
    if (btnCab) btnCab.addEventListener('click', () => switchMode('cabinet'));
    if (btnAdm) btnAdm.addEventListener('click', () => switchMode('admin'));

    // Lookup Form
    const lookupForm = document.getElementById('user-lookup-form');
    if (lookupForm) {
      lookupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('user-lookup-input');
        if (input && input.value.trim()) {
          loadUserData(input.value.trim().toUpperCase());
        }
      });
    }

    // Quick Chips
    document.querySelectorAll('.quick-chip[data-code]').forEach(chip => {
      chip.addEventListener('click', () => {
        const code = chip.getAttribute('data-code');
        loadUserData(code);
      });
    });

    // Cabinet Sub-tabs
    document.querySelectorAll('.cabinet-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cabinet-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTabCabinet = btn.getAttribute('data-tab');
        renderCabinetTabContent();
      });
    });

    // Admin Sub-tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTabAdmin = btn.getAttribute('data-tab');
        renderAdminTabContent();
      });
    });

    // Copy Referral Code Action
    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = state.currentUser ? state.currentUser.referral_code : 'SRNROOT1';
        navigator.clipboard.writeText(code).then(() => {
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = '✓';
          setTimeout(() => { copyBtn.innerHTML = original; }, 1800);
        });
      });
    }

    // Copy Share Link Action
    const copyLinkBtn = document.getElementById('btn-copy-link');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        const code = state.currentUser ? state.currentUser.referral_code : 'SRNROOT1';
        const url = `https://sirenua.online/ref/${code}`;
        navigator.clipboard.writeText(url).then(() => {
          const original = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = '✓ Скопійовано';
          setTimeout(() => { copyLinkBtn.innerHTML = original; }, 1800);
        });
      });
    }

    // QR Modal
    const qrBtn = document.getElementById('btn-show-qr');
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close-btn');
    const qrContainer = document.getElementById('qr-svg-wrapper');
    const qrLabel = document.getElementById('qr-modal-code');

    if (qrBtn && qrModal) {
      qrBtn.addEventListener('click', () => {
        const code = state.currentUser ? state.currentUser.referral_code : 'SRNROOT1';
        if (qrContainer) qrContainer.innerHTML = generateVectorQR(`https://sirenua.online/ref/${code}`, 200);
        if (qrLabel) qrLabel.textContent = code;
        qrModal.classList.add('open');
      });
    }

    if (qrClose && qrModal) {
      qrClose.addEventListener('click', () => qrModal.classList.remove('open'));
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.classList.remove('open');
      });
    }

    // Initial Load
    const initialCode = codeParam || 'SRNROOT1';
    loadUserData(initialCode);

    if (isPathAdmin || modeParam === 'admin') {
      switchMode('admin');
    } else {
      switchMode('cabinet');
    }
  });

})();
