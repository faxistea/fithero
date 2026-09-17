/* ==========================================================================
   FitHero — Navigation, Hash Routing & Splash Screen
   ========================================================================== */

// Page Navigation with fade transition + hash routing & Strict RBAC
window.navigateTo = function(pageId, skipAnimation = false) {
    // Strict Route Guard: ตรวจสอบสิทธิ์สำหรับหน้า Admin Portal
    if (pageId === 'page-admin') {
        const session = window.getSavedSession();
        const isAdmin = window.currentUserRole === 'admin' || session?.role === 'admin' || (window.currentUser && window.currentUser.email === 'admin@fithero.com');
        if (!isAdmin) {
            showAlert('❌ สิทธิ์ไม่เพียงพอ: บัญชีของคุณไม่ใช่ผู้ดูแลระบบ');
            pageId = 'page-dashboard';
        }
    }

    const currentPage = document.querySelector('.page-view:not(.hidden)');

    const switchDom = () => {
        // Hide all pages
        document.querySelectorAll('.page-view').forEach(page => page.classList.add('hidden'));

        // Show target page
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            // Trigger reflow then fade in
            target.offsetHeight;
            target.classList.remove('page-fade-out');
        }

        window.scrollTo(0, 0);

        // Bottom nav visibility
        const globalNav = document.getElementById('global-bottom-nav');
        if (globalNav) {
            if (pageId === 'page-login' || pageId === 'page-onboarding' || pageId === 'page-admin') {
                globalNav.classList.add('hidden');
            } else {
                globalNav.classList.remove('hidden');
                updateNavStyle(pageId);
            }
        }

        // Save active page in localStorage & history
        if (pageId !== 'page-login' && pageId !== 'page-onboarding') {
            localStorage.setItem('fithero_current_page', pageId);
            if (window.location.hash !== '#' + pageId) {
                history.pushState({ page: pageId }, '', '#' + pageId);
            }
        }

        // Trigger page-specific initializers
        if (pageId === 'page-admin' && typeof renderAdminOverview === 'function') {
            renderAdminOverview();
        }
        if (pageId === 'page-rewards' && typeof renderStoreRewardsUI === 'function') {
            renderStoreRewardsUI();
        }
        if (pageId === 'page-missions' && typeof renderMissionsUI === 'function') {
            renderMissionsUI();
        }
    };


    if (skipAnimation || !currentPage || currentPage.id === pageId) {
        switchDom();
    } else {
        currentPage.classList.add('page-fade-out');
        setTimeout(switchDom, 150);
    }
};

// Bottom nav active style
function updateNavStyle(activePageId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const icon = link.querySelector('.nav-icon');
        const page = link.getAttribute('data-page');

        if (page === activePageId) {
            link.className = "nav-link flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-6 py-1 active:scale-90 transition-all shadow-md";
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        } else {
            link.className = "nav-link flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-all active:scale-90";
            if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        }
    });
}
window.updateNavStyle = updateNavStyle;

// Read saved session
window.getSavedSession = function() {
    try {
        const raw = localStorage.getItem('fithero_session');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

// Restore page on load or refresh (ป้องกันการเด้งกลับไปหน้า login เมื่อรีเฟรชหน้าต่าง)
window.restoreInitialPage = function() {
    const session = window.getSavedSession();
    const validPages = ['page-dashboard', 'page-missions', 'page-track', 'page-rewards', 'page-profile', 'page-admin'];

    if (session && (session.email || session.isLoggedIn)) {
        // กู้คืนชื่อผู้ใช้
        if (session.name && typeof userProfileData !== 'undefined') {
            userProfileData.name = session.name;
            document.querySelectorAll('.user-name-text').forEach(el => el.innerText = session.name);
        }

        // กู้คืนรูปโปรไฟล์เฉพาะบุคคล ป้องกันรูปบัญชีอื่นตกค้างใน DOM
        if (typeof userProfileData !== 'undefined') {
            userProfileData.avatar = session.avatar || null;
        }
        const avatarUrl = (typeof window.getUserAvatarUrl === 'function')
            ? window.getUserAvatarUrl(session.avatar, session.name)
            : 'https://ui-avatars.com/api/?name=FitHero&background=4a7c59&color=ffffff&size=256&bold=true';
        document.querySelectorAll('.profile-avatar-img').forEach(img => {
            img.src = avatarUrl;
        });

        // ลำดับ 1: ดึงจาก URL hash ก่อน (เช่น #page-admin, #page-missions)
        const currentHash = window.location.hash.replace('#', '');
        let targetPage = (session.role === 'admin' || session.email === 'admin@fithero.com') ? 'page-admin' : 'page-dashboard';

        if (validPages.includes(currentHash)) {
            // ป้องกันผู้ใช้ทั่วไปเข้าหน้า admin
            if (currentHash === 'page-admin' && session.role !== 'admin' && session.email !== 'admin@fithero.com') {
                targetPage = 'page-dashboard';
            } else {
                targetPage = currentHash;
            }
        } else {
            // ลำดับ 2: ดึงจากหน้าล่าสุดที่บันทึกไว้ใน localStorage
            const savedPage = localStorage.getItem('fithero_current_page');
            if (validPages.includes(savedPage)) {
                if (savedPage === 'page-admin' && session.role !== 'admin' && session.email !== 'admin@fithero.com') {
                    targetPage = 'page-dashboard';
                } else {
                    targetPage = savedPage;
                }
            }
        }

        navigateTo(targetPage, true);
    } else {
        // ยังไม่ได้เข้าสู่ระบบ รีเซ็ตรูปโปรไฟล์กลับเป็นค่าเริ่มต้น
        const defaultAvatar = (typeof window.getUserAvatarUrl === 'function')
            ? window.getUserAvatarUrl(null, 'FitHero')
            : 'https://ui-avatars.com/api/?name=FitHero&background=4a7c59&color=ffffff&size=256&bold=true';
        document.querySelectorAll('.profile-avatar-img').forEach(img => {
            img.src = defaultAvatar;
        });
        // ให้แสดงหน้า login
        navigateTo('page-login', true);
    }
};

// สลับระหว่างมุมมอง Admin และ User
window.switchToUserView = function() {
    navigateTo('page-dashboard');
    if (typeof showSnackbar === 'function') {
        showSnackbar('👀 สลับมามุมมองผู้ใช้ทั่วไป (User View) เรียบร้อย');
    }
};

window.switchToAdminView = function() {
    const session = window.getSavedSession();
    if (session && (session.role === 'admin' || session.email === 'admin@fithero.com')) {
        navigateTo('page-admin');
        if (typeof renderAdminOverview === 'function') renderAdminOverview();
    } else {
        showAlert('❌ สิทธิ์ไม่เพียงพอ: บัญชีของคุณไม่ใช่ผู้ดูแลระบบ');
    }
};

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        const pageId = event.state.page;
        navigateTo(pageId, true);
    }
});

// Splash Screen — hide after load
window.hideSplashScreen = function() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('splash-hidden');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }
};
