/* ==========================================================================
   FitHero — Admin Portal Logic (Realtime Firestore & Analytics)
   ========================================================================== */

// Temp storage for image upload
window._tempAdminProductImage = '';
window.firestoreUsersList = [];

// === 1. Tab Navigation ===
window.switchAdminTab = function(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.admin-tab-pane').forEach(el => el.classList.add('hidden'));

    // Reset tab button styles
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btn.classList.add('bg-surface-container', 'text-on-surface-variant', 'hover:bg-surface-container-high');
    });

    // Show target tab pane
    const targetPane = document.getElementById(`admin-pane-${tabName}`);
    if (targetPane) {
        targetPane.classList.remove('hidden');
    }

    // Highlight target button
    const targetBtn = document.getElementById(`admin-tab-btn-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.remove('bg-surface-container', 'text-on-surface-variant', 'hover:bg-surface-container-high');
        targetBtn.classList.add('bg-primary', 'text-white', 'shadow-sm');
    }

    // Refresh data when switching tabs
    if (tabName === 'overview') renderAdminOverview();
    if (tabName === 'users') renderAdminUsersTable();
    if (tabName === 'missions') renderAdminMissions();
    if (tabName === 'rewards') renderAdminProducts();
    if (tabName === 'orders') renderAdminOrders();
};

// === 2. Overview / Analytics Tab ===
window.renderAdminOverview = function() {
    const userCount = window.firestoreUsersList && window.firestoreUsersList.length > 0 
        ? window.firestoreUsersList.length 
        : Object.keys(window.registeredUsers || {}).length;

    const orders = window.redemptionOrdersData || [];
    const orderCount = orders.length;

    let totalCoins = 0;
    if (window.firestoreUsersList && window.firestoreUsersList.length > 0) {
        totalCoins = window.firestoreUsersList.reduce((acc, u) => acc + (Number(u.coins) || 0), 0);
    } else {
        totalCoins = window.userCoins || 520;
    }

    // สรุปตัวเลข KPI
    const totalUsersEl = document.getElementById('admin-stat-users');
    if (totalUsersEl) totalUsersEl.innerText = userCount.toLocaleString();

    const totalOrdersEl = document.getElementById('admin-stat-orders');
    if (totalOrdersEl) totalOrdersEl.innerText = orderCount.toLocaleString();

    const totalCoinsEl = document.getElementById('admin-stat-coins');
    if (totalCoinsEl) totalCoinsEl.innerText = totalCoins.toLocaleString();

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    const pendingOrdersEl = document.getElementById('admin-stat-pending');
    if (pendingOrdersEl) pendingOrdersEl.innerText = pendingOrdersCount.toLocaleString();

    // รายการคำขอล่าสุด 3 รายการ
    const recentOrdersContainer = document.getElementById('admin-overview-recent-orders');
    if (recentOrdersContainer) {
        if (orders.length === 0) {
            recentOrdersContainer.innerHTML = '<p class="text-xs text-on-surface-variant py-4 text-center">ยังไม่มีรายการแลกของรางวัล</p>';
        } else {
            recentOrdersContainer.innerHTML = orders.slice(0, 3).map(o => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
                    <div class="flex items-center gap-3">
                        <img src="${o.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}" class="w-10 h-10 rounded-lg object-cover border" />
                        <div>
                            <p class="font-bold text-on-surface">${o.productName}</p>
                            <p class="text-[11px] text-on-surface-variant">${o.userEmail} • ${o.coinsSpent} 🪙</p>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${o.status === 'completed' ? 'จัดส่งแล้ว ✅' : 'รอดำเนินการ ⏳'}
                    </span>
                </div>
            `).join('');
        }
    }
};

// === 3. User Management Tab ===
window.renderAdminUsersTable = function(searchQuery = '') {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    const query = (searchQuery || '').toLowerCase().trim();

    // ดึงผู้ใช้จาก Cloud Firestore 100%
    const rawList = window.adminUsersList || window.firestoreUsersList || [];
    const usersList = rawList.map(u => ({
        uid: u.uid || u.id,
        email: u.email || 'no-email',
        name: u.name || (u.email ? u.email.split('@')[0] : 'Member'),
        role: u.role || 'user',
        coins: u.coins !== undefined ? u.coins : 0
    }));

    let rowsHtml = '';
    let count = 0;

    usersList.forEach(u => {
        const name = u.name;
        const email = u.email;
        const role = u.role;
        const coins = u.coins;
        const uid = u.uid;

        if (query && !email.toLowerCase().includes(query) && !name.toLowerCase().includes(query)) {
            return;
        }

        count++;
        const isCurrentAdmin = email === 'admin@fithero.com';

        rowsHtml += `
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
                <td class="p-3.5 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        ${name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-xs text-on-surface">${name}</p>
                        <p class="text-[11px] text-on-surface-variant">${email}</p>
                    </div>
                </td>
                <td class="p-3.5 text-xs">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-surface-container text-on-surface-variant'}">
                        ${role === 'admin' ? '👑 ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                    </span>
                </td>
                <td class="p-3.5 text-xs font-bold text-tertiary">
                    ${(coins || 0).toLocaleString()} 🪙
                </td>
                <td class="p-3.5 text-xs">
                    <div class="flex items-center gap-1.5">
                        <button onclick="adminAdjustCoins('${uid}', '${email}')" class="px-2 py-1 bg-tertiary/10 hover:bg-tertiary/20 text-tertiary rounded-md text-[11px] font-bold transition-all" title="ปรับเหรียญ">
                            + เหรียญ
                        </button>
                        ${!isCurrentAdmin ? `
                            <button onclick="adminDeleteUser('${uid}', '${email}')" class="p-1 hover:bg-error-container/30 text-error rounded-md text-[11px] transition-all" title="ลบบัญชี">
                                <span class="material-symbols-outlined text-base">delete</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-xs text-on-surface-variant">ไม่พบข้อมูลผู้ใช้ที่ค้นหา</td></tr>';
    } else {
        tbody.innerHTML = rowsHtml;
    }
};

window.adminSearchUsers = function(event) {
    renderAdminUsersTable(event.target.value);
};

window.adminAdjustCoins = async function(uid, email) {
    const input = prompt(`กรุณากรอกจำนวนเหรียญที่ต้องการเพิ่ม/ลบ สำหรับผู้ใช้ (${email})\nเช่น +100 หรือ -50:`, "100");
    if (input === null) return;
    const amount = parseInt(input);
    if (isNaN(amount)) {
        alert("กรุณากรอกตัวเลขที่ถูกต้อง");
        return;
    }

    // 1. อัปเดตลง Cloud Firestore
    if (typeof dbAdjustUserCoins === 'function') {
        const ok = await dbAdjustUserCoins(uid, amount);
        if (ok) {
            showSnackbar(`💰 ปรับเหรียญบน Cloud Firestore ให้ ${email} เรียบร้อยแล้ว (${amount > 0 ? '+' : ''}${amount} เหรียญ)`);
        }
    }

    // 2. ถ้าปรับผู้ใช้ปัจจุบัน ให้อัปเดต UI ทันที
    if (window.currentUser && (window.currentUser.uid === uid || window.currentUser.email === email)) {
        window.userCoins = Math.max(0, (window.userCoins || 0) + amount);
        updateStatsUI();
    }

    // 3. ปรับใน cached firestore users list
    const cachedList = window.adminUsersList || window.firestoreUsersList || [];
    const cachedUser = cachedList.find(u => (u.uid === uid || u.id === uid || u.email === email));
    if (cachedUser) {
        cachedUser.coins = Math.max(0, (cachedUser.coins || 0) + amount);
    }

    renderAdminUsersTable();
    renderAdminOverview();
};

window.adminDeleteUser = async function(uid, email) {
    if (email === 'admin@fithero.com') {
        alert("ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้");
        return;
    }
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ (${email}) จากฐานข้อมูล?`)) {
        if (typeof dbDeleteUserDoc === 'function') {
            await dbDeleteUserDoc(uid);
        }
        if (window.adminUsersList) {
            window.adminUsersList = window.adminUsersList.filter(u => (u.uid || u.id) !== uid && u.email !== email);
        }
        window.firestoreUsersList = window.adminUsersList;
        showSnackbar(`🗑️ ลบบัญชี ${email} ออกจากระบบ Cloud Firestore เรียบร้อยแล้ว`);
        renderAdminUsersTable();
        renderAdminOverview();
    }
};

// === 4. Missions Management Tab ===
window.renderAdminMissions = function() {
    const container = document.getElementById('admin-missions-list');
    if (!container) return;

    const missions = window.missionsDetailData || {};
    const keys = Object.keys(missions);

    if (keys.length === 0) {
        container.innerHTML = '<p class="text-xs text-on-surface-variant py-4 text-center">ไม่มีรายการภารกิจ</p>';
        return;
    }

    container.innerHTML = keys.map(k => {
        const m = missions[k];
        return `
            <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3">
                    <span class="text-3xl">${m.icon || '🎯'}</span>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-xs text-on-surface">${m.title}</h4>
                            <span class="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">${m.tag || 'ภารกิจ'}</span>
                        </div>
                        <p class="text-[11px] text-tertiary font-bold mt-0.5">${m.rewardText || `+${m.exp} EXP • +${m.coins} เหรียญ`}</p>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">เงื่อนไข: <code class="font-mono bg-surface px-1 rounded">${m.condition || '-'}</code></p>
                    </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-auto">
                    <button onclick="adminEditMission('${k}')" class="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-lg transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">edit</span>
                        <span>แก้ไข</span>
                    </button>
                    <button onclick="adminDeleteMission('${k}')" class="px-2 py-1.5 text-error hover:bg-error-container/20 rounded-lg transition-all" title="ลบภารกิจ">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

window.adminOpenAddMissionModal = function() {
    document.getElementById('admin-mission-form').reset();
    document.getElementById('admin-mission-edit-id').value = '';
    document.getElementById('admin-mission-modal-title').innerText = 'เพิ่มภารกิจใหม่';
    document.getElementById('admin-mission-modal').classList.remove('hidden');
};

window.adminEditMission = function(key) {
    const m = window.missionsDetailData[key];
    if (!m) return;

    document.getElementById('admin-mission-edit-id').value = key;
    document.getElementById('admin-mission-title-input').value = m.title;
    document.getElementById('admin-mission-tag-input').value = m.tag || '';
    document.getElementById('admin-mission-icon-input').value = m.icon || '🎯';
    document.getElementById('admin-mission-exp-input').value = m.exp || 50;
    document.getElementById('admin-mission-coins-input').value = m.coins || 20;
    document.getElementById('admin-mission-condition-input').value = m.condition || '';
    document.getElementById('admin-mission-target-input').value = m.targetVal || 10;
    document.getElementById('admin-mission-unit-input').value = m.unit || '';
    document.getElementById('admin-mission-tip-input').value = m.tip || '';

    document.getElementById('admin-mission-modal-title').innerText = 'แก้ไขภารกิจ';
    document.getElementById('admin-mission-modal').classList.remove('hidden');
};

window.adminCloseMissionModal = function() {
    document.getElementById('admin-mission-modal').classList.add('hidden');
};

window.adminSaveMission = async function(event) {
    event.preventDefault();
    const editId = document.getElementById('admin-mission-edit-id').value;
    const title = document.getElementById('admin-mission-title-input').value.trim();
    const tag = document.getElementById('admin-mission-tag-input').value.trim() || 'ภารกิจสุขภาพ';
    const icon = document.getElementById('admin-mission-icon-input').value.trim() || '🎯';
    const exp = parseInt(document.getElementById('admin-mission-exp-input').value) || 50;
    const coins = parseInt(document.getElementById('admin-mission-coins-input').value) || 20;
    const condition = document.getElementById('admin-mission-condition-input').value.trim();
    const targetVal = parseFloat(document.getElementById('admin-mission-target-input').value) || 1;
    const unit = document.getElementById('admin-mission-unit-input').value.trim();
    const tip = document.getElementById('admin-mission-tip-input').value.trim();

    const missionKey = editId || ('mission_' + Date.now());

    const missionPayload = {
        id: missionKey,
        title: title,
        tag: tag,
        icon: icon,
        exp: exp,
        coins: coins,
        rewardText: `+${exp} EXP • +${coins} เหรียญ`,
        condition: condition || 'กิจกรรมเพื่อสุขภาพ',
        detection: 'บันทึกอัตโนมัติจากระบบ',
        currentVal: window.missionsDetailData[missionKey]?.currentVal || 0,
        targetVal: targetVal,
        unit: unit,
        status: window.missionsDetailData[missionKey]?.status || 'pending',
        tip: tip || '💡 Tip: รักษาวินัยการออกกำลังกายสม่ำเสมอเพื่อสุขภาพที่ดี'
    };

    window.missionsDetailData[missionKey] = missionPayload;

    // บันทึกลง Firestore
    if (typeof dbSaveMission === 'function') {
        await dbSaveMission(missionPayload);
    }

    adminCloseMissionModal();
    renderAdminMissions();
    renderMissionsUI();
    showSnackbar('✅ บันทึกภารกิจและซิงค์สู่ Cloud Firestore เรียบร้อยแล้ว');
};

window.adminDeleteMission = async function(key) {
    if (confirm('คุณต้องการลบภารกิจนี้ใช่หรือไม่?')) {
        delete window.missionsDetailData[key];

        if (typeof dbDeleteMission === 'function') {
            await dbDeleteMission(key);
        }

        renderAdminMissions();
        renderMissionsUI();
        showSnackbar('🗑️ ลบภารกิจออกจาก Cloud Firestore เรียบร้อยแล้ว');
    }
};

// === 5. Rewards & Store Management Tab (With Image Upload) ===
window.renderAdminProducts = function() {
    const grid = document.getElementById('admin-products-grid');
    if (!grid) return;

    const products = window.storeProductsData || [];
    if (products.length === 0) {
        grid.innerHTML = '<p class="text-xs text-on-surface-variant py-4 col-span-full text-center">ไม่มีสินค้าของรางวัลในระบบ</p>';
        return;
    }

    grid.innerHTML = products.map((p, idx) => `
        <div class="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-xs flex flex-col justify-between group">
            <div class="relative h-36 bg-surface-container overflow-hidden">
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock > 0 ? 'bg-emerald-600 text-white' : 'bg-error text-white'}">
                    ${p.stock > 0 ? `สต็อก: ${p.stock}` : 'สินค้าหมด'}
                </span>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    ${p.tag}
                </span>
            </div>
            <div class="p-3.5 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-xs text-on-surface line-clamp-1">${p.name}</h4>
                    <p class="text-[11px] text-on-surface-variant line-clamp-2 mt-1">${p.description}</p>
                </div>
                <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                    <span class="text-xs font-bold text-tertiary">${p.price.toLocaleString()} 🪙</span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="adminEditProduct(${idx})" class="p-1.5 hover:bg-surface-container-high rounded-lg text-primary transition-all" title="แก้ไข">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onclick="adminDeleteProduct(${idx})" class="p-1.5 hover:bg-error-container/20 rounded-lg text-error transition-all" title="ลบ">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

window.adminOpenAddProductModal = function() {
    document.getElementById('admin-product-form').reset();
    document.getElementById('admin-product-edit-index').value = '-1';
    document.getElementById('admin-product-modal-title').innerText = 'เพิ่มของรางวัลใหม่';
    window._tempAdminProductImage = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';
    document.getElementById('admin-product-preview-img').src = window._tempAdminProductImage;
    document.getElementById('admin-product-modal').classList.remove('hidden');
};

window.adminEditProduct = function(index) {
    const p = window.storeProductsData[index];
    if (!p) return;

    document.getElementById('admin-product-edit-index').value = index;
    document.getElementById('admin-product-name-input').value = p.name;
    document.getElementById('admin-product-tag-input').value = p.tag;
    document.getElementById('admin-product-price-input').value = p.price;
    document.getElementById('admin-product-stock-input').value = p.stock;
    document.getElementById('admin-product-desc-input').value = p.description;
    document.getElementById('admin-product-url-input').value = p.image.startsWith('data:') ? '' : p.image;

    window._tempAdminProductImage = p.image;
    document.getElementById('admin-product-preview-img').src = p.image;

    document.getElementById('admin-product-modal-title').innerText = 'แก้ไขของรางวัล';
    document.getElementById('admin-product-modal').classList.remove('hidden');
};

window.adminCloseProductModal = function() {
    document.getElementById('admin-product-modal').classList.add('hidden');
};

// Image Upload Handler (จากไฟล์ในเครื่อง)
window.adminHandleImageFileSelect = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window._tempAdminProductImage = e.target.result;
            const preview = document.getElementById('admin-product-preview-img');
            if (preview) preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// Image URL Handler (จากลิงก์เว็บ)
window.adminHandleImageUrlInput = function(url) {
    if (url && url.trim()) {
        window._tempAdminProductImage = url.trim();
        const preview = document.getElementById('admin-product-preview-img');
        if (preview) preview.src = url.trim();
    }
};

window.adminSaveProduct = async function(event) {
    event.preventDefault();
    const index = parseInt(document.getElementById('admin-product-edit-index').value);
    const name = document.getElementById('admin-product-name-input').value.trim();
    const tag = document.getElementById('admin-product-tag-input').value.trim();
    const price = parseInt(document.getElementById('admin-product-price-input').value) || 500;
    const stock = parseInt(document.getElementById('admin-product-stock-input').value) || 0;
    const desc = document.getElementById('admin-product-desc-input').value.trim();
    const image = window._tempAdminProductImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';

    const productId = index >= 0 ? window.storeProductsData[index].id : ('prod_' + Date.now());
    const productPayload = {
        id: productId,
        name: name,
        tag: tag,
        price: price,
        stock: stock,
        description: desc,
        image: image
    };

    if (index >= 0) {
        window.storeProductsData[index] = productPayload;
    } else {
        window.storeProductsData.push(productPayload);
    }

    // บันทึกลง Firestore
    if (typeof dbSaveProduct === 'function') {
        await dbSaveProduct(productPayload);
    }

    adminCloseProductModal();
    renderAdminProducts();
    if (typeof renderStoreRewardsUI === 'function') renderStoreRewardsUI();
    showSnackbar('📸 บันทึกของรางวัลและรูปภาพลง Cloud Firestore เรียบร้อยแล้ว');
};

window.adminDeleteProduct = async function(index) {
    if (confirm('คุณต้องการลบของรางวัลชิ้นนี้ใช่หรือไม่?')) {
        const prod = window.storeProductsData[index];
        const productId = prod ? prod.id : null;

        window.storeProductsData.splice(index, 1);

        if (productId && typeof dbDeleteProduct === 'function') {
            await dbDeleteProduct(productId);
        }

        renderAdminProducts();
        if (typeof renderStoreRewardsUI === 'function') renderStoreRewardsUI();
        showSnackbar('🗑️ ลบของรางวัลออกจาก Cloud Firestore เรียบร้อยแล้ว');
    }
};

// === 6. Redemption Orders Management Tab ===
window.renderAdminOrders = function() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    const orders = window.redemptionOrdersData || [];
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-xs text-on-surface-variant">ไม่มีรายการคำขอแลกของรางวัล</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map((o, idx) => {
        const orderDate = new Date(o.date || o.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
                <td class="p-3 text-xs">
                    <span class="font-mono font-bold text-primary">${o.id}</span>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">${orderDate}</p>
                </td>
                <td class="p-3 text-xs">
                    <p class="font-bold text-on-surface">${o.userName || o.userEmail.split('@')[0]}</p>
                    <p class="text-[11px] text-on-surface-variant">${o.userEmail}</p>
                </td>
                <td class="p-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <img src="${o.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}" class="w-9 h-9 rounded-lg object-cover border" />
                        <div>
                            <p class="font-bold text-on-surface">${o.productName}</p>
                            <p class="text-[10px] text-on-surface-variant">${o.details || '1 ชิ้น'} • <span class="text-tertiary font-bold">${o.coinsSpent} 🪙</span></p>
                        </div>
                    </div>
                </td>
                <td class="p-3 text-xs">
                    <select onchange="adminUpdateOrderStatus('${o.id}', this.value, ${idx})" class="text-[11px] font-bold rounded-lg border border-outline-variant/40 p-1.5 ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ รอดำเนินการ</option>
                        <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>✅ จัดส่งเรียบร้อย</option>
                        <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ ยกเลิกรายการ</option>
                    </select>
                </td>
                <td class="p-3 text-xs">
                    <button onclick="adminDeleteOrder('${o.id}', ${idx})" class="p-1 hover:bg-error-container/20 text-error rounded-md transition-all" title="ลบรายการ">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

window.adminUpdateOrderStatus = async function(orderId, newStatus, orderIndex) {
    if (typeof dbUpdateOrderStatus === 'function') {
        await dbUpdateOrderStatus(orderId, newStatus);
    }

    if (window.redemptionOrdersData && window.redemptionOrdersData[orderIndex]) {
        window.redemptionOrdersData[orderIndex].status = newStatus;
    }

    showSnackbar(`📦 อัปเดตสถานะคำขอแลกเป็น "${newStatus === 'completed' ? 'จัดส่งเรียบร้อย' : (newStatus === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ')}" สำเร็จ`);
    renderAdminOrders();
    renderAdminOverview();
};

window.adminDeleteOrder = async function(orderId, orderIndex) {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
        if (typeof dbDeleteOrder === 'function') {
            await dbDeleteOrder(orderId);
        }

        if (window.redemptionOrdersData) {
            window.redemptionOrdersData = window.redemptionOrdersData.filter(o => o.id !== orderId);
        }

        renderAdminOrders();
        renderAdminOverview();
        showSnackbar('🗑️ ลบรายการแลกจาก Cloud Firestore เรียบร้อยแล้ว');
    }
};

