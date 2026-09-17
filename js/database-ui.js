/* ==========================================================================
   FitHero — Database UI: Firebase Config Modal, Status Display
   ========================================================================== */

window.openDatabaseConfigModal = function() {
    document.getElementById('database-config-modal').classList.remove('hidden');
    updateDatabaseStatusUI();
};

window.closeDatabaseConfigModal = function() {
    document.getElementById('database-config-modal').classList.add('hidden');
};

window.updateDatabaseStatusUI = function() {
    const isReady = typeof isFbInitialized !== 'undefined' && isFbInitialized;
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    const statusBtn = document.getElementById('db-status-btn');
    const profileDesc = document.getElementById('profile-db-desc');
    const modalBox = document.getElementById('modal-db-status-box');

    const baseBtn = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ";

    if (isReady && currentUser) {
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
        if (statusText) statusText.innerText = "☁️ Cloud DB ออนไลน์";
        if (statusBtn) statusBtn.className = baseBtn + "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200";
        if (profileDesc) profileDesc.innerText = `เชื่อมต่อกับ Cloud Firestore แล้ว (${currentUser.email || 'ออนไลน์'})`;

        if (modalBox) {
            modalBox.className = "p-4 rounded-xl flex items-center justify-between border bg-emerald-50 border-emerald-200 text-emerald-900";
            modalBox.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🟢</span>
                    <div>
                        <p class="font-bold text-xs">เชื่อมต่อ Cloud Firestore เรียบร้อยแล้ว</p>
                        <p class="text-[11px] opacity-80">ผู้ใช้: ${currentUser.email || currentUser.uid} (Project: ${firebaseConfig.projectId})</p>
                    </div>
                </div>
                <span class="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">ONLINE</span>
            `;
        }
    } else if (isReady) {
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-blue-500";
        if (statusText) statusText.innerText = "☁️ Firebase พร้อมใช้งาน";
        if (statusBtn) statusBtn.className = baseBtn + "bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200";
        if (profileDesc) profileDesc.innerText = `เชื่อมต่อ Firebase แล้ว (Project: ${firebaseConfig.projectId})`;

        if (modalBox) {
            modalBox.className = "p-4 rounded-xl flex items-center justify-between border bg-blue-50 border-blue-200 text-blue-900";
            modalBox.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🔵</span>
                    <div>
                        <p class="font-bold text-xs">เชื่อมต่อ Firebase สำเร็จ (Project: ${firebaseConfig.projectId})</p>
                        <p class="text-[11px] opacity-80">พร้อมบันทึกข้อมูลเมื่อสมัครสมาชิกหรือเข้าสู่ระบบ</p>
                    </div>
                </div>
                <span class="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">READY</span>
            `;
        }
    } else {
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-amber-500";
        if (statusText) statusText.innerText = "💾 Local Storage (คลิกตั้งค่า)";
        if (statusBtn) statusBtn.className = baseBtn + "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200";
        if (profileDesc) profileDesc.innerText = "ทำงานในโหมดออฟไลน์ (คลิกเพื่อเชื่อม Cloud DB)";

        if (modalBox) {
            modalBox.className = "p-4 rounded-xl flex items-center justify-between border bg-amber-50 border-amber-200 text-amber-900";
            modalBox.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">🟡</span>
                    <div>
                        <p class="font-bold text-xs">กำลังทำงานในโหมด LocalStorage (ออฟไลน์)</p>
                        <p class="text-[11px] opacity-80">ข้อมูลบันทึกในเบราว์เซอร์นี้ สามารถเชื่อมต่อ Cloud Firestore เพื่อซิงค์ออนไลน์ได้ฟรี</p>
                    </div>
                </div>
                <span class="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold">LOCAL</span>
            `;
        }
    }
};

window.saveAndConnectFirebaseFromUI = function() {
    const rawInput = document.getElementById('firebase-config-input').value.trim();
    if (!rawInput) {
        showAlert('กรุณากรอกหรือวางโค้ด firebaseConfig');
        return;
    }

    let parsedConfig = null;
    try {
        if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
            parsedConfig = JSON.parse(rawInput);
        } else {
            const apiKeyMatch = rawInput.match(/apiKey:\s*["']([^"']+)["']/);
            const authDomainMatch = rawInput.match(/authDomain:\s*["']([^"']+)["']/);
            const projectIdMatch = rawInput.match(/projectId:\s*["']([^"']+)["']/);
            const storageBucketMatch = rawInput.match(/storageBucket:\s*["']([^"']+)["']/);
            const messagingSenderIdMatch = rawInput.match(/messagingSenderId:\s*["']([^"']+)["']/);
            const appIdMatch = rawInput.match(/appId:\s*["']([^"']+)["']/);

            if (apiKeyMatch && projectIdMatch) {
                parsedConfig = {
                    apiKey: apiKeyMatch[1],
                    authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
                    projectId: projectIdMatch[1],
                    storageBucket: storageBucketMatch ? storageBucketMatch[1] : `${projectIdMatch[1]}.appspot.com`,
                    messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '',
                    appId: appIdMatch ? appIdMatch[1] : ''
                };
            }
        }
    } catch (e) {
        showAlert('❌ รูปแบบคอนฟิกไม่ถูกต้อง กรุณาตรวจสอบ JSON หรือ Object ที่นำมาวาง');
        return;
    }

    if (!parsedConfig || !parsedConfig.apiKey || !parsedConfig.projectId) {
        showAlert('❌ ไม่พบคีย์ apiKey หรือ projectId ในข้อความที่วาง กรุณาตรวจสอบอีกครั้ง');
        return;
    }

    localStorage.setItem('fithero_firebase_config', JSON.stringify(parsedConfig));
    window.firebaseConfig = parsedConfig;

    if (typeof initializeFitHeroFirebase === 'function') {
        const ok = initializeFitHeroFirebase();
        if (ok) {
            updateDatabaseStatusUI();
            closeDatabaseConfigModal();
            showAlert('🎉 บันทึกการตั้งค่าและเชื่อมต่อ Cloud Firestore สำเร็จแล้ว!');
            return;
        }
    }

    updateDatabaseStatusUI();
    closeDatabaseConfigModal();
    showAlert('บันทึกการตั้งค่าเรียบร้อยแล้ว กรุณารีเฟรชหน้าเว็บหากระบบยังไม่เริ่มทำงาน');
};

window.switchToLocalDatabaseMode = function() {
    localStorage.removeItem('fithero_firebase_config');
    if (typeof defaultFirebaseConfig !== 'undefined') {
        window.firebaseConfig = defaultFirebaseConfig;
    }
    window.isFbInitialized = false;
    updateDatabaseStatusUI();
    closeDatabaseConfigModal();
    showAlert('สลับกลับมาใช้งานโหมด LocalStorage เรียบร้อย');
};
