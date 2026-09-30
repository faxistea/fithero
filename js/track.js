/* ==========================================================================
   FitHero — Track: Run/Step Category Switch, Bar Chart Interactions
   ========================================================================== */

window.switchTrackCategory = function(type) {
    const btnRun = document.getElementById('track-tab-run');
    const btnStep = document.getElementById('track-tab-step');
    const secRun = document.getElementById('track-running-section');
    const secStep = document.getElementById('track-step-section');

    if (type === 'run') {
        btnRun.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-tertiary text-white shadow-xs transition-all flex items-center justify-center gap-1.5";
        btnStep.className = "flex-1 py-2 text-xs font-bold rounded-lg text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1.5";
        secRun.classList.remove('hidden');
        secStep.classList.add('hidden');
    } else if (type === 'step') {
        btnStep.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-primary text-white shadow-xs transition-all flex items-center justify-center gap-1.5";
        btnRun.className = "flex-1 py-2 text-xs font-bold rounded-lg text-on-surface-variant hover:text-tertiary transition-all flex items-center justify-center gap-1.5";
        secStep.classList.remove('hidden');
        secRun.classList.add('hidden');
    }
};

window.selectRunDay = function(index) {
    const data = weeklyRunningData[index];
    if (!data) return;

    document.getElementById('run-detail-day-title').innerText = `รายละเอียดการวิ่ง${data.day}`;
    document.getElementById('run-detail-dist').innerText = `${data.dist} กม.`;
    document.getElementById('run-detail-pace').innerText = data.pace.includes("'") ? `${data.pace}/กม.` : data.pace;
    document.getElementById('run-detail-time').innerText = data.time;
    document.getElementById('run-detail-cal').innerText = `${data.calories} kcal`;
    document.getElementById('run-detail-status').innerText = data.status;
    document.getElementById('run-detail-note').innerText = `🏃‍♂️ "${data.note}"`;

    const wrappers = document.querySelectorAll('.run-bar-wrapper');
    wrappers.forEach((wrapper, idx) => {
        const barInner = wrapper.querySelector('.run-bar-inner');
        const dayLabel = wrapper.querySelector('.run-day-label');
        const tooltip = wrapper.querySelector('.run-tooltip');

        if (idx === index) {
            barInner.classList.add('bg-tertiary', 'shadow-sm');
            barInner.classList.remove('bg-tertiary-container/40', 'bg-surface-container-highest/60');
            dayLabel.className = 'run-day-label text-xs font-black text-tertiary mt-2';

            if (tooltip) {
                tooltip.classList.remove('hidden');
                tooltip.className = 'run-tooltip absolute -top-7 left-1/2 -translate-x-1/2 bg-tertiary text-white text-[10px] font-bold py-0.5 px-1.5 rounded whitespace-nowrap shadow-md';
            }
        } else {
            barInner.classList.remove('bg-tertiary', 'shadow-sm');
            if (weeklyRunningData[idx].dist === 0) {
                barInner.classList.add('bg-surface-container-highest/60');
            } else {
                barInner.classList.add('bg-tertiary-container/40');
            }
            dayLabel.className = 'run-day-label text-xs font-bold text-on-surface-variant mt-2 group-hover:text-tertiary';

            if (tooltip) {
                tooltip.classList.add('hidden');
                tooltip.className = 'run-tooltip hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap shadow-md';
            }
        }
    });
};

window.selectStepDay = function(index) {
    const data = weeklyStepData[index];
    if (!data) return;

    document.getElementById('step-detail-day-title').innerText = `รายละเอียด${data.day}`;
    document.getElementById('step-detail-steps').innerText = `${data.steps.toLocaleString()} ก้าว`;
    document.getElementById('step-detail-distance').innerText = data.distance;
    document.getElementById('step-detail-calories').innerText = data.calories;
    document.getElementById('step-detail-status').innerText = data.status;

    const wrappers = document.querySelectorAll('.step-bar-wrapper');
    wrappers.forEach((wrapper, idx) => {
        const barInner = wrapper.querySelector('.step-bar-inner');
        const dayLabel = wrapper.querySelector('.step-day-label');
        const valueLabel = wrapper.querySelector('.step-value-label');

        if (idx === index) {
            barInner.classList.add('bg-primary', 'shadow-sm');
            barInner.classList.remove('bg-primary-container/40', 'bg-tertiary-container/60');
            dayLabel.className = 'step-day-label text-xs font-black text-primary mt-2';

            if (valueLabel) {
                valueLabel.className = 'step-value-label absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-xs';
            }
        } else {
            barInner.classList.remove('bg-primary', 'shadow-sm');
            if (idx === 5) {
                barInner.classList.add('bg-tertiary-container/60');
            } else {
                barInner.classList.add('bg-primary-container/40');
            }
            dayLabel.className = 'step-day-label text-xs font-bold text-on-surface-variant mt-2 group-hover:text-primary';

            if (valueLabel) {
                valueLabel.className = 'step-value-label absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-on-surface-variant whitespace-nowrap';
            }
        }
    });
};

// Dynamic Render Track Page UI based on Active User's Data
window.renderTrackPageUI = function() {
    const runningData = window.weeklyRunningData || [];
    const stepData = window.weeklyStepData || [];

    // 1. สรุปผลการวิ่งเฉพาะผู้ใช้คนปัจจุบัน
    const totalDist = runningData.reduce((acc, d) => acc + (Number(d.dist) || 0), 0);
    const totalRunCal = runningData.reduce((acc, d) => acc + (Number(d.calories) || 0), 0);

    const totalRunDistEl = document.getElementById('total-run-dist');
    if (totalRunDistEl) totalRunDistEl.innerText = totalDist.toFixed(1);

    const totalRunCalEl = document.getElementById('total-run-cal');
    if (totalRunCalEl) totalRunCalEl.innerText = totalRunCal.toLocaleString();

    const avgPaceEl = document.getElementById('avg-run-pace');
    if (avgPaceEl) {
        avgPaceEl.innerText = totalDist > 0 ? "6'05\"" : "-";
    }

    // อัปเดตกราฟแท่งการวิ่ง 7 วัน
    const runWrappers = document.querySelectorAll('.run-bar-wrapper');
    const maxRun = Math.max(8.0, ...runningData.map(d => Number(d.dist) || 0));
    runWrappers.forEach((wrapper, idx) => {
        const item = runningData[idx];
        if (!item) return;
        const barInner = wrapper.querySelector('.run-bar-inner');
        const tooltip = wrapper.querySelector('.run-tooltip');
        const heightPct = Math.max(4, Math.min(100, Math.round(((Number(item.dist) || 0) / maxRun) * 100)));
        if (barInner) barInner.style.height = `${heightPct}%`;
        if (tooltip) tooltip.innerText = `${(Number(item.dist) || 0).toFixed(1)} กม.`;
    });

    // 2. สรุปผลก้าวเดินเฉพาะผู้ใช้คนปัจจุบัน
    const totalSteps = stepData.reduce((acc, d) => acc + (Number(d.steps) || 0), 0);
    const avgSteps = Math.round(totalSteps / 7);
    const totalStepCal = stepData.reduce((acc, d) => acc + (parseInt(d.calories) || 0), 0);

    const totalStepsEl = document.getElementById('total-steps-val');
    if (totalStepsEl) totalStepsEl.innerText = totalSteps.toLocaleString();

    const avgStepsEl = document.getElementById('avg-steps-val');
    if (avgStepsEl) avgStepsEl.innerText = avgSteps.toLocaleString();

    const totalStepCalEl = document.getElementById('total-step-cal-val');
    if (totalStepCalEl) totalStepCalEl.innerText = totalStepCal.toLocaleString();

    // อัปเดตกราฟแท่งก้าวเดิน 7 วัน
    const stepWrappers = document.querySelectorAll('.step-bar-wrapper');
    const maxStep = Math.max(10000, ...stepData.map(d => Number(d.steps) || 0));
    stepWrappers.forEach((wrapper, idx) => {
        const item = stepData[idx];
        if (!item) return;
        const barInner = wrapper.querySelector('.step-bar-inner');
        const valLabel = wrapper.querySelector('.step-value-label');
        const heightPct = Math.max(4, Math.min(100, Math.round(((Number(item.steps) || 0) / maxStep) * 100)));
        if (barInner) barInner.style.height = `${heightPct}%`;
        if (valLabel) valLabel.innerText = (Number(item.steps) || 0).toLocaleString();
    });

    // แสดงรายละเอียดวันปัจจุบัน
    const todayDayIdx = (new Date().getDay() + 6) % 7;
    selectRunDay(todayDayIdx);
    selectStepDay(todayDayIdx);
};

// บันทึกกิจกรรมใหม่รายบุคคล (เพิ่มระยะทางวิ่ง หรือจำนวนก้าว)
window.recordUserActivity = function(type, amount) {
    const todayDayIdx = (new Date().getDay() + 6) % 7;
    amount = parseFloat(amount) || 0;

    if (amount <= 0) {
        showAlert('❌ กรุณาระบุค่าตัวเลขที่มากกว่า 0');
        return;
    }

    if (type === 'run') {
        const item = window.weeklyRunningData[todayDayIdx];
        if (item) {
            item.dist = parseFloat(((Number(item.dist) || 0) + amount).toFixed(1));
            item.calories = (Number(item.calories) || 0) + Math.round(amount * 70);
            item.time = `${Math.round(amount * 6.5)} นาที`;
            item.status = 'บันทึกสำเร็จ 🏃';
            item.note = `วิ่งสะสมเพิ่มขึ้น +${amount} กม. รักษาสุขภาพอย่างยอดเยี่ยม`;
        }

        // อัปเดตภารกิจวิ่ง
        if (window.missionsDetailData && window.missionsDetailData['run20k']) {
            const m = window.missionsDetailData['run20k'];
            m.currentVal = parseFloat(((Number(m.currentVal) || 0) + amount).toFixed(1));
            if (m.currentVal >= m.targetVal && m.status === 'pending') {
                m.status = 'completed';
                showAlert('🎉 วิ่งสะสมครบ 20 กม. แล้ว! กดรับเหรียญรางวัลในหน้าภารกิจได้เลย');
            }
        }

        window.totalAccumulatedEXP += Math.round(amount * 10);
        showSnackbar(`🏃‍♂️ บันทึกการวิ่ง +${amount} กม. สำเร็จ! ข้อมูลซิงค์เฉพาะบัญชีของคุณ`);
    } else if (type === 'step') {
        const item = window.weeklyStepData[todayDayIdx];
        if (item) {
            item.steps = (Number(item.steps) || 0) + Math.round(amount);
            item.distance = `${((item.steps * 0.75) / 1000).toFixed(1)} กม.`;
            item.calories = `${Math.round(item.steps * 0.04)} kcal`;
            item.status = item.steps >= 5000 ? 'บรรลุเป้าหมาย 🎉' : 'สะสมก้าวเดิน 🚶';
            item.note = `เดินสะสมเพิ่มขึ้น +${amount.toLocaleString()} ก้าว`;
        }

        // อัปเดตภารกิจก้าวเดิน
        if (window.missionsDetailData && window.missionsDetailData['step']) {
            const m = window.missionsDetailData['step'];
            m.currentVal = (Number(m.currentVal) || 0) + Math.round(amount);
            if (m.currentVal >= m.targetVal && m.status === 'pending') {
                m.status = 'completed';
                showAlert('🎉 เดินสะสมครบ 5,000 ก้าวแล้ว! กดรับเหรียญรางวัลในหน้าภารกิจได้เลย');
            }
        }

        window.totalAccumulatedEXP += Math.round(amount * 0.01);
        showSnackbar(`🚶‍♂️ บันทึกก้าวเดิน +${amount.toLocaleString()} ก้าว สำเร็จ! ข้อมูลซิงค์เฉพาะบัญชีของคุณ`);
    }

    if (typeof window.syncDataToCloud === 'function') {
        window.syncDataToCloud();
    }
    renderTrackPageUI();
    if (typeof renderMissionsUI === 'function') renderMissionsUI();
    if (typeof updateStatsUI === 'function') updateStatsUI();
};

window.openLogActivityModal = function(defaultType = 'run') {
    const modal = document.getElementById('log-activity-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const sel = document.getElementById('log-activity-type-select');
        if (sel) sel.value = defaultType;
    }
};

window.closeLogActivityModal = function() {
    const modal = document.getElementById('log-activity-modal');
    if (modal) modal.classList.add('hidden');
};

window.handleLogActivityFormSubmit = function(event) {
    if (event) event.preventDefault();
    const type = document.getElementById('log-activity-type-select').value;
    const val = parseFloat(document.getElementById('log-activity-val-input').value) || 0;
    recordUserActivity(type, val);
    closeLogActivityModal();
};

