/* ==========================================================================
   FitHero — main.js (Entry Point)
   ========================================================================== */

// Import CSS
import './style.css';

// Import all modules (order: data first, then features)
import './js/data.js';
import './js/navigation.js';
import './js/dashboard.js';
import './js/auth.js';
import './js/missions.js';
import './js/modals.js';
import './js/track.js';
import './js/rewards.js';
import './js/profile.js';
import './js/database-ui.js';
import './js/admin.js';

// === Realtime Firestore Subscriptions ===
window.setupRealtimeListeners = function(user, role) {
    // ยกเลิก listeners เก่าทั้งหมดก่อนเริ่มใหม่
    if (window.firestoreUnsubscribers && Array.isArray(window.firestoreUnsubscribers)) {
        window.firestoreUnsubscribers.forEach(unsub => {
            if (typeof unsub === 'function') {
                try { unsub(); } catch(e) {}
            }
        });
    }
    window.firestoreUnsubscribers = [];

    if (!user || !user.uid) return;

    // 1. ติดตามข้อมูลโปรไฟล์ & เหรียญของผู้ใช้แบบ Realtime
    if (typeof dbListenUserDoc === 'function') {
        const unsubUser = dbListenUserDoc(user.uid, (udata) => {
            if (udata) {
                applyUserDataToApp(udata);
                const currentRole = udata.role || (user.email === 'admin@fithero.com' ? 'admin' : 'user');
                window.currentUserRole = currentRole;
                const session = window.getSavedSession() || {};
                session.role = currentRole;
                if (udata.name) session.name = udata.name;
                session.avatar = udata.avatar || null;
                localStorage.setItem('fithero_session', JSON.stringify(session));

                const adminBtn = document.getElementById('profile-admin-btn');
                if (adminBtn) {
                    if (currentRole === 'admin') adminBtn.classList.remove('hidden');
                    else adminBtn.classList.add('hidden');
                }
            }
        });
        if (unsubUser) window.firestoreUnsubscribers.push(unsubUser);
    }

    // 2. ติดตามรายการสินค้าในร้านค้า (Products) แบบ Realtime ทั้ง User & Admin
    if (typeof dbListenProducts === 'function') {
        const unsubProd = dbListenProducts((prods) => {
            if (prods && prods.length > 0) {
                window.storeProductsData = prods;
                if (typeof renderStoreRewardsUI === 'function') renderStoreRewardsUI();
                if (typeof renderAdminProductsTable === 'function' && window.currentUserRole === 'admin') {
                    renderAdminProductsTable();
                }
            }
        });
        if (unsubProd) window.firestoreUnsubscribers.push(unsubProd);
    }

    // 3. ติดตามภารกิจทั้งหมด (Missions) แบบ Realtime
    if (typeof dbListenMissions === 'function') {
        const unsubMissions = dbListenMissions((missions) => {
            if (missions && Object.keys(missions).length > 0) {
                window.missionsDetailData = missions;
                if (typeof renderMissionsUI === 'function') renderMissionsUI();
                if (typeof renderAdminMissionsTable === 'function' && window.currentUserRole === 'admin') {
                    renderAdminMissionsTable();
                }
            }
        });
        if (unsubMissions) window.firestoreUnsubscribers.push(unsubMissions);
    }

    // 4. สิทธิ์ Admin: ติดตาม Orders ทั้งหมด และรายชื่อผู้ใช้ทั้งหมด
    if (role === 'admin') {
        if (typeof dbListenOrders === 'function') {
            const unsubOrders = dbListenOrders((orders) => {
                window.redemptionOrdersData = orders;
                if (typeof renderAdminOrdersTable === 'function') renderAdminOrdersTable();
                if (typeof renderAdminStats === 'function') renderAdminStats();
            });
            if (unsubOrders) window.firestoreUnsubscribers.push(unsubOrders);
        }

        if (typeof dbListenAllUsers === 'function') {
            const unsubUsers = dbListenAllUsers((users) => {
                window.adminUsersList = users;
                if (typeof renderAdminUsersTable === 'function') renderAdminUsersTable();
                if (typeof renderAdminStats === 'function') renderAdminStats();
            });
            if (unsubUsers) window.firestoreUnsubscribers.push(unsubUsers);
        }
    }
};

// === App Initialization ===
function initApp() {
    // ล้างแคชรูปโปรไฟล์แบบเก่าที่อาจค้างอยู่ในเครื่องเพื่อป้องกันรูปปะปนกันข้ามบัญชี
    try {
        localStorage.removeItem('fithero_profile_avatar');
    } catch(e) {}

    try {
        if (typeof loadLocalStorageData === 'function') loadLocalStorageData();
        if (typeof calculateAndUpdateBMI === 'function') calculateAndUpdateBMI();
        if (typeof renderMissionsUI === 'function') renderMissionsUI();
        if (typeof renderStoreRewardsUI === 'function') renderStoreRewardsUI();
        if (typeof updateTDEEDisplay === 'function') updateTDEEDisplay();
        if (typeof updateStatsUI === 'function') updateStatsUI();
        if (typeof updateDatabaseStatusUI === 'function') updateDatabaseStatusUI();
    } catch (e) {
        console.warn("Init UI error:", e);
    }

    // เช็คสิทธิ์ Admin และแสดงปุ่มลัดไปยัง Admin Portal ในหน้าโปรไฟล์
    try {
        const savedSession = window.getSavedSession();
        if (savedSession && (savedSession.role === 'admin' || savedSession.email === 'admin@fithero.com')) {
            window.currentUserRole = 'admin';
            const adminBtn = document.getElementById('profile-admin-btn');
            if (adminBtn) adminBtn.classList.remove('hidden');
        }
    } catch (e) {}

    // กู้คืนสถานะการเข้าสู่ระบบและหน้าล่าสุดที่เปิดอยู่ (ป้องกันการเด้งไปหน้า login เมื่อรีเฟรช)
    try {
        if (typeof restoreInitialPage === 'function') restoreInitialPage();
    } catch (e) {
        console.warn("restoreInitialPage error:", e);
    }

    // ซ่อน Splash Screen ทันที เพื่อให้ผู้ใช้เข้าถึงแอปได้อย่างรวดเร็ว ไม่เสียเวลารอ
    if (typeof hideSplashScreen === 'function') {
        setTimeout(hideSplashScreen, 150);
    } else {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('splash-hidden');
            setTimeout(() => { splash.style.display = 'none'; }, 200);
        }
    }

    // Firebase Auth State Observer
    if (typeof firebase !== 'undefined' && typeof fbAuth !== 'undefined' && fbAuth) {
        fbAuth.onAuthStateChanged(async (user) => {
            if (user) {
                window.currentUser = user;
                window.currentUserId = user.uid;
                console.log("Firebase Auth User:", user.email);

                let userRole = (user.email === 'admin@fithero.com') ? 'admin' : 'user';

                const session = window.getSavedSession() || {};
                if (fbDb) {
                    try {
                        const docSnap = await fbDb.collection('users').doc(user.uid).get();
                        if (docSnap.exists) {
                            const udata = docSnap.data();
                            applyUserDataToApp(udata);
                            if (udata.role === 'admin' || user.email === 'admin@fithero.com') {
                                userRole = 'admin';
                            }
                            session.avatar = udata.avatar || null;
                            if (udata.name) session.name = udata.name;
                        }
                    } catch (e) {
                        console.warn("Error fetching Firestore user data:", e);
                    }
                }

                window.currentUserRole = userRole;

                // บันทึกสถานะ session
                session.email = user.email;
                session.uid = user.uid;
                session.role = userRole;
                session.isLoggedIn = true;
                session.mode = 'firebase';
                if (!session.name && user.displayName) session.name = user.displayName;
                localStorage.setItem('fithero_session', JSON.stringify(session));

                const adminBtn = document.getElementById('profile-admin-btn');
                if (adminBtn) {
                    if (userRole === 'admin') adminBtn.classList.remove('hidden');
                    else adminBtn.classList.add('hidden');
                }

                // เริ่มการเชื่อมต่อ Realtime Listener
                window.setupRealtimeListeners(user, userRole);

                updateDatabaseStatusUI();

                // ถ้าหน้ารายการยังค้างอยู่ที่หน้า login ให้เปลี่ยนไปหน้าที่บันทึกไว้หรือแดชบอร์ดทันที
                const activePage = document.querySelector('.page-view:not(.hidden)');
                if (!activePage || activePage.id === 'page-login') {
                    const validPages = ['page-dashboard', 'page-missions', 'page-track', 'page-rewards', 'page-profile', 'page-admin'];
                    const hash = window.location.hash.replace('#', '');
                    const savedPage = localStorage.getItem('fithero_current_page');
                    const defaultTarget = (userRole === 'admin') ? 'page-admin' : 'page-dashboard';
                    const target = validPages.includes(hash) ? hash : (validPages.includes(savedPage) ? savedPage : defaultTarget);
                    navigateTo(target, true);
                }
            } else {
                const session = window.getSavedSession();
                if (session && session.mode === 'firebase') {
                    if (typeof window.resetAppStateToDefaults === 'function') {
                        window.resetAppStateToDefaults();
                    }
                    localStorage.removeItem('fithero_session');
                    localStorage.removeItem('fithero_current_page');
                    window.currentUser = null;
                    window.currentUserId = null;
                    window.currentUserRole = 'user';
                    const adminBtn = document.getElementById('profile-admin-btn');
                    if (adminBtn) adminBtn.classList.add('hidden');
                    updateDatabaseStatusUI();
                    navigateTo('page-login', true);
                }
            }
        });
    }

    // Password toggle on login page
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePasswordIcon');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggleIcon.innerText = isPassword ? 'visibility_off' : 'visibility';
        });
    }
}

// Ensure initApp runs whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// === Clean & Register Service Worker ===
if ('serviceWorker' in navigator) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // บนเครื่องพัฒนา Unregister เพื่อป้องกันแคชค้างทำให้โหลดช้า
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    } else {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('✅ SW registered:', reg.scope))
                .catch(err => console.warn('SW registration failed:', err));
        });
    }
}

