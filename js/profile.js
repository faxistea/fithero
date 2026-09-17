/* ==========================================================================
   FitHero — Profile: Edit Mode, BMI, Avatar, Username
   ========================================================================== */

// === Username Edit ===
window.toggleUserNameEdit = function(showEdit) {
    const displayBox = document.getElementById('username-display-box');
    const editBox = document.getElementById('username-edit-box');
    const inputField = document.getElementById('profile-username-input');

    if (showEdit) {
        inputField.value = userProfileData.name;
        displayBox.classList.add('hidden');
        editBox.classList.remove('hidden');
        inputField.focus();
    } else {
        displayBox.classList.remove('hidden');
        editBox.classList.add('hidden');
    }
};

window.saveNewUserName = function() {
    const inputField = document.getElementById('profile-username-input');
    const newName = inputField.value.trim();

    if (newName) {
        userProfileData.name = newName;
        document.querySelectorAll('.user-name-text').forEach(el => {
            el.innerText = newName;
        });

        // หากผู้ใช้ยังไม่ได้อัปโหลดรูป ให้เปลี่ยนรูปย่อ (Monogram) ตามชื่อใหม่ทันที
        if (!userProfileData.avatar && typeof window.getUserAvatarUrl === 'function') {
            const newAvatarUrl = window.getUserAvatarUrl(null, newName);
            document.querySelectorAll('.profile-avatar-img').forEach(img => {
                img.src = newAvatarUrl;
            });
        }

        if (typeof window.getSavedSession === 'function') {
            const session = window.getSavedSession();
            if (session) {
                session.name = newName;
                localStorage.setItem('fithero_session', JSON.stringify(session));
            }
        }

        syncDataToCloud();
        toggleUserNameEdit(false);
        showAlert('ทำการเปลี่ยนชื่อผู้ใช้เรียบร้อยแล้ว!');
    } else {
        showAlert('กรุณากรอกชื่อผู้ใช้ที่ไม่เป็นค่าว่าง');
    }
};

// === Profile Edit Mode (Age, Gender, Height, Weight) ===
window.toggleProfileEditMode = function() {
    const editBtnText = document.getElementById('profile-edit-text');
    const editBtnIcon = document.getElementById('profile-edit-icon');

    const viewAge = document.getElementById('profile-view-age');
    const inputAge = document.getElementById('profile-input-age');
    const viewGender = document.getElementById('profile-view-gender');
    const inputGender = document.getElementById('profile-input-gender');
    const viewHeight = document.getElementById('profile-view-height');
    const inputHeight = document.getElementById('profile-input-height');
    const viewWeight = document.getElementById('profile-view-weight');
    const inputWeight = document.getElementById('profile-input-weight');

    if (!isProfileEditing) {
        window.isProfileEditing = true;
        editBtnText.innerText = 'บันทึกข้อมูล';
        editBtnIcon.innerText = 'save';

        viewAge.classList.add('hidden');
        inputAge.classList.remove('hidden');
        viewGender.classList.add('hidden');
        inputGender.classList.remove('hidden');
        viewHeight.classList.add('hidden');
        inputHeight.classList.remove('hidden');
        viewWeight.classList.add('hidden');
        inputWeight.classList.remove('hidden');
    } else {
        window.isProfileEditing = false;
        editBtnText.innerText = 'แก้ไขข้อมูล';
        editBtnIcon.innerText = 'edit';

        userProfileData.age = parseInt(inputAge.value) || userProfileData.age;
        userProfileData.gender = inputGender.value || userProfileData.gender;
        userProfileData.height = parseFloat(inputHeight.value) || userProfileData.height;
        userProfileData.weight = parseFloat(inputWeight.value) || userProfileData.weight;

        viewAge.innerText = userProfileData.age;
        viewGender.innerText = userProfileData.gender;
        viewHeight.innerText = userProfileData.height;
        viewWeight.innerText = userProfileData.weight;

        viewAge.classList.remove('hidden');
        inputAge.classList.add('hidden');
        viewGender.classList.remove('hidden');
        inputGender.classList.add('hidden');
        viewHeight.classList.remove('hidden');
        inputHeight.classList.add('hidden');
        viewWeight.classList.remove('hidden');
        inputWeight.classList.add('hidden');

        calculateAndUpdateBMI();
        syncDataToCloud();
        showAlert('บันทึกและประมวลผลข้อมูล BMI เรียบร้อยแล้ว!');
    }
};

// === BMI Calculation ===
window.calculateAndUpdateBMI = function() {
    const heightInMeters = userProfileData.height / 100;
    if (heightInMeters <= 0) return;

    const bmi = userProfileData.weight / (heightInMeters * heightInMeters);
    const formattedBMI = bmi.toFixed(1);

    document.getElementById('bmi-value-text').childNodes[0].nodeValue = `${formattedBMI} `;

    const badge = document.getElementById('bmi-status-badge');
    const categoryText = document.getElementById('bmi-category-text');
    const adviceText = document.getElementById('bmi-advice-text');

    if (bmi < 18.5) {
        badge.innerText = 'น้ำหนักน้อยกว่าเกณฑ์';
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700';
        categoryText.innerText = 'ผอม / น้ำหนักน้อยกว่าเกณฑ์';
        adviceText.innerText = '💡 "ควรเพิ่มการรับประทานอาหารที่มีสารอาหารครบถ้วนและสร้างมวลกล้ามเนื้อด้วยการเวทเทรนนิ่ง"';
    } else if (bmi >= 18.5 && bmi <= 22.9) {
        badge.innerText = 'สมส่วน';
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
        categoryText.innerText = 'เกณฑ์ปกติ (Healthy Weight)';
        adviceText.innerText = '💡 "ร่างกายของคุณอยู่ในเกณฑ์สุขภาพดี รักษาสมดุลโภชนาการและการออกกำลังกายอย่างสม่ำเสมอ"';
    } else if (bmi >= 23.0 && bmi <= 24.9) {
        badge.innerText = 'น้ำหนักเกิน';
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800';
        categoryText.innerText = 'ท้วม / น้ำหนักเกินเกณฑ์';
        adviceText.innerText = '💡 "ควรเริ่มควบคุมปริมาณพลังงานจากอาหาร และเพิ่มการออกกำลังกายแบบคาร์ดิโออย่างน้อย 150 นาที/สัปดาห์"';
    } else {
        badge.innerText = 'อ้วน';
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700';
        categoryText.innerText = 'ภาวะอ้วน (Obesity)';
        adviceText.innerText = '💡 "ควรวางแผนลดน้ำหนักอย่างถูกวิธี ควบคุมแป้งและน้ำตาล ควบคู่กับการออกกำลังกายอย่างสม่ำเสมอ"';
    }
};

// === Profile Avatar Management (แยกเฉพาะบุคคล 100%) ===
window.handleProfileImageUpload = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // ตรวจสอบว่าเป็นไฟล์รูปภาพ
    if (!file.type.startsWith('image/')) {
        showAlert('❌ กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // ปรับขนาดรูปภาพ (สูงสุด 320x320 px) เพื่อให้โหลดเร็วและบันทึกลง Cloud Firestore ได้อย่างเสถียร
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 320;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height = Math.round((height * MAX_SIZE) / width);
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width = Math.round((width * MAX_SIZE) / height);
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            // 1. อัปเดต State และ DOM เฉพาะของผู้ใช้ปัจจุบัน
            userProfileData.avatar = compressedDataUrl;
            document.querySelectorAll('.profile-avatar-img').forEach(el => {
                el.src = compressedDataUrl;
            });

            // 2. อัปเดตใน Session Storage สำหรับบัญชีปัจจุบัน
            if (typeof window.getSavedSession === 'function') {
                const session = window.getSavedSession();
                if (session) {
                    session.avatar = compressedDataUrl;
                    localStorage.setItem('fithero_session', JSON.stringify(session));
                }
            }

            // 3. บันทึกตรงไปยัง Firestore Document ของผู้ใช้นี้เท่านั้น
            if (typeof isFbInitialized !== 'undefined' && isFbInitialized && window.currentUserId && typeof dbSaveUserData === 'function') {
                dbSaveUserData(window.currentUserId, { avatar: compressedDataUrl });
            }
            showAlert('🎉 เปลี่ยนรูปโปรไฟล์ของคุณและบันทึกลง Cloud Firestore เรียบร้อยแล้ว!');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // รีเซ็ตค่า input เพื่อให้สามารถเลือกรูปไฟล์เดิมซ้ำได้หากต้องการ
    event.target.value = '';
};

window.deleteProfileAvatar = async function() {
    if (!confirm('คุณต้องการลบรูปโปรไฟล์และเปลี่ยนกลับไปใช้รูปตัวอักษรย่อเริ่มต้นใช่หรือไม่?')) return;

    // 1. รีเซ็ต State
    userProfileData.avatar = null;

    // 2. อัปเดต DOM เป็นตัวอักษรย่อของบัญชีนี้
    const fallbackAvatar = (typeof window.getUserAvatarUrl === 'function')
        ? window.getUserAvatarUrl(null, userProfileData.name)
        : 'https://ui-avatars.com/api/?name=FitHero&background=4a7c59&color=ffffff&size=256&bold=true';
    document.querySelectorAll('.profile-avatar-img').forEach(img => {
        img.src = fallbackAvatar;
    });

    // 3. อัปเดต Session Storage
    if (typeof window.getSavedSession === 'function') {
        const session = window.getSavedSession();
        if (session) {
            session.avatar = null;
            localStorage.setItem('fithero_session', JSON.stringify(session));
        }
    }

    // 4. บันทึก Firestore
    if (typeof isFbInitialized !== 'undefined' && isFbInitialized && window.currentUserId && typeof dbSaveUserData === 'function') {
        await dbSaveUserData(window.currentUserId, { avatar: null });
    }
    showAlert('🗑️ ลบรูปโปรไฟล์เรียบร้อยแล้ว');
};
