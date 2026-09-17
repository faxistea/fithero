/* ==========================================================================
   FitHero — Modals: Meditation, Run Tracker, Step Counter, Sleep Alarm,
                     Quick Log, Alert/Toast
   ========================================================================== */

// === Alert / Toast ===
window.showAlert = function(msg) {
    document.getElementById('toast-message').innerText = msg;
    document.getElementById('toast-modal').classList.add('hidden');
    document.getElementById('toast-modal').classList.remove('hidden');

    // Also show snackbar for quick feedback
    showSnackbar(msg, 4000);
};

window.closeAlert = function() {
    document.getElementById('toast-modal').classList.add('hidden');
};

// Snackbar Toast (auto-dismiss, non-blocking)
window.showSnackbar = function(msg, duration) {
    duration = duration || 3000;
    const el = document.getElementById('snackbar');
    if (!el) return;
    el.innerText = msg;
    el.classList.add('snackbar-show');
    clearTimeout(window._snackbarTimeout);
    window._snackbarTimeout = setTimeout(() => {
        el.classList.remove('snackbar-show');
    }, duration);
};

// === Quick Log ===
window.quickLogModal = function() {
    document.getElementById('quick-log-modal').classList.remove('hidden');
};

window.closeQuickLog = function() {
    document.getElementById('quick-log-modal').classList.add('hidden');
};

window.addActivityLog = function(type, duration) {
    closeQuickLog();
    window.totalAccumulatedEXP += 50;

    updateStatsUI();
    syncDataToCloud();
    if (currentUserId && typeof dbLogActivity === 'function') {
        dbLogActivity(currentUserId, { type, duration, exp: 50, timestamp: new Date().toISOString() });
    }
    showAlert(`บันทึกสำเร็จ! กิจกรรม "${type}" (${duration}) เพิ่มเข้าสู่ประวัติเรียบร้อยแล้ว (+50 EXP)`);
};

// === Run Tracker Modal ===
window.openRunTrackerModal = function() {
    document.getElementById('run-tracker-modal').classList.remove('hidden');
};
window.closeRunTrackerModal = function() {
    document.getElementById('run-tracker-modal').classList.add('hidden');
};
window.simulateRunDistance = function(km) {
    const mRun = missionsDetailData['run20k'];
    mRun.currentVal = Math.min(20.0, mRun.currentVal + km);
    document.getElementById('run-tracker-dist').innerText = mRun.currentVal.toFixed(1);

    if (mRun.currentVal >= 20.0) {
        mRun.status = 'completed';
        showAlert('🎉 วิ่งสะสมระยะทางครบ 20.0 km สำเร็จแล้ว! สามารถกดรับเหรียญรางวัลได้เลย');
    } else {
        showAlert(`🏃‍♂️ สะสมระยะทางเพิ่ม +${km} km (รวม ${mRun.currentVal.toFixed(1)} / 20.0 km)`);
    }
    renderMissionsUI();
};
window.finishRunTrackerSession = function() {
    closeRunTrackerModal();
    renderMissionsUI();
    syncDataToCloud();
    showAlert('บันทึกสถิติการวิ่งเข้าระบบเรียบร้อยแล้ว!');
};

// === Step Counter Modal ===
window.openStepCounterModal = function() {
    document.getElementById('step-counter-val').innerText = missionsDetailData['step'].currentVal.toLocaleString();
    document.getElementById('step-counter-modal').classList.remove('hidden');
};
window.closeStepCounterModal = function() {
    document.getElementById('step-counter-modal').classList.add('hidden');
};
window.addStepCount = function(steps) {
    const mStep = missionsDetailData['step'];
    mStep.currentVal += steps;
    document.getElementById('step-counter-val').innerText = mStep.currentVal.toLocaleString();

    if (mStep.currentVal >= 5000 && mStep.status === 'pending') {
        mStep.status = 'completed';
        showAlert('🎉 เดินสะสมครบ 5,000 ก้าวสำเร็จแล้ว! สามารถกดรับเหรียญรางวัลได้เลย');
    }
    renderMissionsUI();
};
window.finishStepCounterSession = function() {
    closeStepCounterModal();
    renderMissionsUI();
    syncDataToCloud();
    showAlert('อัปเดตจำนวนก้าวเดินเรียบร้อยแล้ว!');
};

// === Sleep Alarm Modal ===
window.openSleepAlarmModal = function() {
    document.getElementById('sleep-alarm-modal').classList.remove('hidden');
};
window.closeSleepAlarmModal = function() {
    document.getElementById('sleep-alarm-modal').classList.add('hidden');
};
window.confirmSleepAlarmSetting = function() {
    const sleepTime = document.getElementById('sleep-time-input').value;
    const mSleep = missionsDetailData['sleep'];

    mSleep.currentVal = sleepTime;
    mSleep.status = 'completed';

    closeSleepAlarmModal();
    renderMissionsUI();
    syncDataToCloud();
    showAlert(`⏰ ตั้งเวลาเข้านอนที่ ${sleepTime} น. เรียบร้อยแล้ว! กดรับเหรียญรางวัลได้เลย`);
};

// === Water (from mission) ===
window.addWaterFromMission = function(amount) {
    const mWater = missionsDetailData['water'];
    if (mWater.status === 'claimed' || mWater.status === 'completed') return;

    mWater.currentVal = Math.min(2.0, mWater.currentVal + amount);
    if (mWater.currentVal >= 2.0) {
        mWater.status = 'completed';
        showAlert('🎉 คุณดื่มน้ำครบ 2.0 ลิตรตามเป้าหมายแล้ว กดรับเหรียญรางวัลได้เลย!');
    } else {
        showAlert(`💧 ดื่มน้ำเพิ่มอีก ${amount * 1000} ml (สะสมแล้ว ${mWater.currentVal.toFixed(2)}L / 2.0L)`);
    }
    renderMissionsUI();
    syncDataToCloud();
    closeQuickLog();
};

// === Meditation Timer ===
window.startMeditationTimer = function() {
    document.getElementById('meditation-timer-modal').classList.remove('hidden');
};

window.toggleMeditationTimer = function() {
    const btnText = document.getElementById('meditation-btn-text');
    const statusLabel = document.getElementById('meditation-status-label');

    if (!isMeditationRunning) {
        window.isMeditationRunning = true;
        btnText.innerText = 'หยุดชั่วคราว';
        statusLabel.innerText = 'กำลังทำสมาธิ...';

        window.meditationTimerInterval = setInterval(() => {
            window.meditationSecondsLeft--;
            updateMeditationDisplay();

            if (meditationSecondsLeft <= 0) {
                clearInterval(meditationTimerInterval);
                window.isMeditationRunning = false;
                document.getElementById('meditation-timer-modal').classList.add('hidden');

                const medData = missionsDetailData['meditation'];
                if (medData) {
                    medData.currentVal = 5;
                    medData.status = 'completed';
                }

                renderMissionsUI();
                syncDataToCloud();
                showAlert('🧘‍♀️ ยินดีด้วย! คุณทำสมาธิผ่อนคลายครบ 5 นาทีเรียบร้อยแล้ว กดรับเหรียญรางวัลได้เลย!');
            }
        }, 1000);
    } else {
        clearInterval(meditationTimerInterval);
        window.isMeditationRunning = false;
        btnText.innerText = 'ทำสมาธิต่อ';
        statusLabel.innerText = 'หยุดชั่วคราว';
    }
};

window.updateMeditationDisplay = function() {
    const mins = Math.floor(meditationSecondsLeft / 60);
    const secs = meditationSecondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('meditation-timer-display').innerText = formatted;
};

window.cancelMeditationTimer = function() {
    if (meditationTimerInterval) clearInterval(meditationTimerInterval);
    window.isMeditationRunning = false;
    window.meditationSecondsLeft = 300;
    updateMeditationDisplay();
    document.getElementById('meditation-btn-text').innerText = 'เริ่มนับเวลา 5 นาที';
    document.getElementById('meditation-status-label').innerText = 'พร้อมสมาธิ';
    document.getElementById('meditation-timer-modal').classList.add('hidden');
};
