/* ==========================================================================
   FitHero — Missions: Render, Detail, Claim, Reset, Filter (Dynamic Version)
   ========================================================================== */

window.currentMissionCategory = 'all';

window.renderMissionsUI = function() {
    const container = document.getElementById('missions-list');
    if (!container) return;

    const missions = window.missionsDetailData || {};
    const keys = Object.keys(missions);

    if (keys.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">assignment_late</span>
                <p class="font-bold">ยังไม่มีรายการภารกิจในระบบ</p>
                <p class="text-[11px] mt-1">ผู้ดูแลระบบสามารถเพิ่มภารกิจใหม่ได้ใน Admin Portal</p>
            </div>
        `;
        return;
    }

    let cardsHtml = '';

    keys.forEach(k => {
        const m = missions[k];
        const category = m.category || (m.tag?.includes('โภชนาการ') ? 'nutrition' : (m.tag?.includes('จิตใจ') ? 'mind' : 'workout'));

        // คำนวณความคืบหน้า
        let progressPct = 0;
        let progressText = '';

        if (typeof m.targetVal === 'number' && m.targetVal > 0) {
            const current = typeof m.currentVal === 'number' ? m.currentVal : 0;
            progressPct = Math.min(100, Math.round((current / m.targetVal) * 100));
            progressText = `${current.toLocaleString()} / ${m.targetVal.toLocaleString()} ${m.unit || ''}`.trim();
        } else {
            progressPct = m.status === 'completed' || m.status === 'claimed' ? 100 : 0;
            progressText = m.status === 'completed' || m.status === 'claimed' ? 'เงื่อนไขสำเร็จแล้ว' : 'ยังไม่ได้ทำเงื่อนไข';
        }

        // Action Button HTML
        let btnHtml = '';
        if (m.status === 'claimed') {
            btnHtml = `<button onclick="event.stopPropagation(); resetMission('${k}')" class="px-3.5 py-2 bg-surface-container-high hover:bg-tertiary/10 text-tertiary text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-2xs">ทำอีกครั้ง 🔄</button>`;
        } else if (m.status === 'completed') {
            btnHtml = `<button onclick="event.stopPropagation(); claimMissionById('${k}', ${m.exp || 50}, ${m.coins || 20})" class="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md animate-bounce">รับเหรียญ 🪙</button>`;
        } else {
            // ปุ่มตามประเภทภารกิจ
            if (k === 'run20k') {
                btnHtml = `<button onclick="event.stopPropagation(); openRunTrackerModal()" class="px-3.5 py-2 bg-tertiary text-white text-xs font-bold rounded-xl hover:bg-tertiary/90 transition-all flex items-center gap-1 shadow-xs">เปิดแอปนับระยะทางวิ่ง 🏃</button>`;
            } else if (k === 'step') {
                btnHtml = `<button onclick="event.stopPropagation(); openStepCounterModal()" class="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs">เปิดระบบนับก้าว 🚶</button>`;
            } else if (k === 'water') {
                btnHtml = `<button onclick="event.stopPropagation(); addWaterFromMission(0.25)" class="px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xs flex items-center gap-1">+ ดื่มน้ำ 250 ml</button>`;
            } else if (k === 'meditation') {
                btnHtml = `<button onclick="event.stopPropagation(); startMeditationTimer()" class="px-3.5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 active:scale-95 transition-all shadow-xs">เริ่มทำสมาธิ 5 นาที</button>`;
            } else if (k === 'sleep') {
                btnHtml = `<button onclick="event.stopPropagation(); openSleepAlarmModal()" class="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-xs flex items-center gap-1">ตั้งเวลานอน ⏰</button>`;
            } else {
                btnHtml = `<button onclick="event.stopPropagation(); quickCompleteCustomMission('${k}')" class="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-xs flex items-center gap-1">บันทึกกิจกรรม ✨</button>`;
            }
        }

        // ซ่อนหากไม่ตรงหมวดหมู่ที่เลือก
        const isHidden = window.currentMissionCategory !== 'all' && window.currentMissionCategory !== category ? 'hidden' : '';

        cardsHtml += `
            <div class="mission-card ${category} ${isHidden} bg-white p-5 rounded-2xl shadow-xs border border-outline-variant/30 space-y-3.5 hover:border-primary transition-all cursor-pointer" onclick="openMissionDetail('${k}')">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 text-2xl bg-surface-container">
                            ${m.icon || '🎯'}
                        </div>
                        <div>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">${m.tag || 'ภารกิจสุขภาพ'}</span>
                            <h4 class="font-bold text-sm text-on-surface mt-0.5 line-clamp-1">${m.title}</h4>
                            <p class="text-[11px] font-semibold text-primary mt-0.5">${m.rewardText || `+${m.exp || 50} EXP • +${m.coins || 20} เหรียญ`}</p>
                        </div>
                    </div>
                    <div id="btn-container-${k}" onclick="event.stopPropagation()">
                        ${btnHtml}
                    </div>
                </div>
                <div class="space-y-1 pt-1 border-t border-outline-variant/20">
                    <div class="flex justify-between text-xs font-semibold text-on-surface-variant">
                        <span>ความคืบหน้า</span>
                        <span id="card-${k}-progress-text">${progressText}</span>
                    </div>
                    <div class="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                        <div id="card-${k}-progress-bar" class="bg-primary h-full rounded-full transition-all duration-500" style="width: ${progressPct}%;"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;

    // อัปเดต Dashboard Water Bar หากมี mission water
    const mWater = missions['water'];
    if (mWater) {
        const waterPct = Math.min(100, Math.round(((mWater.currentVal || 0) / (mWater.targetVal || 2)) * 100));
        const dashWaterBar = document.getElementById('dashboard-water-bar');
        if (dashWaterBar) dashWaterBar.style.width = `${waterPct}%`;
        const dashWaterText = document.getElementById('dashboard-water-text');
        if (dashWaterText) dashWaterText.innerText = `${(mWater.currentVal || 0).toFixed(1)}L / 2L`;
    }
};

window.quickCompleteCustomMission = function(missionKey) {
    const m = window.missionsDetailData[missionKey];
    if (!m) return;

    if (typeof m.targetVal === 'number' && m.targetVal > 0) {
        m.currentVal = (m.currentVal || 0) + 1;
        if (m.currentVal >= m.targetVal) {
            m.status = 'completed';
            showAlert(`🎉 ทำภารกิจ "${m.title}" ครบแล้ว! กดรับเหรียญรางวัลได้เลย`);
        } else {
            showAlert(`บันทึกกิจกรรมเพิ่ม 1 ครั้ง (${m.currentVal}/${m.targetVal})`);
        }
    } else {
        m.status = 'completed';
        showAlert(`🎉 ทำภารกิจ "${m.title}" สำเร็จแล้ว! กดรับเหรียญรางวัลได้เลย`);
    }

    renderMissionsUI();
    syncDataToCloud();
};

window.resetMission = function(missionKey) {
    const data = window.missionsDetailData[missionKey];
    if (!data) return;

    data.status = 'pending';
    if (missionKey === 'run20k') data.currentVal = 0.0;
    else if (missionKey === 'step') data.currentVal = 0;
    else if (missionKey === 'water') data.currentVal = 0.0;
    else if (missionKey === 'meditation') data.currentVal = 0;
    else if (missionKey === 'sleep') data.currentVal = null;
    else data.currentVal = 0;

    renderMissionsUI();
    syncDataToCloud();
    showAlert(`🔄 รีเซ็ตภารกิจ "${data.title}" เรียบร้อยแล้ว สามารถเริ่มทำกิจกรรมเพื่อสะสมเหรียญใหม่ได้เลย!`);
};

window.openMissionDetail = function(missionKey) {
    const data = window.missionsDetailData[missionKey];
    if (!data) return;

    document.getElementById('modal-mission-icon').innerText = data.icon || '🎯';
    document.getElementById('modal-mission-title').innerText = data.title;
    document.getElementById('modal-mission-tag').innerText = data.tag || 'ภารกิจสุขภาพ';
    document.getElementById('modal-mission-reward-text').innerText = data.rewardText || `+${data.exp} EXP • +${data.coins} เหรียญ`;
    document.getElementById('modal-mission-condition').innerText = data.condition || 'กิจกรรมเพื่อสุขภาพ';
    document.getElementById('modal-mission-detection').innerText = data.detection || 'บันทึกอัตโนมัติจากเซ็นเซอร์หรือระบบ';

    let progressText = '';
    let progressPct = 0;
    if (typeof data.targetVal === 'number' && data.targetVal > 0) {
        const cur = typeof data.currentVal === 'number' ? data.currentVal : 0;
        progressText = `${cur} / ${data.targetVal} ${data.unit || ''}`.trim();
        progressPct = Math.min(100, Math.round((cur / data.targetVal) * 100));
    } else {
        progressText = data.status === 'pending' ? 'ยังไม่ได้ทำเงื่อนไข' : 'ทำเงื่อนไขสำเร็จแล้ว';
        progressPct = data.status === 'pending' ? 0 : 100;
    }

    document.getElementById('modal-mission-progress-text').innerText = progressText;
    document.getElementById('modal-mission-progress-bar').style.width = `${progressPct}%`;
    document.getElementById('modal-mission-tip').innerText = data.tip || '💡 Tip: รักษาวินัยการออกกำลังกายสม่ำเสมอเพื่อสุขภาพที่ดี';

    const btnContainer = document.getElementById('modal-action-btn-container');
    if (data.status === 'claimed') {
        btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); resetMission('${data.id}');" class="px-5 py-2.5 bg-surface-container-high text-tertiary text-xs font-bold rounded-xl hover:bg-tertiary/10 transition-all">ทำอีกครั้ง 🔄</button>`;
    } else if (data.status === 'completed') {
        btnContainer.innerHTML = `<button onclick="claimMissionById('${data.id}', ${data.exp}, ${data.coins}); closeMissionDetailModal();" class="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md animate-bounce">รับเหรียญ 🪙</button>`;
    } else {
        if (data.id === 'run20k') {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); openRunTrackerModal();" class="px-5 py-2.5 bg-tertiary text-white text-xs font-bold rounded-xl hover:bg-tertiary/90 transition-all">เปิดแอปนับระยะทางวิ่ง 🏃</button>`;
        } else if (data.id === 'step') {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); openStepCounterModal();" class="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all">เปิดระบบนับก้าวเดิน 🚶</button>`;
        } else if (data.id === 'water') {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); addWaterFromMission(0.25);" class="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">+ ดื่มน้ำ 250 ml</button>`;
        } else if (data.id === 'meditation') {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); startMeditationTimer();" class="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all shadow-md">เริ่มทำสมาธิ 5 นาที</button>`;
        } else if (data.id === 'sleep') {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); openSleepAlarmModal();" class="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md">ตั้งเวลานอน ⏰</button>`;
        } else {
            btnContainer.innerHTML = `<button onclick="closeMissionDetailModal(); quickCompleteCustomMission('${data.id}');" class="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md">บันทึกกิจกรรม ✨</button>`;
        }
    }

    document.getElementById('mission-detail-modal').classList.remove('hidden');
};

window.closeMissionDetailModal = function() {
    document.getElementById('mission-detail-modal').classList.add('hidden');
};

window.claimMissionById = function(missionKey, exp, coins) {
    const data = window.missionsDetailData[missionKey];
    if (!data || data.status === 'claimed') return;

    if (data.status !== 'completed') {
        showAlert('❌ คุณต้องทำกิจกรรมให้ครบตามเงื่อนไขที่กำหนดก่อน จึงจะกดรับเหรียญรางวัลได้!');
        return;
    }

    window.userCoins = (window.userCoins || 0) + coins;
    window.totalAccumulatedEXP = (window.totalAccumulatedEXP || 0) + exp;
    data.status = 'claimed';

    updateStatsUI();
    renderMissionsUI();
    syncDataToCloud();
    showAlert(`🎉 ยินดีด้วย! ทำภารกิจสำเร็จ ได้รับ +${coins} เหรียญ และ +${exp} EXP เรียบร้อยแล้ว`);
};

window.filterMissions = function(category, el) {
    window.currentMissionCategory = category;

    document.querySelectorAll('.mission-tab').forEach(tab => {
        tab.className = "mission-tab px-4 py-2 bg-surface-container text-on-surface-variant rounded-full font-bold text-xs hover:bg-surface-container-high transition-all whitespace-nowrap";
    });
    if (el) {
        el.className = "mission-tab active px-4 py-2 bg-primary text-white rounded-full font-bold text-xs shadow-sm transition-all whitespace-nowrap";
    }

    document.querySelectorAll('.mission-card').forEach(card => {
        if (category === 'all' || card.classList.contains(category)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
};
