/* ==========================================================================
   FitHero — Dashboard: Stats, Level/EXP, BMR, TDEE, Data Sync
   ========================================================================== */

// ซิงค์ข้อมูลลง Cloud Firestore แบบ Debounce (Single Source of Truth)
window.syncDataToCloud = function() {
    if (typeof isFbInitialized !== 'undefined' && isFbInitialized && window.currentUserId) {
        clearTimeout(window.cloudSyncTimeout);
        window.cloudSyncTimeout = setTimeout(async () => {
            const payload = {
                coins: window.userCoins,
                totalAccumulatedEXP: window.totalAccumulatedEXP,
                name: window.userProfileData.name,
                age: window.userProfileData.age,
                gender: window.userProfileData.gender,
                height: window.userProfileData.height,
                weight: window.userProfileData.weight,
                targetTDEEGoal: window.targetTDEEGoal,
                missions: window.missionsDetailData
            };
            if (typeof dbSaveUserData === 'function') {
                await dbSaveUserData(window.currentUserId, payload);
            }
        }, 350);
    }
};

// นำข้อมูลจาก Firestore มาอัปเดตลง UI
window.applyUserDataToApp = function(data) {
    if (!data) return;
    if (data.role) {
        window.currentUserRole = data.role;
        const adminBtn = document.getElementById('profile-admin-btn');
        if (adminBtn) {
            if (data.role === 'admin') adminBtn.classList.remove('hidden');
            else adminBtn.classList.add('hidden');
        }
    }
    if (data.name) {
        userProfileData.name = data.name;
        document.querySelectorAll('.user-name-text').forEach(el => el.innerText = data.name);
    }
    if (data.age) {
        userProfileData.age = data.age;
        const viewAge = document.getElementById('profile-view-age');
        if (viewAge) viewAge.innerText = data.age;
    }
    if (data.gender) {
        userProfileData.gender = data.gender;
        const viewGender = document.getElementById('profile-view-gender');
        if (viewGender) viewGender.innerText = data.gender;
    }
    if (data.height) {
        userProfileData.height = data.height;
        const viewHeight = document.getElementById('profile-view-height');
        if (viewHeight) viewHeight.innerText = data.height;
    }
    if (data.weight) {
        userProfileData.weight = data.weight;
        const viewWeight = document.getElementById('profile-view-weight');
        if (viewWeight) viewWeight.innerText = data.weight;
    }
    if (data.coins !== undefined) {
        window.userCoins = Number(data.coins);
    }
    if (data.totalAccumulatedEXP !== undefined) {
        window.totalAccumulatedEXP = Number(data.totalAccumulatedEXP);
    }
    if (data.targetTDEEGoal !== undefined) {
        window.targetTDEEGoal = Number(data.targetTDEEGoal);
    }
    if (data.missions && typeof data.missions === 'object') {
        for (const k in data.missions) {
            if (missionsDetailData[k]) {
                Object.assign(missionsDetailData[k], data.missions[k]);
            }
        }
    }
    // รูปโปรไฟล์แยกเฉพาะบุคคล 100% (หากไม่มีรูปอัปโหลด จะใช้รูปตัวอักษรย่อเฉพาะบุคคลเสมอ ไม่ดึงรูปบัญชีอื่นมาแสดง)
    userProfileData.avatar = data.avatar || null;
    const resolvedAvatar = (typeof window.getUserAvatarUrl === 'function')
        ? window.getUserAvatarUrl(data.avatar, data.name || userProfileData.name)
        : (data.avatar || 'https://ui-avatars.com/api/?name=FitHero&background=4a7c59&color=ffffff&size=256&bold=true');
    document.querySelectorAll('.profile-avatar-img').forEach(img => {
        img.src = resolvedAvatar;
    });

    calculateAndUpdateBMI();
    renderMissionsUI();
    updateTDEEDisplay();
    updateStatsUI();
};

// เริ่มต้นสถานะหน้าจอ (ข้อมูลจริงจะถูกซิงค์ผ่าน Firestore Realtime Listener ทันทีที่เชื่อมต่อ)
window.loadLocalStorageData = function() {
    calculateAndUpdateBMI();
    updateTDEEDisplay();
    updateStatsUI();
};

// Level & EXP
window.getRequiredEXPForLevel = function(level) {
    return Math.floor(1000 * Math.pow(1.5, level - 1));
};

window.calculateLevelAndEXP = function(totalEXP) {
    let level = 1;
    let tempEXP = totalEXP;
    let reqEXP = getRequiredEXPForLevel(level);

    while (tempEXP >= reqEXP) {
        tempEXP -= reqEXP;
        level++;
        reqEXP = getRequiredEXPForLevel(level);
    }

    return {
        level: level,
        currentLevelEXP: tempEXP,
        nextLevelRequiredEXP: reqEXP,
        progressPercent: Math.min(100, Math.round((tempEXP / reqEXP) * 100))
    };
};

// อัปเดต UI สถิติทั้งหมด
window.updateStatsUI = function() {
    const coinText = userCoins.toLocaleString();

    const mainCoins = document.getElementById('user-coins');
    if (mainCoins) mainCoins.innerText = coinText;

    const missionsCoins = document.getElementById('missions-page-coins');
    if (missionsCoins) missionsCoins.innerText = coinText;

    const profileCoins = document.getElementById('profile-coins-val');
    if (profileCoins) profileCoins.innerText = `${coinText} เหรียญสะสม • ร้านค้าแลกของรางวัล`;

    const storeCoinsTop = document.getElementById('store-coins-top');
    if (storeCoinsTop) storeCoinsTop.innerText = coinText;

    const storeCoinsDisplay = document.getElementById('store-coins-display');
    if (storeCoinsDisplay) storeCoinsDisplay.innerText = `${coinText} 🪙`;

    const dashboardShopCoins = document.getElementById('dashboard-shop-coins');
    if (dashboardShopCoins) dashboardShopCoins.innerText = `${coinText} เหรียญ`;

    const progressPct = Math.min(100, Math.round((userCoins / 2500) * 100));
    const storeProgressText = document.getElementById('store-coins-progress-text');
    if (storeProgressText) storeProgressText.innerText = `${coinText} / 2,500 🪙 (${progressPct}%)`;

    const storeProgressBar = document.getElementById('store-coins-progress-bar');
    if (storeProgressBar) storeProgressBar.style.width = `${progressPct}%`;

    const levelData = calculateLevelAndEXP(totalAccumulatedEXP);

    const userLevelBadge = document.getElementById('user-level-badge');
    if (userLevelBadge) userLevelBadge.innerText = `Level ${levelData.level}`;

    const storeLevelBadge = document.getElementById('store-level-badge');
    if (storeLevelBadge) storeLevelBadge.innerText = `ระดับปัจจุบัน: Level ${levelData.level}`;

    const expText = document.getElementById('exp-text');
    if (expText) expText.innerText = `EXP: ${levelData.currentLevelEXP.toLocaleString()} / ${levelData.nextLevelRequiredEXP.toLocaleString()}`;

    const expPercent = document.getElementById('exp-percent');
    if (expPercent) expPercent.innerText = `${levelData.progressPercent}%`;

    const expBar = document.getElementById('exp-bar');
    if (expBar) expBar.style.width = `${levelData.progressPercent}%`;
};

// BMR mode switching
window.switchBMRMode = function(mode) {
    window.currentBMRMode = mode;
    const btnDaily = document.getElementById('bmr-btn-daily');
    const btnWeekly = document.getElementById('bmr-btn-weekly');
    const valDisplay = document.getElementById('bmr-val-display');
    const unitDisplay = document.getElementById('bmr-unit-display');
    const descDisplay = document.getElementById('bmr-desc-display');

    if (mode === 'daily') {
        if (btnDaily) btnDaily.className = "px-2.5 py-1 text-[11px] font-bold rounded-md bg-primary text-white shadow-xs transition-all";
        if (btnWeekly) btnWeekly.className = "px-2.5 py-1 text-[11px] font-bold rounded-md text-on-surface-variant hover:text-primary transition-all";
        if (valDisplay) valDisplay.childNodes[0].nodeValue = dailyBMR.toLocaleString() + " ";
        if (unitDisplay) unitDisplay.innerText = "kcal/วัน";
        if (descDisplay) descDisplay.innerText = "พลังงานที่ร่างกายต้องการพื้นฐานขณะพักผ่อนต่อวัน";
    } else if (mode === 'weekly') {
        if (btnWeekly) btnWeekly.className = "px-2.5 py-1 text-[11px] font-bold rounded-md bg-primary text-white shadow-xs transition-all";
        if (btnDaily) btnDaily.className = "px-2.5 py-1 text-[11px] font-bold rounded-md text-on-surface-variant hover:text-primary transition-all";
        const weeklyBMR = dailyBMR * 7;
        if (valDisplay) valDisplay.childNodes[0].nodeValue = weeklyBMR.toLocaleString() + " ";
        if (unitDisplay) unitDisplay.innerText = "kcal/สัปดาห์";
        if (descDisplay) descDisplay.innerText = "พลังงานเผาผลาญพื้นฐานรวมตลอด 7 วันในสัปดาห์นี้";
    }
};

// TDEE
window.openSetTDEEGoalModal = function() {
    document.getElementById('tdee-input-val').value = targetTDEEGoal;
    document.getElementById('set-tdee-modal').classList.remove('hidden');
};
window.closeSetTDEEGoalModal = function() {
    document.getElementById('set-tdee-modal').classList.add('hidden');
};
window.saveCustomTDEEGoal = function() {
    const inputVal = parseInt(document.getElementById('tdee-input-val').value);
    if (inputVal && inputVal >= 500 && inputVal <= 10000) {
        window.targetTDEEGoal = inputVal;
        updateTDEEDisplay();
        syncDataToCloud();
        closeSetTDEEGoalModal();
        showAlert(`⚡ บันทึกเป้าหมาย TDEE เป็น ${targetTDEEGoal.toLocaleString()} kcal/วัน เรียบร้อยแล้ว!`);
    } else {
        showAlert('กรุณากรอกค่าพลังงานที่ถูกต้อง (500 - 10,000 kcal)');
    }
};
window.openTDEEDetailModal = function() {
    updateTDEEDisplay();
    document.getElementById('tdee-detail-modal').classList.remove('hidden');
};
window.closeTDEEDetailModal = function() {
    document.getElementById('tdee-detail-modal').classList.add('hidden');
};
window.updateTDEEDisplay = function() {
    const formatted = targetTDEEGoal.toLocaleString();
    const elDashboard = document.getElementById('tdee-val-display');
    if (elDashboard) elDashboard.innerText = formatted;

    const elDetail = document.getElementById('detail-tdee-val');
    if (elDetail) elDetail.innerText = formatted;

    const proteinCal = targetTDEEGoal * 0.30;
    const carbCal = targetTDEEGoal * 0.45;
    const fatCal = targetTDEEGoal * 0.25;

    const proteinG = Math.round(proteinCal / 4);
    const carbG = Math.round(carbCal / 4);
    const fatG = Math.round(fatCal / 9);

    if (document.getElementById('macro-protein-g')) {
        document.getElementById('macro-protein-g').innerText = proteinG;
        document.getElementById('macro-protein-cal').innerText = `${Math.round(proteinCal)} kcal`;
        document.getElementById('macro-carb-g').innerText = carbG;
        document.getElementById('macro-carb-cal').innerText = `${Math.round(carbCal)} kcal`;
        document.getElementById('macro-fat-g').innerText = fatG;
        document.getElementById('macro-fat-cal').innerText = `${Math.round(fatCal)} kcal`;
    }
};
