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
