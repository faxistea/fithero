/* ==========================================================================
   FitHero — Auth: Login, Register, Logout
   ========================================================================== */

window.handleLoginSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberCheckbox = document.getElementById('remember');
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

    // 1. Firebase Auth & Cloud Firestore
    if (typeof isFbInitialized !== 'undefined' && isFbInitialized) {
        showAlert('⏳ กำลังเข้าสู่ระบบและดึงข้อมูลจาก Cloud Firestore...');
        const res = await dbLoginUser(email, password);
        if (res.success) {
            window.currentUser = res.user;
            window.currentUserId = res.user.uid;
            if (res.data) {
                applyUserDataToApp(res.data);
            }

            const isAdmin = email === 'admin@fithero.com' || res.data?.role === 'admin';
            window.currentUserRole = isAdmin ? 'admin' : 'user';

            // บันทึก Session ลง LocalStorage เพื่อกู้คืนหน้าเว็บเมื่อเปิดใหม่หรือรีเฟรช
            const sessionData = {
                email: email,
                name: userProfileData.name || res.data?.name || email.split('@')[0],
                role: window.currentUserRole,
                uid: res.user.uid,
                mode: 'firebase',
                isLoggedIn: true,
                rememberMe: rememberMe,
                avatar: res.data?.avatar || null,
                loginTime: Date.now()
            };
            localStorage.setItem('fithero_session', JSON.stringify(sessionData));

            if (typeof window.setupRealtimeListeners === 'function') {
                window.setupRealtimeListeners(res.user, window.currentUserRole);
            }

            updateDatabaseStatusUI();
            const adminBtn = document.getElementById('profile-admin-btn');
            if (isAdmin) {
                if (adminBtn) adminBtn.classList.remove('hidden');
                showAlert('👑 เข้าสู่ระบบในฐานะผู้ดูแลระบบ (Admin) สำเร็จ!');
                navigateTo('page-admin');
            } else {
                if (adminBtn) adminBtn.classList.add('hidden');
                showAlert(`🎉 เข้าสู่ระบบสำเร็จ! เชื่อมต่อกับ Cloud Firestore (${email}) เรียบร้อยแล้ว`);
                navigateTo('page-dashboard');
            }
            return;
        } else {
            showAlert(`❌ เข้าสู่ระบบไม่สำเร็จ: ${res.message}`);
            return;
        }
    } else {
        showAlert('⚠️ ฐานข้อมูล Firebase Cloud Firestore ยังไม่พร้อมใช้งาน กรุณาตรวจสอบอินเทอร์เน็ตหรือการเชื่อมต่อ Firebase');
    }
};

window.handleRegistrationSubmit = async function(event) {
    event.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        showAlert('❌ รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
        return;
    }

    if (password.length < 8) {
        showAlert('❌ รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        return;
    }

    // สมัครสมาชิกผ่าน Firebase Cloud Firestore 100%
    if (typeof isFbInitialized !== 'undefined' && isFbInitialized) {
        showAlert('⏳ กำลังสมัครสมาชิกและสร้างบัญชีบน Cloud Firestore...');
        const initialData = {
            name: email.split('@')[0],
            age: 28,
            gender: 'ชาย',
            height: 175,
            weight: 72,
            coins: 520,
            totalAccumulatedEXP: 0,
            targetTDEEGoal: 2350,
            role: (email === 'admin@fithero.com') ? 'admin' : 'user',
            missions: missionsDetailData
        };

        const res = await dbRegisterUser(email, password, initialData);
        if (res.success) {
            window.currentUser = res.user;
            window.currentUserId = res.user.uid;
            const loginEmailInput = document.getElementById('email');
            if (loginEmailInput) loginEmailInput.value = email;
            updateDatabaseStatusUI();
            showAlert(`🎉 สมัครสมาชิกสำเร็จ! บัญชี (${email}) ถูกสร้างขึ้นบน Firebase Cloud Firestore เรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที`);
            navigateTo('page-login');
            return;
        } else {
            showAlert(`❌ สมัครสมาชิกไม่สำเร็จ: ${res.message}`);
            return;
        }
    } else {
        showAlert('⚠️ ฐานข้อมูล Firebase Cloud Firestore ยังไม่พร้อมใช้งาน กรุณาตรวจสอบอินเทอร์เน็ต');
    }
};

window.toggleRegPasswordVisibility = function(inputId, iconId) {
    const passInput = document.getElementById(inputId);
    const passIcon = document.getElementById(iconId);
    if (passInput && passIcon) {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        passIcon.innerText = isPassword ? 'visibility_off' : 'visibility';
    }
};

window.confirmLogout = async function() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        if (typeof window.resetAppStateToDefaults === 'function') {
            window.resetAppStateToDefaults();
        }
        if (typeof dbLogoutUser === 'function') {
            await dbLogoutUser();
        }
        localStorage.removeItem('fithero_session');
        localStorage.removeItem('fithero_current_page');
        try { localStorage.removeItem('fithero_profile_avatar'); } catch(e) {}
        window.currentUser = null;
        window.currentUserId = null;
        window.currentUserRole = 'user';
        const adminBtn = document.getElementById('profile-admin-btn');
        if (adminBtn) adminBtn.classList.add('hidden');
        history.replaceState(null, '', window.location.pathname);
        updateDatabaseStatusUI();
        navigateTo('page-login', true);
        if (typeof showSnackbar === 'function') {
            showSnackbar('👋 ออกจากระบบเรียบร้อยแล้ว');
        } else if (typeof showAlert === 'function') {
            showAlert('👋 ออกจากระบบเรียบร้อยแล้ว');
        }
    }
};

