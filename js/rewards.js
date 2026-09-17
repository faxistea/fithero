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
                        <button onclick="redeemProductById('${p.id}', ${idx})" class="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-xs flex items-center gap-1">
                            <span>แลกรางวัล</span>
                            <span class="material-symbols-outlined text-sm">redeem</span>
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

// 3. ฟังก์ชันแลกของรางวัลแบบสมบูรณ์ เชื่อมต่อ Firestore
window.redeemProductById = async function(productId, index) {
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

    if (qty > product.stock) {
        showAlert(`❌ จำนวนในสต็อกไม่เพียงพอ (เหลือเพียง ${product.stock} ชิ้น)`);
        return;
    }

    if (confirm(`คุณต้องการใช้ ${totalCost.toLocaleString()} เหรียญ เพื่อแลกรับ "${product.name}" จำนวน ${qty} ชิ้น ใช่หรือไม่?`)) {
        const session = window.getSavedSession() || {};
        const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const orderPayload = {
            id: orderId,
            userId: window.currentUserId || session.uid || 'guest_user',
            userEmail: session.email || (window.currentUser ? window.currentUser.email : 'user@fithero.com'),
            userName: window.userProfileData.name || session.name || 'FitHero Member',
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            coinsSpent: totalCost,
            quantity: qty,
            details: `จำนวน ${qty} ชิ้น (${totalCost.toLocaleString()} เหรียญ)`,
            date: new Date().toISOString(),
            status: 'pending'
        };

        // ทำรายการผ่าน Cloud Firestore Atomic Transaction (Single Source of Truth)
        if (typeof dbRedeemProductTransaction === 'function' && window.currentUserId) {
            showAlert('⏳ กำลังประมวลผลคำขอแลกของรางวัลกับ Cloud Firestore...');
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

        updateStatsUI();
        renderStoreRewardsUI();

        if (typeof showSnackbar === 'function') {
            showSnackbar(`🎁 แลกรับ "${product.name}" (${qty} ชิ้น) สำเร็จ! ข้อมูลส่งถึงแอดมินเรียบร้อยแล้ว`);
        }
        showAlert(`🎉 แลกรับของรางวัลสำเร็จ! คุณทำการแลก "${product.name}" จำนวน ${qty} ชิ้น เรียบร้อยแล้ว ทีมงานจะจัดส่งของรางวัลให้ตามที่อยู่ของคุณ`);
    }
};

// Legacy Fallbacks
window.redeemReward = function(rewardName, cost) {
    const products = window.storeProductsData || [];
    const found = products.find(p => p.name.includes(rewardName) || rewardName.includes(p.name));
    if (found) {
        redeemProductById(found.id, products.indexOf(found));
    } else {
        redeemProductById('custom', 0);
    }
};

window.redeemRewardWithQty = function(rewardName, baseCost, index) {
    const products = window.storeProductsData || [];
    if (products[index]) {
        redeemProductById(products[index].id, index);
    } else {
        redeemProductById('custom', 0);
    }
};

window.loadSavedRewardImages = function() {
    renderStoreRewardsUI();
};

window.loadSavedTshirtDetails = function() {
    // Legacy stub to prevent ReferenceError
};

