/**
 * =========================================================================
 * FitHero - Firebase & Cloud Firestore Database Configuration
 * =========================================================================
 * ไฟล์นี้เป็นตัวเชื่อมต่อระหว่าง FitHero และฐานข้อมูล Cloud Firestore ของ Google Firebase
 *
 * วิธีใช้งาน:
 * 1. เข้าเว็บไซต์ https://console.firebase.google.com/
 * 2. สร้างโปรเจกต์ใหม่ (Create a project)
 * 3. เพิ่มเว็บแอป (Add app > Web </>)
 * 4. คัดลอกค่า firebaseConfig มาวางแทนที่ด้านล่างนี้
 *    (หรือสามารถคลิกที่ปุ่ม 'สถานะฐานข้อมูล' บนแถบด้านบนของแอปเพื่อวางคีย์ได้เช่นกัน)
 * =========================================================================
 */

// ค่าคอนฟิกเริ่มต้น (สามารถแก้ไขตรงนี้ หรือกรอกผ่านเมนูในหน้าเว็บได้)
let defaultFirebaseConfig = {
    apiKey: "AIzaSyA86BHAcYSyZ9VHveVwtoKrh9bUw0LKAN0",
    authDomain: "fithero-22da9.firebaseapp.com",
    projectId: "fithero-22da9",
    storageBucket: "fithero-22da9.firebasestorage.app",
    messagingSenderId: "695407332161",
    appId: "1:695407332161:web:59d90a6ffbb50547c72fc0"
};

// ตรวจสอบว่ามีค่าคอนฟิกที่บันทึกไว้ในเบราว์เซอร์หรือไม่
let savedConfigStr = localStorage.getItem('fithero_firebase_config');
let firebaseConfig = defaultFirebaseConfig;

if (savedConfigStr) {
    try {
        const parsed = JSON.parse(savedConfigStr);
        if (parsed && parsed.apiKey && parsed.apiKey !== "YOUR_API_KEY") {
            firebaseConfig = parsed;
        }
    } catch (e) {
        console.warn("ไม่สามารถอ่านคอนฟิก Firebase จาก LocalStorage ได้", e);
    }
}

let fbAuth = null;
let fbDb = null;
let isFbInitialized = false;

// ฟังก์ชันตรวจสอบว่าพร้อมใช้งาน Firebase จริงหรือไม่
function isFirebaseConfigured() {
    return firebaseConfig &&
           firebaseConfig.apiKey &&
           firebaseConfig.apiKey !== "YOUR_API_KEY" &&
           !firebaseConfig.apiKey.includes("YOUR_") &&
           firebaseConfig.projectId &&
           firebaseConfig.projectId !== "YOUR_PROJECT_ID";
}

// ฟังก์ชันเริ่มต้นระบบ Firebase
function initializeFitHeroFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK ยังไม่ได้ถูกโหลด");
        return false;
    }

    if (!isFirebaseConfigured()) {
        console.log("ℹ️ FitHero กำลังทำงานในโหมด Offline/LocalStorage (ยังไม่ได้กำหนดค่า Firebase Config)");
        return false;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        fbAuth = firebase.auth();
        fbDb = firebase.firestore();
        isFbInitialized = true;
        console.log("✅ เชื่อมต่อ Firebase และ Cloud Firestore สำเร็จ!");
        return true;
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase:", error);
        return false;
    }
}

// เริ่มต้นระบบทันทีเมื่อโหลดสคริปต์
if (typeof firebase !== 'undefined') {
    initializeFitHeroFirebase();
}

/**
 * =========================================================================
 * FitHero Database Service Functions (CRUD Operations)
 * =========================================================================
 */

// 1. สมัครสมาชิกด้วย Firebase Auth และสร้างเอกสารข้อมูลผู้ใช้ใน Cloud Firestore
async function dbRegisterUser(email, password, initialData) {
    if (!isFbInitialized || !fbAuth) {
        return { success: false, mode: 'local', message: 'Firebase ยังไม่ได้เชื่อมต่อ กำลังใช้งาน LocalStorage' };
    }

    try {
        const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // อัปเดต Display Name
        if (initialData.name) {
            await user.updateProfile({ displayName: initialData.name });
        }

        // เตรียมข้อมูลเริ่มต้นสำหรับผู้ใช้ใหม่ใน Firestore
        const userDocData = {
            uid: user.uid,
            email: email,
            name: initialData.name || email.split('@')[0],
            age: initialData.age || 28,
            gender: initialData.gender || 'ชาย',
            height: initialData.height || 175,
            weight: initialData.weight || 72,
            coins: initialData.coins !== undefined ? initialData.coins : 520,
            totalAccumulatedEXP: initialData.totalAccumulatedEXP !== undefined ? initialData.totalAccumulatedEXP : 2450,
            targetTDEEGoal: initialData.targetTDEEGoal || 2350,
            avatar: initialData.avatar || null,
            missions: initialData.missions || {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // บันทึกลงคอลเลกชัน 'users'
        await fbDb.collection('users').doc(user.uid).set(userDocData);

        return { success: true, user: user, data: userDocData };
    } catch (error) {
        console.error("Firebase Registration Error:", error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ';
        } else if (error.code === 'auth/weak-password') {
            msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        return { success: false, error: error, message: msg };
    }
}

// 2. เข้าสู่ระบบด้วย Firebase Auth และดึงข้อมูลผู้ใช้จาก Cloud Firestore
async function dbLoginUser(email, password) {
    if (!isFbInitialized || !fbAuth) {
        return { success: false, mode: 'local', message: 'Firebase ยังไม่ได้เชื่อมต่อ กำลังใช้งาน LocalStorage' };
    }

    try {
        const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // ดึงข้อมูลโปรไฟล์จาก Firestore
        const userDocRef = fbDb.collection('users').doc(user.uid);
        const docSnap = await userDocRef.get();

        let userData = null;
        if (docSnap.exists) {
            userData = docSnap.data();
            // อัปเดตเวลาเข้าใช้งานล่าสุด
            await userDocRef.update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // กรณีเอกสารยังไม่มี ให้สร้างขึ้นมาใหม่
            userData = {
                uid: user.uid,
                email: email,
                name: user.displayName || email.split('@')[0],
                age: 28,
                gender: 'ชาย',
                height: 175,
                weight: 72,
                coins: 520,
                totalAccumulatedEXP: 2450,
                targetTDEEGoal: 2350,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userDocRef.set(userData);
        }

        return { success: true, user: user, data: userData };
    } catch (error) {
        console.error("Firebase Login Error:", error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        return { success: false, error: error, message: msg };
    }
}

// 3. ออกจากระบบ
async function dbLogoutUser() {
    if (isFbInitialized && fbAuth) {
        try {
            await fbAuth.signOut();
        } catch (e) {
            console.warn("Logout error:", e);
        }
    }
}

// 4. บันทึก / อัปเดตข้อมูลผู้ใช้ (เหรียญ, EXP, ข้อมูลส่วนตัว, เป้าหมาย TDEE ฯลฯ)
async function dbSaveUserData(uid, dataToUpdate) {
    if (!isFbInitialized || !fbDb || !uid) return false;

    try {
        const updatePayload = {
            ...dataToUpdate,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('users').doc(uid).set(updatePayload, { merge: true });
        return true;
    } catch (error) {
        console.error("dbSaveUserData error:", error);
        return false;
    }
}

// 5. บันทึกประวัติกิจกรรม (Activity Log)
async function dbLogActivity(uid, activityData) {
    if (!isFbInitialized || !fbDb || !uid) return false;

    try {
        const payload = {
            ...activityData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('users').doc(uid).collection('activities').add(payload);
        return true;
    } catch (error) {
        console.error("dbLogActivity error:", error);
        return false;
    }
}

// 6. บันทึกประวัติการแลกของรางวัล (Reward Redemption)
async function dbLogRedemption(uid, redemptionData) {
    if (!isFbInitialized || !fbDb || !uid) return false;

    try {
        const payload = {
            ...redemptionData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('users').doc(uid).collection('redemptions').add(payload);
        return true;
    } catch (error) {
        console.error("dbLogRedemption error:", error);
        return false;
    }
}

// 7. Realtime Listener: ติดตามข้อมูลเอกสารผู้ใช้ปัจจุบัน
function dbListenUserDoc(uid, callback) {
    if (!isFbInitialized || !fbDb || !uid) return null;
    try {
        return fbDb.collection('users').doc(uid).onSnapshot(doc => {
            if (doc.exists) {
                callback(doc.data());
            }
        }, err => console.warn("dbListenUserDoc error:", err));
    } catch (e) {
        console.warn("dbListenUserDoc failed:", e);
        return null;
    }
}

// 8. Realtime Listener: ดึงรายชื่อผู้ใช้ทั้งหมดสำหรับ Admin Portal
function dbListenAllUsers(callback) {
    if (!isFbInitialized || !fbDb) return null;
    try {
        return fbDb.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            callback(users);
        }, err => {
            // fallback หากยังไม่ได้สร้าง index หรือ error
            fbDb.collection('users').onSnapshot(snap => {
                const users = [];
                snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
                callback(users);
            }, e => console.warn("dbListenAllUsers fallback error:", e));
        });
    } catch (e) {
        console.warn("dbListenAllUsers failed:", e);
        return null;
    }
}

// 9. Admin ปรับเหรียญผู้ใช้ลง Firestore
async function dbAdjustUserCoins(uid, amount) {
    if (!isFbInitialized || !fbDb || !uid) return false;
    try {
        const userRef = fbDb.collection('users').doc(uid);
        await fbDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return;
            const currentCoins = userDoc.data().coins || 0;
            const newCoins = Math.max(0, currentCoins + amount);
            transaction.update(userRef, { 
                coins: newCoins,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        return true;
    } catch (error) {
        console.error("dbAdjustUserCoins error:", error);
        return false;
    }
}

// 10. Admin ลบเอกสารผู้ใช้
async function dbDeleteUserDoc(uid) {
    if (!isFbInitialized || !fbDb || !uid) return false;
    try {
        await fbDb.collection('users').doc(uid).delete();
        return true;
    } catch (error) {
        console.error("dbDeleteUserDoc error:", error);
        return false;
    }
}

// 11. Realtime Listener: ดึงสินค้าในร้านค้าทั้งหมด (Products)
function dbListenProducts(callback) {
    if (!isFbInitialized || !fbDb) return null;
    try {
        return fbDb.collection('products').onSnapshot(async snapshot => {
            if (snapshot.empty) {
                // ถ้ายังไม่มีสินค้าใน Firestore ให้ทำการ Seed สินค้าเริ่มต้นอัตโนมัติ
                if (typeof window !== 'undefined' && window.defaultStoreProducts) {
                    for (const p of window.defaultStoreProducts) {
                        await fbDb.collection('products').doc(p.id).set({
                            ...p,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                return;
            }
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            callback(products);
        }, err => console.warn("dbListenProducts error:", err));
    } catch (e) {
        console.warn("dbListenProducts failed:", e);
        return null;
    }
}

// 12. Admin บันทึก/แก้ไขสินค้าลง Firestore
async function dbSaveProduct(productData) {
    if (!isFbInitialized || !fbDb || !productData.id) return false;
    try {
        const payload = {
            ...productData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('products').doc(productData.id).set(payload, { merge: true });
        return true;
    } catch (error) {
        console.error("dbSaveProduct error:", error);
        return false;
    }
}

// 13. Admin ลบสินค้าจาก Firestore
async function dbDeleteProduct(productId) {
    if (!isFbInitialized || !fbDb || !productId) return false;
    try {
        await fbDb.collection('products').doc(productId).delete();
        return true;
    } catch (error) {
        console.error("dbDeleteProduct error:", error);
        return false;
    }
}

// 14. Realtime Listener: ดึงภารกิจทั้งหมด (Missions)
function dbListenMissions(callback) {
    if (!isFbInitialized || !fbDb) return null;
    try {
        return fbDb.collection('missions').onSnapshot(async snapshot => {
            if (snapshot.empty) {
                // ถ้ายังไม่มีภารกิจใน Firestore ให้ Seed ภารกิจเริ่มต้นอัตโนมัติ
                if (typeof window !== 'undefined' && window.defaultMissionsDetailData) {
                    for (const k in window.defaultMissionsDetailData) {
                        const m = window.defaultMissionsDetailData[k];
                        await fbDb.collection('missions').doc(m.id).set({
                            ...m,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                return;
            }
            const missions = {};
            snapshot.forEach(doc => {
                missions[doc.id] = { id: doc.id, ...doc.data() };
            });
            callback(missions);
        }, err => console.warn("dbListenMissions error:", err));
    } catch (e) {
        console.warn("dbListenMissions failed:", e);
        return null;
    }
}

// 15. Admin บันทึก/แก้ไขภารกิจลง Firestore
async function dbSaveMission(missionData) {
    if (!isFbInitialized || !fbDb || !missionData.id) return false;
    try {
        const payload = {
            ...missionData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('missions').doc(missionData.id).set(payload, { merge: true });
        return true;
    } catch (error) {
        console.error("dbSaveMission error:", error);
        return false;
    }
}

// 16. Admin ลบภารกิจจาก Firestore
async function dbDeleteMission(missionId) {
    if (!isFbInitialized || !fbDb || !missionId) return false;
    try {
        await fbDb.collection('missions').doc(missionId).delete();
        return true;
    } catch (error) {
        console.error("dbDeleteMission error:", error);
        return false;
    }
}

// 17. Realtime Listener: คำขอแลกของรางวัลทั้งหมด (Orders)
function dbListenOrders(callback) {
    if (!isFbInitialized || !fbDb) return null;
    try {
        return fbDb.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            callback(orders);
        }, err => {
            fbDb.collection('orders').onSnapshot(snap => {
                const orders = [];
                snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
                // เรียงตาม date
                orders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                callback(orders);
            }, e => console.warn("dbListenOrders fallback error:", e));
        });
    } catch (e) {
        console.warn("dbListenOrders failed:", e);
        return null;
    }
}

// 18. สร้างคำขอแลกของรางวัลใหม่ใน Firestore
async function dbCreateOrder(orderData) {
    if (!isFbInitialized || !fbDb) return false;
    try {
        const payload = {
            ...orderData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await fbDb.collection('orders').doc(orderData.id).set(payload);
        return true;
    } catch (error) {
        console.error("dbCreateOrder error:", error);
        return false;
    }
}

// 19. อัปเดตสถานะคำขอแลกรางวัล
async function dbUpdateOrderStatus(orderId, status) {
    if (!isFbInitialized || !fbDb || !orderId) return false;
    try {
        await fbDb.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("dbUpdateOrderStatus error:", error);
        return false;
    }
}

// 20. ลบคำขอแลกของรางวัล
async function dbDeleteOrder(orderId) {
    if (!isFbInitialized || !fbDb || !orderId) return false;
    try {
        await fbDb.collection('orders').doc(orderId).delete();
        return true;
    } catch (error) {
        console.error("dbDeleteOrder error:", error);
        return false;
    }
}

// 21. แลกของรางวัลแบบ Atomic Transaction (ตัดเหรียญ + ตัดสต็อก + สร้างคำสั่งซื้อ)
async function dbRedeemProductTransaction(uid, productId, qty, totalCost, orderPayload) {
    if (!isFbInitialized || !fbDb || !uid || !productId) {
        return { success: false, message: 'ฐานข้อมูลยังไม่พร้อมใช้งาน' };
    }

    try {
        const userRef = fbDb.collection('users').doc(uid);
        const productRef = fbDb.collection('products').doc(productId);
        const orderRef = fbDb.collection('orders').doc(orderPayload.id);

        const result = await fbDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('ไม่พบข้อมูลผู้ใช้ในระบบ');
            }

            const currentCoins = userDoc.data().coins || 0;
            if (currentCoins < totalCost) {
                throw new Error(`เหรียญสะสมไม่เพียงพอ (ต้องการ ${totalCost.toLocaleString()} เหรียญ แต่มี ${currentCoins.toLocaleString()} เหรียญ)`);
            }

            const prodDoc = await transaction.get(productRef);
            if (!prodDoc.exists) {
                throw new Error('ไม่พบสินค้าที่เลือกในระบบ');
            }

            const currentStock = prodDoc.data().stock || 0;
            if (currentStock < qty) {
                throw new Error(`สินค้าคงเหลือไม่เพียงพอ (เหลือเพียง ${currentStock} ชิ้น)`);
            }

            // 1. ตัดเหรียญ
            const newCoins = currentCoins - totalCost;
            transaction.update(userRef, {
                coins: newCoins,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. ตัดสต็อก
            const newStock = currentStock - qty;
            transaction.update(productRef, {
                stock: newStock,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 3. สร้างคำสั่งซื้อ
            transaction.set(orderRef, {
                ...orderPayload,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { newCoins, newStock };
        });

        return { success: true, ...result };
    } catch (error) {
        console.error("dbRedeemProductTransaction error:", error);
        return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการทำรายการแลกของรางวัล' };
    }
}


