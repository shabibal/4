// Webaidea Platform - JavaScript with Google Sheets Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbwC6ZSTDDN-cEv8ltjonYrTUwJCPkXKDRYITFP24qBcenPN46hZKRs2XE1rmRJvw7X3Jw/exec';

// متغيرات عامة
let users = [];
let products = [];
let currentUser = null;
let isAdminLoggedIn = false;

// تهيئة الموقع عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تهيئة موقع ويب أيديا...');
    
    // تحميل البيانات المحلية
    loadLocalData();
    
    // إعداد الأحداث
    setupEventListeners();
    
    // عرض البيانات
    updateUI();
    
    console.log('✅ تم تهيئة الموقع بنجاح');
});

// تحميل البيانات المحلية
function loadLocalData() {
    try {
        users = JSON.parse(localStorage.getItem('webaidea_users')) || [];
        products = JSON.parse(localStorage.getItem('webaidea_products')) || [];
        currentUser = JSON.parse(localStorage.getItem('webaidea_currentUser')) || null;
        isAdminLoggedIn = JSON.parse(localStorage.getItem('webaidea_adminLoggedIn')) || false;
        
        console.log('📥 البيانات المحلية:', { 
            currentUser: currentUser ? currentUser.email : 'لا يوجد',
            usersCount: users.length
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات المحلية:', error);
    }
}

// تحديث واجهة المستخدم
function updateUI() {
    const loginBtn = document.querySelector('.login-btn');
    
    if (currentUser) {
        // حالة: مستخدم مسجل دخوله
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
            loginBtn.onclick = function() {
                alert(`👤 ${currentUser.name}\n📧 ${currentUser.email}\n🎫 ${currentUser.type === 'merchant' ? 'تاجر' : 'مستخدم'}`);
            };
        }
    } else {
        // حالة: زائر غير مسجل
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> تسجيل دخول`;
            loginBtn.onclick = function(e) {
                e.preventDefault();
                openAuthModal();
            };
        }
    }
}

// فتح نافذة المصادقة
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('email').focus();
    
    // التأكد من أننا في وضع الدخول الافتراضي
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn.textContent !== 'دخول') {
        switchAuthMode();
    }
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authForm').reset();
}

// التبديل بين وضعي الدخول والتسجيل
function switchAuthMode() {
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const nameField = document.getElementById('nameField');
    
    if (submitBtn.textContent === 'دخول') {
        // التبديل إلى وضع التسجيل
        title.textContent = 'انشاء حساب جديد';
        submitBtn.textContent = 'تسجيل';
        switchText.textContent = 'لديك حساب بالفعل؟';
        switchLink.textContent = 'تسجيل الدخول';
        nameField.style.display = 'block';
    } else {
        // التبديل إلى وضع الدخول
        title.textContent = 'تسجيل الدخول';
        submitBtn.textContent = 'دخول';
        switchText.textContent = 'ليس لديك حساب؟';
        switchLink.textContent = 'انشاء حساب جديد';
        nameField.style.display = 'none';
    }
}

// ==================== دالة المصادقة الرئيسية ====================
async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const name = document.getElementById('name')?.value.trim() || '';
    const isLoginMode = document.getElementById('submitBtn').textContent === 'دخول';
    
    if (!email || !password) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (!isLoginMode && !name) {
        alert('⚠️ يرجى إدخال الاسم الكامل');
        return;
    }
    
    try {
        // ========== 1. محاولة دخول كمدير ==========
        if (email === 'msdfrrt@gmail.com' && password === 'Shabib95873061@99') {
            console.log('👑 دخول كمدير النظام');
            
            currentUser = {
                id: "0",
                name: 'Administrator',
                email: email,
                password: password,
                type: 'admin',
                joinDate: new Date().toISOString().split('T')[0]
            };
            
            isAdminLoggedIn = true;
            
            // حفظ في التخزين المحلي
            localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
            localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(true));
            
            // تحديث الواجهة
            updateUI();
            
            closeModal();
            alert('🎉 مرحباً بك في لوحة تحكم الإدارة!');
            return;
        }
        
        if (isLoginMode) {
            // ========== 2. تسجيل الدخول ==========
            console.log('🔐 محاولة تسجيل دخول:', email);
            
            // البحث في localStorage أولاً
            let user = findUserInStorage(email, password);
            
            if (user) {
                // ✅ وجد المستخدم في localStorage
                console.log('✅ تسجيل دخول ناجح من localStorage');
                currentUser = user;
                isAdminLoggedIn = user.type === 'admin';
                
                // حفظ في التخزين المحلي
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
                
                updateUI();
                closeModal();
                alert(`🎉 مرحباً بعودتك ${user.name}!`);
                return;
            }
            
            // ⭐⭐ محاولة تسجيل الدخول من السيرفر
            console.log('🔄 محاولة تسجيل الدخول من السيرفر...');
            
            try {
                const response = await fetchData('login', { 
                    email: email, 
                    password: password 
                });
                
                console.log('استجابة السيرفر:', response);
                
                if (response.status === 200) {
                    user = response.data;
                    console.log('✅ تسجيل دخول ناجح من السيرفر:', user);
                    
                    // إضافة كلمة المرور إلى بيانات المستخدم
                    user.password = password;
                    
                    // حفظ المستخدم في localStorage
                    saveUserToStorage(user);
                    
                    currentUser = user;
                    isAdminLoggedIn = user.type === 'admin';
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
                    
                    updateUI();
                    closeModal();
                    alert(`🎉 مرحباً بعودتك ${user.name}!`);
                    
                } else {
                    alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في الاتصال بالسيرفر:', serverError);
                alert('⚠️ مشكلة في الاتصال بالسيرفر. تأكد من البيانات المحلية.');
            }
            
        } else {
            // ========== 3. إنشاء حساب جديد ==========
            console.log('📝 محاولة إنشاء حساب:', { name, email });
            
            // التحقق من عدم وجود الحساب في localStorage
            if (checkIfEmailExists(email)) {
                alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً');
                return;
            }
            
            // ⭐⭐ محاولة التسجيل في السيرفر
            console.log('🔄 محاولة تسجيل في السيرفر...');
            
            try {
                const response = await fetchData('register', { 
                    name: name, 
                    email: email, 
                    password: password 
                });
                
                console.log('استجابة السيرفر:', response);
                
                if (response.status === 201) {
                    const newUser = response.data;
                    console.log('✅ تم إنشاء حساب جديد في السيرفر:', newUser);
                    
                    // إضافة كلمة المرور إلى بيانات المستخدم
                    newUser.password = password;
                    
                    // حفظ المستخدم في localStorage
                    saveUserToStorage(newUser);
                    
                    currentUser = newUser;
                    isAdminLoggedIn = false;
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
                    
                    updateUI();
                    closeModal();
                    alert(`🎉 تم إنشاء حسابك بنجاح ${name}!\n\n✅ يمكنك تسجيل الدخول الآن.`);
                    
                } else if (response.status === 409) {
                    alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً في السيرفر');
                } else {
                    alert(`❌ ${response.message || 'فشل إنشاء الحساب في السيرفر'}`);
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في السيرفر، إنشاء حساب محلي:', serverError);
                
                // ⭐⭐ إنشاء حساب محلي
                const newId = generateNewUserId();
                const newUser = {
                    id: String(newId),
                    name: name,
                    email: email,
                    password: password,
                    type: 'user',
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                // حفظ المستخدم في localStorage
                saveUserToStorage(newUser);
                
                currentUser = newUser;
                isAdminLoggedIn = false;
                
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
                
                updateUI();
                closeModal();
                alert(`🎉 تم إنشاء حسابك بنجاح ${name}! (محلياً)\n\n✅ يمكنك تسجيل الدخول الآن.`);
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ غير متوقع:', error);
        alert('⚠️ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    }
}

// ==================== وظائف مساعدة ====================

// البحث عن مستخدم في localStorage
function findUserInStorage(email, password) {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        if (!storedUsers) return null;
        
        const users = JSON.parse(storedUsers);
        return users.find(u => u.email === email && u.password === password);
    } catch (error) {
        return null;
    }
}

// التحقق من وجود البريد الإلكتروني
function checkIfEmailExists(email) {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        if (!storedUsers) return false;
        
        const users = JSON.parse(storedUsers);
        return users.some(u => u.email === email);
    } catch (error) {
        return false;
    }
}

// حفظ مستخدم في localStorage
function saveUserToStorage(user) {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        let users = storedUsers ? JSON.parse(storedUsers) : [];
        
        // إزالة المستخدم إذا كان موجوداً مسبقاً
        users = users.filter(u => u.id !== user.id && u.email !== user.email);
        
        // إضافة المستخدم الجديد
        users.push(user);
        
        localStorage.setItem('webaidea_users', JSON.stringify(users));
        return users;
    } catch (error) {
        console.error('❌ خطأ في حفظ المستخدم:', error);
        return [];
    }
}

// إنشاء ID جديد
function generateNewUserId() {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        if (!storedUsers) return 100;
        
        const users = JSON.parse(storedUsers);
        if (users.length === 0) return 100;
        
        const maxId = Math.max(...users.map(u => parseInt(u.id) || 0));
        return maxId + 1;
    } catch (error) {
        return Date.now();
    }
}

// دالة للاتصال بالAPI
async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }
    
    try {
        const response = await fetch(url.toString(), {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error(`❌ خطأ في طلب ${action}:`, error);
        throw error;
    }
}

console.log('🎯 جاهز للاستخدام!');