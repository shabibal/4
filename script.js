// Webaidea Platform - JavaScript with Google Sheets Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbwC6ZSTDDN-cEv8ltjonYrTUwJCPkXKDRYITFP24qBcenPN46hZKRs2XE1rmRJvw7X3Jw/exec';

// متغيرات عامة
let users = [];
let products = [];
let currentUser = null;
let isAdminLoggedIn = false;
let selectedImageData = null;
let dataInitialized = false;

// تهيئة الموقع عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 تهيئة موقع ويب أيديا...');
    
    // تحميل البيانات المحلية
    loadLocalData();
    
    // تهيئة البيانات التجريبية مرة واحدة فقط
    if (!dataInitialized && users.length === 0 && products.length === 0) {
        initSampleData();
        dataInitialized = true;
    }
    
    // إعداد الأحداث
    setupEventListeners();
    
    // تحميل البيانات من السيرفر (في الخلفية)
    setTimeout(async () => {
        try {
            await loadDataFromServer();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }, 1000);
    
    // عرض البيانات
    renderProducts();
    updateUI();
    
    console.log('✅ تم تهيئة الموقع بنجاح');
});

// تحميل البيانات المحلية من localStorage
function loadLocalData() {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        const storedProducts = localStorage.getItem('webaidea_products');
        const storedCurrentUser = localStorage.getItem('webaidea_currentUser');
        const storedAdmin = localStorage.getItem('webaidea_adminLoggedIn');
        
        users = storedUsers ? JSON.parse(storedUsers) : [];
        products = storedProducts ? JSON.parse(storedProducts) : [];
        currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : null;
        isAdminLoggedIn = storedAdmin ? JSON.parse(storedAdmin) : false;
        
        console.log('📥 البيانات المحلية:', { 
            users: users.length, 
            products: products.length,
            currentUser: currentUser ? currentUser.email : 'لا يوجد',
            isAdminLoggedIn 
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات المحلية:', error);
        users = [];
        products = [];
        currentUser = null;
        isAdminLoggedIn = false;
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر تسجيل الدخول في الشريط
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    }
}

// تحديث واجهة المستخدم بناءً على حالة الدخول
function updateUI() {
    const loginBtn = document.querySelector('.login-btn');
    const adminBtn = document.getElementById('adminLoginTrigger');
    
    if (isAdminLoggedIn && currentUser && currentUser.type === 'admin') {
        // حالة: مدير مسجل دخوله
        if (loginBtn) loginBtn.style.display = 'none';
        if (adminBtn) {
            adminBtn.style.display = 'flex';
            adminBtn.innerHTML = `<i class="fas fa-cogs"></i> الإدارة`;
        }
        showAdminPanel();
    } else if (currentUser) {
        // حالة: مستخدم عادي مسجل دخوله
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
            loginBtn.onclick = function() {
                showUserOptions();
            };
        }
        if (adminBtn) adminBtn.style.display = 'none';
        
        // عرض زر نشر الإعلان إذا كان المستخدم تاجراً
        if (currentUser.type === 'merchant') {
            showMerchantPostButton();
        }
        
        showMainSite();
    } else {
        // حالة: زائر غير مسجل
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> تسجيل دخول`;
            loginBtn.onclick = function(e) {
                e.preventDefault();
                openAuthModal();
            };
        }
        if (adminBtn) adminBtn.style.display = 'none';
        showMainSite();
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
    selectedImageData = null;
    
    // إعادة تعيين معاينة الصورة
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
            <p style="color: #999; margin-top: 10px;">لم يتم اختيار صورة</p>
        `;
    }
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

// ==================== دالة المصادقة الرئيسية المُصَحَّحة ====================
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
            // ========== 2. تسجيل الدخول العادي ==========
            console.log('🔐 محاولة تسجيل دخول:', email);
            
            // البحث أولاً في البيانات المحلية
            let user = findUserInLocalStorage(email, password);
            
            if (user) {
                // ✅ وجد المستخدم في البيانات المحلية
                console.log('✅ تسجيل دخول ناجح من البيانات المحلية:', user);
                currentUser = user;
                isAdminLoggedIn = user.type === 'admin';
                
                // حفظ في التخزين المحلي
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
                
                // تحديث الواجهة
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
                
                console.log('استجابة السيرفر لتسجيل الدخول:', response);
                
                if (response.status === 200) {
                    user = response.data;
                    console.log('✅ تسجيل دخول ناجح من السيرفر:', user);
                    
                    // إضافة كلمة المرور إلى بيانات المستخدم
                    user.password = password;
                    
                    // حفظ المستخدم في البيانات المحلية
                    saveUserToLocalStorage(user);
                    
                    currentUser = user;
                    isAdminLoggedIn = user.type === 'admin';
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
                    
                    updateUI();
                    closeModal();
                    alert(`🎉 مرحباً بعودتك ${user.name}!`);
                    
                } else if (response.status === 401) {
                    // إذا كانت بيانات الدخول غير صحيحة
                    alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
                } else {
                    alert(`❌ خطأ في الخادم: ${response.message || 'حاول مرة أخرى'}`);
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في الاتصال بالسيرفر:', serverError);
                
                // الحل النهائي: البحث في جميع البيانات المحلية المخزنة
                const foundUser = findUserInAllLocalData(email, password);
                
                if (foundUser) {
                    currentUser = foundUser;
                    isAdminLoggedIn = foundUser.type === 'admin';
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
                    
                    updateUI();
                    closeModal();
                    alert(`🎉 مرحباً بعودتك ${foundUser.name}! (اتصال محلي)`);
                } else {
                    alert(`❌ البريد الإلكتروني أو كلمة المرور غير صحيحة\n\nℹ️ إذا نسيت كلمة المرور، جرب إنشاء حساب جديد.`);
                }
            }
            
        } else {
            // ========== 3. إنشاء حساب جديد ==========
            console.log('📝 محاولة إنشاء حساب:', { name, email });
            
            // التحقق من عدم وجود الحساب محلياً
            if (checkIfUserExistsLocally(email)) {
                alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً في البيانات المحلية');
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
                
                console.log('استجابة السيرفر للتسجيل:', response);
                
                if (response.status === 201) {
                    const newUser = response.data;
                    console.log('✅ تم إنشاء حساب جديد في السيرفر:', newUser);
                    
                    // إضافة كلمة المرور إلى بيانات المستخدم
                    newUser.password = password;
                    
                    // إضافة إلى البيانات المحلية
                    saveUserToLocalStorage(newUser);
                    
                    currentUser = newUser;
                    isAdminLoggedIn = false;
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
                    
                    // تحديث الواجهة
                    updateUI();
                    
                    closeModal();
                    alert(`🎉 تم إنشاء حسابك بنجاح ${name}!\n\n✅ يمكنك تسجيل الدخول الآن.\n\n⚠️ ملاحظة: تواصل مع الإدارة عبر الإنستجرام لطلب ترقية حسابك إلى تاجر.`);
                    
                } else if (response.status === 409) {
                    alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً في السيرفر');
                } else {
                    alert(`❌ ${response.message || 'فشل إنشاء الحساب في السيرفر'}`);
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في السيرفر، إنشاء حساب محلي:', serverError);
                
                // ⭐⭐ حل بديل: إنشاء حساب محلي
                if (confirm('⚠️ مشكلة في الاتصال بالسيرفر. هل تريد إنشاء حساب محلياً؟\n\n(البيانات ستكون محلية فقط حتى يتم الاتصال بالسيرفر)')) {
                    
                    const newId = generateNewUserId();
                    const newUser = {
                        id: String(newId),
                        name: name,
                        email: email,
                        password: password,
                        type: 'user',
                        joinDate: new Date().toISOString().split('T')[0]
                    };
                    
                    // إضافة إلى البيانات المحلية
                    saveUserToLocalStorage(newUser);
                    
                    currentUser = newUser;
                    isAdminLoggedIn = false;
                    
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
                    
                    // تحديث الواجهة
                    updateUI();
                    
                    closeModal();
                    alert(`🎉 تم إنشاء حسابك بنجاح ${name}! (محلياً)\n\n✅ يمكنك تسجيل الدخول الآن باستخدام نفس البيانات.\n\n⚠️ ملاحظة: تواصل مع الإدارة عبر الإنستجرام لطلب ترقية حسابك إلى تاجر.`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ غير متوقع في المصادقة:', error);
        alert('⚠️ حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو تحديث الصفحة.');
    }
}

// ==================== وظائف مساعدة للمصادقة ====================

// البحث عن مستخدم في localStorage
function findUserInLocalStorage(email, password) {
    const storedUsers = localStorage.getItem('webaidea_users');
    if (!storedUsers) return null;
    
    const users = JSON.parse(storedUsers);
    return users.find(u => 
        u.email && u.email.toString().trim() === email.toString().trim() && 
        u.password && u.password.toString().trim() === password.toString().trim()
    );
}

// البحث في جميع البيانات المحلية
function findUserInAllLocalData(email, password) {
    // التحقق من currentUser أولاً
    const currentUserStr = localStorage.getItem('webaidea_currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.email === email && currentUser.password === password) {
            return currentUser;
        }
    }
    
    // البحث في users
    return findUserInLocalStorage(email, password);
}

// التحقق من وجود المستخدم محلياً
function checkIfUserExistsLocally(email) {
    const storedUsers = localStorage.getItem('webaidea_users');
    if (!storedUsers) return false;
    
    const users = JSON.parse(storedUsers);
    return users.some(u => u.email && u.email.toString().trim() === email.toString().trim());
}

// حفظ مستخدم في localStorage
function saveUserToLocalStorage(user) {
    const storedUsers = localStorage.getItem('webaidea_users');
    let users = storedUsers ? JSON.parse(storedUsers) : [];
    
    // التحقق من عدم وجود مكرر
    const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (existingIndex !== -1) {
        users[existingIndex] = user;
    } else {
        users.push(user);
    }
    
    localStorage.setItem('webaidea_users', JSON.stringify(users));
    return users;
}

// إنشاء ID جديد
function generateNewUserId() {
    const storedUsers = localStorage.getItem('webaidea_users');
    if (!storedUsers) return 1;
    
    const users = JSON.parse(storedUsers);
    if (users.length === 0) return 1;
    
    const maxId = Math.max(...users.map(u => parseInt(u.id) || 0));
    return maxId + 1;
}

// دالة مساعدة للاتصال بالAPI
async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }
    
    try {
        console.log(`🌐 طلب API: ${action}`, params);
        
        const response = await fetch(url.toString(), {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error(`❌ خطأ في طلب ${action}:`, error);
        throw new Error('انتهت مهلة الاتصال. يرجى التحقق من اتصال الإنترنت.');
    }
}

// دالة مساعدة للاتصال بالAPI (POST)
async function postData(action, params = {}) {
    return fetchData(action, params);
}

// تحميل البيانات من السيرفر
async function loadDataFromServer() {
    try {
        console.log('🔄 جاري تحميل البيانات من السيرفر...');
        
        const [productsResponse, usersResponse] = await Promise.allSettled([
            fetchData('getProducts'),
            fetchData('getUsers')
        ]);
        
        // معالجة استجابة المنتجات
        if (productsResponse.status === 'fulfilled' && productsResponse.value.status === 200) {
            products = productsResponse.value.data || [];
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            console.log(`✅ تم تحميل ${products.length} منتج من السيرفر`);
        } else {
            console.warn('⚠️ لم يتم تحميل المنتجات من السيرفر، استخدام البيانات المحلية');
        }
        
        // معالجة استجابة المستخدمين
        if (usersResponse.status === 'fulfilled' && usersResponse.value.status === 200) {
            users = usersResponse.value.data || [];
            localStorage.setItem('webaidea_users', JSON.stringify(users));
            console.log(`✅ تم تحميل ${users.length} مستخدم من السيرفر`);
        } else {
            console.warn('⚠️ لم يتم تحميل المستخدمين من السيرفر، استخدام البيانات المحلية');
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من السيرفر:', error);
    }
}

// ==================== وظائف المنتجات ====================

// عرض المنتجات في الصفحة الرئيسية
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 1rem; color: #ccc;"></i>
                <h3>لا توجد منتجات حالياً</h3>
                <p>كن أول من يعرض منتجاته على المنصة!</p>
                ${!currentUser ? `
                    <a href="javascript:void(0);" class="btn btn-primary" onclick="openAuthModal()" style="margin-top: 1rem;">
                        <i class="fas fa-user-plus"></i> سجل الآن لعرض منتجاتك
                    </a>
                ` : ''}
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const merchant = users.find(u => u.id == product.merchantId);
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // إذا كان المنتج مميزاً
        if (product.featured) {
            card.style.border = '2px solid #ffb300';
            card.style.position = 'relative';
            card.innerHTML = `<div class="special-badge"><i class="fas fa-crown"></i> مميز</div>`;
        }
        
        card.innerHTML += `
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.title || 'منتج'}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+Loading'">
                ${product.featured ? `<div class="featured-overlay"><i class="fas fa-star"></i> مميز</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title || 'بدون عنوان'}</h3>
                <p class="product-description">
                    ${(product.description || '').substring(0, 80)}
                    ${product.description && product.description.length > 80 ? '...' : ''}
                </p>
                <div class="product-meta">
                    <div>
                        <div class="product-price">${product.price || 0} ريال</div>
                        <div class="product-merchant">
                            <i class="fas fa-user"></i> ${merchant ? merchant.name : 'تاجر'}
                        </div>
                    </div>
                    <div class="product-date" style="font-size: 0.8rem; color: #666;">
                        <i class="fas fa-calendar"></i> ${product.date || ''}
                    </div>
                </div>
                <button class="view-btn" onclick="showProductDetail(${product.id})">
                    <i class="fas fa-eye"></i> عرض التفاصيل
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// تهيئة البيانات التجريبية
function initSampleData() {
    console.log('📝 إنشاء بيانات تجريبية...');
    
    if (users.length === 0) {
        users = [
            {
                id: "1",
                name: "أحمد العماني",
                email: "ahmed@example.com",
                password: "123456",
                type: "merchant",
                joinDate: "2023-10-01"
            }
        ];
        localStorage.setItem('webaidea_users', JSON.stringify(users));
        console.log('✅ تم إنشاء بيانات تجريبية');
    }
}

// ==================== وظائف الإدارة ====================

// عرض لوحة الإدارة
function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    adminPanel.style.display = 'block';
    
    // إخفاء أقسام الموقع العادي
    const sectionsToHide = ['.hero', '.products-section', '.how-section', '.footer', '.navbar'];
    sectionsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = 'none';
    });
}

// إخفاء لوحة الإدارة وعرض الموقع العادي
function showMainSite() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
    
    // إظهار أقسام الموقع العادي
    const sectionsToShow = ['.hero', '.products-section', '.how-section', '.footer', '.navbar'];
    sectionsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = '';
    });
}

// العودة للقائمة الرئيسية (زر الرجوع الجديد)
function goToMainSite() {
    if (confirm('هل تريد العودة للقائمة الرئيسية؟')) {
        logoutAdmin();
    }
}

// تسجيل خروج المدير
function logoutAdmin() {
    isAdminLoggedIn = false;
    localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
    
    // إعادة تعيين حالة المستخدم إذا كان مديراً
    if (currentUser && currentUser.type === 'admin') {
        currentUser = null;
        localStorage.removeItem('webaidea_currentUser');
    }
    
    showMainSite();
    updateUI();
    
    alert('✅ تم تسجيل الخروج من لوحة الإدارة.');
}

console.log('🎯 جاهز للاستخدام!');
console.log('🔑 بيانات المدير:', 'msdfrrt@gmail.com / Shabib95873061@99');