/* ==========================================================================
   FitHero — Rewards: Dynamic Render, Order Creation & Firestore Integration
   ========================================================================== */

// 1. Render สินค้าของรางวัลในหน้าร้านค้าแบบ Dynamic
window.renderStoreRewardsUI = function() {
    const container = document.getElementById('user-rewards-list');
    if (!container) return;

    const products = window.storeProductsData || [];
    if (products.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">storefront</span>
                <p class="font-bold">ยังไม่มีสินค้าของรางวัลในขณะนี้</p>
                <p class="text-[11px] mt-1">ผู้ดูแลระบบสามารถเพิ่มของรางวัลใหม่ได้ใน Admin Portal</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((p, idx) => {
        const isOutOfStock = p.stock <= 0;
        const maxQty = Math.min(5, Math.max(1, p.stock || 1));
        const hasQtySelector = p.id === 'gel' || (p.stock && p.stock > 1);

        let qtyOptions = '';
        for (let i = 1; i <= maxQty; i++) {
            qtyOptions += `<option value="${i}">${i} ชิ้น (${(p.price * i).toLocaleString()} 🪙)</option>`;
        }

        return `
            <div class="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4 hover:border-primary transition-all group">
                <div class="flex gap-4 items-center">
                    <div class="w-24 h-24 bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0 shadow-inner relative">
                        <img id="reward-img-${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                             src="${p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80'}" 
                             alt="${p.name}">
                        ${isOutOfStock ? `
                            <div class="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <span class="text-[10px] font-bold text-white bg-error px-2 py-0.5 rounded">สินค้าหมด</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="space-y-1 flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full line-clamp-1">${p.tag || 'FitHero Reward'}</span>
                            ${!isOutOfStock ? `
                                <span class="text-[10px] text-on-surface-variant/80 font-bold">สต็อก: ${p.stock}</span>
                            ` : ''}
                        </div>
                        <h4 class="font-bold text-sm sm:text-base text-on-surface line-clamp-1">${p.name}</h4>
                        <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2">${p.description || 'ของรางวัลพรีเมียมจาก FitHero'}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1 font-bold text-tertiary">
                            <span class="material-symbols-outlined text-base">monetization_on</span>
                            <span id="price-reward-${idx}">${p.price.toLocaleString()} เหรียญ</span>
                        </div>

                        ${!isOutOfStock && hasQtySelector ? `
                            <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg border border-outline-variant/30">
                                <span class="text-[11px] font-bold text-on-surface-variant">จำนวน:</span>
                                <select id="qty-reward-${idx}" onchange="updateRewardPrice(${idx}, ${p.price})" class="bg-transparent text-xs font-bold text-primary focus:ring-0 border-none cursor-pointer p-0">
                                    ${qtyOptions}
                                </select>
                            </div>
                        ` : ''}
                    </div>

                    ${isOutOfStock ? `
                        <button disabled class="px-4 py-2 bg-surface-container text-on-surface-variant/50 text-xs font-bold rounded-xl cursor-not-allowed">
                            สินค้าหมดชั่วคราว
                        </button>
                    ` : `
                        <button onclick="openRedemptionAddressModal('${p.id}', ${idx})" class="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-xs flex items-center gap-1">
                            <span>แลกรางวัล</span>
                            <span class="material-symbols-outlined text-sm">local_shipping</span>
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
};

// 2. อัปเดตราคาตามจำนวนชิ้นที่เลือก
window.updateRewardPrice = function(index, basePrice) {
    const qtySelect = document.getElementById(`qty-reward-${index}`);
    const priceEl = document.getElementById(`price-reward-${index}`);
    const qty = qtySelect ? parseInt(qtySelect.value) : 1;
    const totalPrice = basePrice * qty;
    if (priceEl) {
        priceEl.innerText = `${totalPrice.toLocaleString()} เหรียญ`;
    }
};

// ตัวแปรจัดเก็บข้อมูลชั่วคราวก่อนกดยืนยันแลกรางวัล
window._pendingRedeemItem = null;

// 3. เปิดหน้าต่างกรอกที่อยู่สำหรับจัดส่งของรางวัล
window.openRedemptionAddressModal = function(productId, index) {
    const products = window.storeProductsData || [];
    const product = products.find(p => p.id === productId) || products[index];

    if (!product) {
        showAlert('❌ ไม่พบข้อมูลของรางวัลที่เลือก');
        return;
    }

    if (product.stock <= 0) {
        showAlert('❌ ขออภัย สินค้านี้หมดสต็อกแล้ว');
        return;
    }

    const qtySelect = document.getElementById(`qty-reward-${index}`);
    const qty = qtySelect ? parseInt(qtySelect.value) : 1;
    const totalCost = product.price * qty;

    if (window.userCoins < totalCost) {
        showAlert(`❌ เหรียญสะสมไม่เพียงพอ! คุณต้องใช้ ${totalCost.toLocaleString()} เหรียญ แต่ปัจจุบันมี ${(window.userCoins || 0).toLocaleString()} เหรียญ (ขาดอีก ${(totalCost - (window.userCoins || 0)).toLocaleString()} เหรียญ)`);
        return;
    }

    window._pendingRedeemItem = {
        product: product,
        qty: qty,
        totalCost: totalCost,
        index: index
    };

    // ใส่ข้อมูลลงใน Modal
    document.getElementById('redeem-modal-product-name').innerText = product.name;
    document.getElementById('redeem-modal-product-img').src = product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80';
    document.getElementById('redeem-modal-qty-text').innerText = `จำนวน ${qty} ชิ้น`;
    document.getElementById('redeem-modal-cost-text').innerText = `${totalCost.toLocaleString()} เหรียญ`;
    document.getElementById('redeem-modal-coins-balance').innerText = `คงเหลือหลังจากแลก: ${(window.userCoins - totalCost).toLocaleString()} เหรียญ`;

    // ดึงข้อมูลเดิมจากโปรไฟล์มาแสดงล่วงหน้า
    const session = window.getSavedSession() || {};
    const defaultName = window.userProfileData.name || session.name || (window.currentUser ? window.currentUser.displayName : '');
    const defaultPhone = window.userProfileData.phone || '';
    const defaultAddress = window.userProfileData.address || '';

    const nameInput = document.getElementById('redeem-shipping-name');
    const phoneInput = document.getElementById('redeem-shipping-phone');
    const addressInput = document.getElementById('redeem-shipping-address');

    if (nameInput) nameInput.value = defaultName;
    if (phoneInput) phoneInput.value = defaultPhone;
    if (addressInput) addressInput.value = defaultAddress;

    const modal = document.getElementById('redeem-address-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeRedemptionAddressModal = function() {
    const modal = document.getElementById('redeem-address-modal');
    if (modal) modal.classList.add('hidden');
    window._pendingRedeemItem = null;
};

// 4. ยืนยันการแลกของรางวัลพร้อมข้อมูลที่อยู่จัดส่ง
window.submitRedemptionWithAddress = async function(event) {
    if (event) event.preventDefault();

    if (!window._pendingRedeemItem) {
        showAlert('❌ เกิดข้อผิดพลาด ไม่พบข้อมูลสินค้าที่กำลังทำรายการ');
        return;
    }

    const { product, qty, totalCost } = window._pendingRedeemItem;

    const receiverName = document.getElementById('redeem-shipping-name').value.trim();
    const receiverPhone = document.getElementById('redeem-shipping-phone').value.trim();
    const receiverAddress = document.getElementById('redeem-shipping-address').value.trim();
    const saveToProfile = document.getElementById('redeem-save-address-chk')?.checked;

    if (!receiverName) {
        showAlert('❌ กรุณาระบุชื่อ-นามสกุลของผู้รับพัสดุ');
        return;
    }

    if (!receiverPhone || receiverPhone.length < 9) {
        showAlert('❌ กรุณาระบุเบอร์โทรศัพท์ติดต่อที่ถูกต้องสำหรับเจ้าหน้าที่จัดส่ง');
        return;
    }

    if (!receiverAddress || receiverAddress.length < 10) {
        showAlert('❌ กรุณาระบุที่อยู่จัดส่งให้ชัดเจน (บ้านเลขที่, ถนน/ซอย, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์)');
        return;
    }

    // บันทึกที่อยู่ลงโปรไฟล์ผู้ใช้หากเลือกตัวเลือกไว้
    if (saveToProfile) {
        window.userProfileData.phone = receiverPhone;
        window.userProfileData.address = receiverAddress;
        if (typeof window.syncDataToCloud === 'function') {
            window.syncDataToCloud();
        }
    }

    const session = window.getSavedSession() || {};
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const orderPayload = {
        id: orderId,
        userId: window.currentUserId || session.uid || 'guest_user',
        userEmail: session.email || (window.currentUser ? window.currentUser.email : 'user@fithero.com'),
        userName: window.userProfileData.name || session.name || receiverName,
        receiverName: receiverName,
        phone: receiverPhone,
        address: receiverAddress,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        coinsSpent: totalCost,
        quantity: qty,
        details: `จำนวน ${qty} ชิ้น (${totalCost.toLocaleString()} เหรียญ)`,
        date: new Date().toISOString(),
        status: 'pending',
        trackingNo: '',
        courier: ''
    };

    closeRedemptionAddressModal();
    showAlert('⏳ กำลังบันทึกคำสั่งแลกของรางวัลและที่อยู่จัดส่ง...');

    if (typeof dbRedeemProductTransaction === 'function' && window.currentUserId) {
        const txRes = await dbRedeemProductTransaction(window.currentUserId, product.id, qty, totalCost, orderPayload);
        if (!txRes.success) {
            showAlert(`❌ การแลกของรางวัลล้มเหลว: ${txRes.message}`);
            return;
        }
        window.userCoins = txRes.newCoins;
        product.stock = txRes.newStock;
    } else {
        window.userCoins -= totalCost;
        product.stock = Math.max(0, product.stock - qty);
        if (typeof dbCreateOrder === 'function') await dbCreateOrder(orderPayload);
        if (typeof dbSaveProduct === 'function') await dbSaveProduct(product);
        syncDataToCloud();
    }

    if (!window.userPersonalOrders) window.userPersonalOrders = [];
    window.userPersonalOrders.unshift(orderPayload);

    updateStatsUI();
    renderStoreRewardsUI();

    if (typeof showSnackbar === 'function') {
        showSnackbar(`🎁 แลกรับ "${product.name}" สำเร็จ! ที่อยู่จัดส่งบันทึกเรียบร้อย`);
    }

    showAlert(`🎉 แลกรับของรางวัลสำเร็จ! คำสั่งแลก #${orderId} บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว คุณสามารถคลิกปุ่ม "📦 ประวัติการแลก & ติดตามพัสดุ" เพื่อตรวจสอบสถานะและเลขพัสดุได้ตลอดเวลา`);
};

// 5. เปิดหน้าต่างประวัติการแลกของรางวัล & สถานะการจัดส่ง (สำหรับสมาชิก)
window.openUserOrdersModal = function() {
    const modal = document.getElementById('user-orders-modal');
    if (!modal) return;

    renderUserOrdersList();
    modal.classList.remove('hidden');
};

window.closeUserOrdersModal = function() {
    const modal = document.getElementById('user-orders-modal');
    if (modal) modal.classList.add('hidden');
};

window.renderUserOrdersList = function() {
    const container = document.getElementById('user-orders-list-container');
    if (!container) return;

    // รวบรวม orders ของ user ปัจจุบัน
    const uid = window.currentUserId;
    const session = window.getSavedSession() || {};
    const email = session.email || (window.currentUser ? window.currentUser.email : '');

    let orders = window.userPersonalOrders || [];
    if (window.redemptionOrdersData && window.redemptionOrdersData.length > 0) {
        const matching = window.redemptionOrdersData.filter(o => 
            (uid && o.userId === uid) || (email && o.userEmail === email)
        );
        if (matching.length > 0) {
            orders = matching;
        }
    }

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-2">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant/40">local_shipping</span>
                <p class="font-bold text-sm text-on-surface">ยังไม่มีประวัติการแลกของรางวัล</p>
                <p class="text-[11px]">เมื่อคุณสะสมเหรียญและแลกของรางวัล รายการจัดส่งและเลขพัสดุจะแสดงที่นี่</p>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(o => {
        const orderDate = new Date(o.date || o.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let statusBadge = '';
        if (o.status === 'completed' || o.status === 'delivered') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">✅ จัดส่งสำเร็จ</span>`;
        } else if (o.status === 'shipped') {
            statusBadge = `<span class="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold">🚚 กำลังจัดส่ง</span>`;
        } else if (o.status === 'processing') {
            statusBadge = `<span class="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold">📦 กำลังเตรียมพัสดุ</span>`;
        } else if (o.status === 'cancelled') {
            statusBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">❌ ยกเลิกรายการ</span>`;
        } else {
            statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">⏳ รอดำเนินการ</span>`;
        }

        return `
            <div class="p-4 rounded-2xl bg-white border border-outline-variant/30 space-y-3 shadow-xs">
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                    <div>
                        <span class="font-mono text-xs font-bold text-primary">#${o.id}</span>
                        <p class="text-[10px] text-on-surface-variant">${orderDate}</p>
                    </div>
                    <div>${statusBadge}</div>
                </div>

                <div class="flex gap-3.5 items-center">
                    <img src="${o.productImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}" class="w-14 h-14 rounded-xl object-cover border flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs sm:text-sm text-on-surface line-clamp-1">${o.productName}</h4>
                        <p class="text-[11px] text-on-surface-variant">${o.details || 'จำนวน 1 ชิ้น'} • <span class="text-tertiary font-bold">${o.coinsSpent} 🪙</span></p>
                    </div>
                </div>

                <div class="p-3 bg-surface-container-low rounded-xl text-xs space-y-1 border border-outline-variant/20">
                    <p class="font-bold text-on-surface flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm text-primary">pin_drop</span>
                        <span>ข้อมูลการจัดส่ง:</span>
                    </p>
                    <p class="text-[11px] text-on-surface"><span class="font-semibold">ผู้รับ:</span> ${o.receiverName || o.userName || 'สมาชิก FitHero'} (โทร: ${o.phone || 'ไม่ระบุ'})</p>
                    <p class="text-[11px] text-on-surface-variant leading-relaxed"><span class="font-semibold">ที่อยู่:</span> ${o.address || 'จัดส่งตามที่อยู่โปรไฟล์'}</p>
                    ${o.trackingNo ? `
                        <div class="mt-2 pt-2 border-t border-outline-variant/30 flex items-center justify-between bg-primary/5 p-2 rounded-lg">
                            <div class="text-[11px]">
                                <span class="font-bold text-primary">เลขพัสดุ (${o.courier || 'Flash/Kerry'}):</span>
                                <span class="font-mono font-bold text-on-surface ml-1 select-all">${o.trackingNo}</span>
                            </div>
                            <button onclick="navigator.clipboard.writeText('${o.trackingNo}'); showSnackbar('📋 คัดลอกเลขพัสดุเรียบร้อย')" class="px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary/90">คัดลอก</button>
                        </div>
                    ` : `
                        <p class="text-[10px] text-on-surface-variant italic mt-1">📦 เจ้าหน้าที่กำลังจัดเตรียมพัสดุ เลข Tracking จะแสดงที่นี่เมื่อจัดส่งแล้ว</p>
                    `}
                </div>
            </div>
        `;
    }).join('');
};

// Legacy Fallbacks
window.redeemReward = function(rewardName, cost) {
    const products = window.storeProductsData || [];
    const found = products.find(p => p.name.includes(rewardName) || rewardName.includes(p.name));
    if (found) {
        openRedemptionAddressModal(found.id, products.indexOf(found));
    } else {
        openRedemptionAddressModal('custom', 0);
    }
};

window.redeemRewardWithQty = function(rewardName, baseCost, index) {
    const products = window.storeProductsData || [];
    if (products[index]) {
        openRedemptionAddressModal(products[index].id, index);
    } else {
        openRedemptionAddressModal('custom', 0);
    }
};

window.loadSavedRewardImages = function() {
    renderStoreRewardsUI();
};

window.loadSavedTshirtDetails = function() {
    // Legacy stub to prevent ReferenceError
};


