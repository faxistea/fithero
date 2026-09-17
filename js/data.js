/* ==========================================================================
   FitHero — Shared State & Data
   ========================================================================== */

// ข้อมูลสถานะรวม (Shared State)
window.userCoins = 520;
window.totalAccumulatedEXP = 2450;
window.currentStep = 1;
window.currentBMRMode = 'daily';
window.dailyBMR = 1840;
window.targetTDEEGoal = 2350;

window.userProfileData = {
    name: 'Alex Rivers',
    age: 28,
    gender: 'ชาย',
    height: 175,
    weight: 72,
    avatar: null
};

// ฟังก์ชันสร้างหรือดึง URL รูปโปรไฟล์เฉพาะบุคคล ป้องกันรูปปะปนกันข้ามบัญชี
window.getUserAvatarUrl = function(avatar, name) {
    if (avatar && typeof avatar === 'string' && avatar.trim().length > 0) {
        return avatar;
    }
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'FitHero';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4a7c59&color=ffffff&size=256&bold=true`;
};

// ข้อมูลบัญชีจำลองถูกนำออกทั้งหมด เพื่อเชื่อมต่อกับ Firebase Cloud Firestore 100%
window.registeredUsers = {};

// ข้อมูลของรางวัลในร้านค้า (Admin สามารถเพิ่ม/ลบ/แก้ไข/เปลี่ยนรูปได้)
window.defaultStoreProducts = [
    {
        id: 'gel',
        name: 'Royal-D Energy Gel',
        tag: 'Level 1: Starter Rewards',
        price: 300,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        description: 'เจลให้พลังงานชนิดพกพา เหมาะสำหรับนักวิ่งและสายออกกำลังกาย ช่วยเติมพลังงานระหว่างทางได้อย่างรวดเร็ว'
    },
    {
        id: 'shaker',
        name: 'กระบอกเชกโปรตีน FitHero Shaker Bottle (700ml)',
        tag: 'Level 2: Fitness Gear',
        price: 850,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80',
        description: 'กระบอกเชกพลาสติก BPA-Free สีดำตัดด้วยฝาและสกรีนโลโก้สีเขียว-เหลืองนีออน'
    },
    {
        id: 'tshirt',
        name: 'เสื้อยืดระบายอากาศ FitHero T-Shirt',
        tag: 'Level 3: Premium Apparel',
        price: 1800,
        stock: 25,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
        description: 'เนื้อผ้า Quick-Dry ระบายเหงื่อดีเยี่ยม สกรีนลายสไตล์มินิมอลกลางอก เนื้อผ้านุ่มเบาสบาย'
    },
    {
        id: 'box',
        name: 'FitHero Mystery Box (กล่องสุ่มสินค้า)',
        tag: 'Level 4: Trophy & Legend',
        price: 2500,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=80',
        description: 'กล่องสุ่มรวมของที่ระลึกสุดลิมิเต็ด 3-4 ชิ้น พร้อมการ์ดข้อความขอบคุณสุดพิเศษ'
    }
];
window.storeProductsData = JSON.parse(JSON.stringify(window.defaultStoreProducts));
window.currentUserRole = 'user';
window.firestoreUnsubscribers = [];

// รายการคำขอแลกของรางวัล (Redemption Orders — อ่าน-เขียนจาก Firestore 100%)
window.redemptionOrdersData = [];
window.adminUsersList = [];
window.isProfileEditing = false;
window.currentUser = null;
window.currentUserId = null;
window.cloudSyncTimeout = null;

// Meditation Timer State
window.meditationTimerInterval = null;
window.meditationSecondsLeft = 300;
window.isMeditationRunning = false;

// ข้อมูลภารกิจเริ่มต้นทั้งหมด
window.defaultMissionsDetailData = {
    'run20k': {
        id: 'run20k',
        title: '1. วิ่งระยะทางสะสม 20 กิโลเมตร',
        tag: 'วิ่ง & ออกกำลังกาย',
        category: 'workout',
        rewardText: '+150 EXP • +50 เหรียญ',
        icon: '🏃‍♂️',
        condition: 'weekly_running_distance >= 20.0 km',
        detection: 'Sync ข้อมูล GPS / Run Tracking จากแอป หรือ Apple Health / Google Fit',
        currentVal: 24.0,
        targetVal: 20.0,
        unit: 'km',
        status: 'completed',
        exp: 150,
        coins: 50,
        tip: '💡 Tip: การวิ่งสะสมระยะทางสม่ำเสมอช่วยพัฒนาความแข็งแรงของระบบหัวใจและปอดได้อย่างมีประสิทธิภาพ'
    },
    'step': {
        id: 'step',
        title: '2. เดินสะสมครบ 5,000 ก้าว',
        tag: 'วิ่ง & ออกกำลังกาย',
        category: 'workout',
        rewardText: '+50 EXP • +20 เหรียญ',
        icon: '🚶‍♂️',
        condition: 'daily_step_count >= 5000 ก้าว',
        detection: 'Sync ข้อมูลจาก Pedometer Sensor ของสมาร์ทโฟน/นาฬิกาอัจฉริยะ',
        currentVal: 9420,
        targetVal: 5000,
        unit: 'ก้าว',
        status: 'completed',
        exp: 50,
        coins: 20,
        tip: '💡 Tip: การเดินวันละ 5,000 ก้าวขึ้นไป ช่วยกระตุ้นการเผาผลาญและระบบหมุนเวียนโลหิตตลอดวัน'
    },
    'water': {
        id: 'water',
        title: '3. ดื่มน้ำสะอาดให้ครบ 2 ลิตร',
        tag: 'โภชนาการ',
        category: 'nutrition',
        rewardText: '+40 EXP • +15 เหรียญ',
        icon: '💧',
        condition: 'daily_water_volume >= 2.0 ลิตร',
        detection: 'Manual Input (กดบันทึกดื่มน้ำ) หรือ ดึงข้อมูลจาก Health API',
        currentVal: 0.9,
        targetVal: 2.0,
        unit: 'L',
        status: 'pending',
        exp: 40,
        coins: 15,
        tip: '💡 Tip: การดื่มน้ำอย่างเพียงพอช่วยเติมความชุ่มชื้น สดชื่น และช่วยให้ผิวพรรณเปล่งปลั่ง'
    },
    'meditation': {
        id: 'meditation',
        title: '4. ทำสมาธิผ่อนคลาย 5 นาที',
        tag: 'จิตใจ & พักผ่อน',
        category: 'mind',
        rewardText: '+60 EXP • +25 เหรียญ',
        icon: '🧘‍♀️',
        condition: 'meditation_duration >= 300 วินาที (5 นาที)',
        detection: 'เปิดหน้า Timer นับถอยหลังครบ 5 นาที',
        currentVal: 0,
        targetVal: 5,
        unit: 'นาที',
        status: 'pending',
        exp: 60,
        coins: 25,
        tip: '💡 Tip: การทำสมาธิวันละ 5 นาที ช่วยลดระดับฮอร์โมนความเครียด (Cortisol) และเพิ่มสมาธิ'
    },
    'sleep': {
        id: 'sleep',
        title: '5. เข้านอนก่อนเวลา 23:00 น.',
        tag: 'จิตใจ & พักผ่อน',
        category: 'mind',
        rewardText: '+40 EXP • +15 เหรียญ',
        icon: '🌙',
        condition: 'sleep_start_time <= 23:00 น.',
        detection: 'กดปุ่มบันทึกเวลาเข้านอนก่อนเวลา 23:00 น.',
        currentVal: null,
        targetVal: '23:00',
        unit: '',
        status: 'pending',
        exp: 40,
        coins: 15,
        tip: '💡 Tip: การเข้านอนก่อน 23:00 น. ช่วยให้ร่างกายหลั่ง Growth Hormone ซ่อมแซมกล้ามเนื้อได้ดี'
    }
};

window.missionsDetailData = JSON.parse(JSON.stringify(window.defaultMissionsDetailData));

// รีเซ็ตสถานะทั้งหมดกลับเป็นค่าเริ่มต้นเมื่อ Logout
window.resetAppStateToDefaults = function() {
    // ยกเลิก Firestore listeners ที่ค้างอยู่
    if (window.firestoreUnsubscribers && window.firestoreUnsubscribers.length > 0) {
        window.firestoreUnsubscribers.forEach(unsub => {
            if (typeof unsub === 'function') {
                try { unsub(); } catch(e){}
            }
        });
        window.firestoreUnsubscribers = [];
    }

    window.currentUser = null;
    window.currentUserId = null;
    window.currentUserRole = 'user';
    window.userCoins = 0;
    window.totalAccumulatedEXP = 0;
    window.targetTDEEGoal = 2000;
    window.userProfileData = {
        name: 'FitHero Member',
        age: 28,
        gender: 'ชาย',
        height: 175,
        weight: 72,
        avatar: null
    };

    // รีเซ็ตภาพโปรไฟล์ใน DOM กลับเป็นค่าเริ่มต้นของระบบทันที ป้องกันรูปโปรไฟล์ตกค้างข้ามบัญชี
    const defaultAvatar = (typeof window.getUserAvatarUrl === 'function')
        ? window.getUserAvatarUrl(null, 'FitHero')
        : 'https://ui-avatars.com/api/?name=FitHero&background=4a7c59&color=ffffff&size=256&bold=true';
    document.querySelectorAll('.profile-avatar-img').forEach(img => {
        img.src = defaultAvatar;
    });
    document.querySelectorAll('.user-name-text').forEach(el => {
        el.innerText = 'FitHero Member';
    });

    window.missionsDetailData = JSON.parse(JSON.stringify(window.defaultMissionsDetailData));
    window.storeProductsData = JSON.parse(JSON.stringify(window.defaultStoreProducts));
    window.redemptionOrdersData = [];
    window.adminUsersList = [];
};


// ข้อมูลสถิติการวิ่งรายสัปดาห์
window.weeklyRunningData = [
    { day: 'วันจันทร์', dist: 2.5, pace: "6'20\"", time: '16 นาที', calories: 175, status: 'วอร์มอัพเบาๆ 🏃', note: 'วิ่งเรียกความฟิตช่วงเย็น รักษาสปีดได้อย่างผ่อนคลาย' },
    { day: 'วันอังคาร', dist: 5.0, pace: "6'05\"", time: '30 นาที', calories: 350, status: 'บรรลุเป้าหมาย 🎉', note: 'ทำระยะทางได้ตามแผน วิ่งเกาะกลุ่มความเร็วได้อย่างคงที่' },
    { day: 'วันพุธ', dist: 0.0, pace: "-", time: '0 นาที', calories: 0, status: 'วันพักวิ่ง (Rest Day) ☕', note: 'พักกล้ามเนื้อขา เปลี่ยนไปเดินผ่อนคลายและยืดเหยียด' },
    { day: 'วันพฤหัสบดี', dist: 7.5, pace: "5'52\"", time: '44 นาที', calories: 520, status: 'ระยะทางสูงสุดประจำสัปดาห์ 🏆', note: 'Tempo Run เยี่ยมมาก! รักษาสปีดได้อย่างสม่ำเสมอในโซนแอโรบิก' },
    { day: 'วันศุกร์', dist: 3.0, pace: "6'15\"", time: '19 นาที', calories: 210, status: 'Easy Run 🍃', note: 'วิ่งสบายๆ ปรับจังหวะการหายใจก่อนเข้าวันหยุด' },
    { day: 'วันเสาร์', dist: 0.0, pace: "-", time: '0 นาที', calories: 0, status: 'วันพักผ่อนเต็มที่ 😴', note: 'พักฟื้นร่างกายเพื่อเตรียมพร้อมสำหรับ Long Run วันอาทิตย์' },
    { day: 'วันอาทิตย์', dist: 6.0, pace: "6'10\"", time: '37 นาที', calories: 425, status: 'Long Run ส่งท้ายสัปดาห์ 🌳', note: 'วิ่งระยะไกลในสวนสาธารณะ อากาศสดชื่นและคุมฮาร์ทเรทได้ดี' }
];

// ข้อมูลสถิติก้าวเดินรายสัปดาห์
window.weeklyStepData = [
    { day: 'วันจันทร์', steps: 5000, distance: '3.6 กม.', calories: '220 kcal', status: 'เกือบถึงเป้าหมาย', note: 'เริ่มต้นสัปดาห์ได้ดี มีการเดินสั้นๆ ช่วงพักกลางวัน' },
    { day: 'วันอังคาร', steps: 6500, distance: '4.7 กม.', calories: '285 kcal', status: 'เกือบถึงเป้าหมาย', note: 'เดินสะสมก้าวเพิ่มขึ้นจากการเดินไปทำงาน' },
    { day: 'วันพุธ', steps: 8500, distance: '6.1 กม.', calories: '370 kcal', status: 'บรรลุเป้าหมาย 🎉', note: 'ทำได้ดีมาก! เดินครบเป้าหมายประจำวัน 8,000 ก้าว' },
    { day: 'วันพฤหัสบดี', steps: 9420, distance: '6.8 กม.', calories: '410 kcal', status: 'บรรลุเป้าหมาย (สูงสุด) 🏆', note: 'วันที่มีกิจกรรมก้าวเดินสูงสุดในสัปดาห์!' },
    { day: 'วันศุกร์', steps: 7100, distance: '5.1 กม.', calories: '310 kcal', status: 'เกือบถึงเป้าหมาย', note: 'รักษาระดับการเดินได้สม่ำเสมอตลอดทั้งวัน' },
    { day: 'วันเสาร์', steps: 4200, distance: '3.0 กม.', calories: '185 kcal', status: 'วันพักผ่อน ☕', note: 'เน้นการพักผ่อนและทำสมาธิผ่อนคลาย' },
    { day: 'วันอาทิตย์', steps: 8200, distance: '5.9 กม.', calories: '370 kcal', status: 'บรรลุเป้าหมาย 🎉', note: 'ส่งท้ายสัปดาห์ด้วยการเดินเล่นสวนสาธารณะยามเย็น' }
];
