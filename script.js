// Webaidea Platform - JavaScript with Google Sheets Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbwC6ZSTDDN-cEv8ltjonYrTUwJCPkXKDRYITFP24qBcenPN46hZKRs2XE1rmRJvw7X3Jw/exec';

// متغيرات عامة
let users = [];
let products = [];
let currentUser = null;
let isAdminLoggedIn = false;
let selectedImageData = null;

// تهيئة الموقع عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 تهيئة موقع ويب أيديا...');
    
    // تحميل البيانات المحلية
    loadLocalData();
    
    // إعداد الأحداث
    setupEventListeners();
    
    // تحميل البيانات من السيرفر
    await loadDataFromServer();
    
    // عرض البيانات
    renderProducts();
    updateUI();
    
    console.log('✅ تم تهيئة الموقع بنجاح');
});

// تحميل البيانات المحلية من localStorage
function loadLocalData() {
    try {
        users = JSON.parse(localStorage.getItem('webaidea_users')) || [];
        products = JSON.parse(localStorage.getItem('webaidea_products')) || [];
        currentUser = JSON.parse(localStorage.getItem('webaidea_currentUser')) || null;
        isAdminLoggedIn = JSON.parse(localStorage.getItem('webaidea_adminLoggedIn')) || false;
        
        console.log('📥 البيانات المحلية:', { 
            users: users.length, 
            products: products.length,
            currentUser: currentUser ? currentUser.name : 'لا يوجد',
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
    
    // زر دخول الإدارة
    const adminBtn = document.getElementById('adminLoginTrigger');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    }
    
    console.log('✅ تم إعداد مستمعي الأحداث');
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
                alert(`مرحباً ${currentUser.name}!\n\nالحساب: ${currentUser.email}\nالنوع: ${currentUser.type === 'merchant' ? 'تاجر' : 'مستخدم'}`);
            };
        }
        if (adminBtn) adminBtn.style.display = 'none';
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
        
        // تحديث جداول الإدارة إذا كانت مفتوحة
        if (isAdminLoggedIn) {
            renderMerchantsTable();
            renderAccountsTable();
            renderAdsTable();
            populateMerchantSelect();
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من السيرفر:', error);
    }
}

// دالة مساعدة للاتصال بالAPI (GET)
async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }
    
    try {
        console.log(`🌐 طلب API: ${action}`, params);
        const response = await fetch(url.toString());
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ خطأ في طلب ${action}:`, error);
        throw error;
    }
}

// دالة مساعدة للاتصال بالAPI (POST) - تم التعديل
async function postData(action, params = {}) {
    try {
        console.log(`📤 إرسال بيانات: ${action}`, params);
        
        const requestData = {
            action: action,
            ...params
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ خطأ في إرسال ${action}:`, error);
        throw error;
    }
}

// ==================== وظائف المصادقة ====================

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

// معالجة المصادقة (تسجيل دخول / إنشاء حساب)
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
                id: 0,
                name: 'Administrator',
                email: email,
                type: 'admin',
                joinDate: new Date().toISOString().split('T')[0]
            };
            
            isAdminLoggedIn = true;
            
            // حفظ في التخزين المحلي
            localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
            localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(true));
            
            // تحديث الواجهة
            updateUI();
            
            // تحميل بيانات السيرفر
            await loadDataFromServer();
            
            closeModal();
            alert('🎉 مرحباً بك في لوحة تحكم الإدارة!');
            return;
        }
        
        if (isLoginMode) {
            // ========== 2. تسجيل الدخول العادي ==========
            console.log('🔐 محاولة تسجيل دخول:', email);
            
            // البحث في البيانات المحلية أولاً
            let user = users.find(u => u.email === email && u.password === password);
            
            // إذا لم يوجد محلياً، جرب السيرفر
            if (!user) {
                const response = await postData('login', { email, password });
                
                if (response.status === 200) {
                    user = response.data;
                    console.log('✅ تسجيل دخول ناجح من السيرفر:', user);
                } else {
                    alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
                    return;
                }
            } else {
                console.log('✅ تسجيل دخول ناجح من البيانات المحلية:', user);
            }
            
            currentUser = user;
            isAdminLoggedIn = user.type === 'admin';
            
            // حفظ في التخزين المحلي
            localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
            localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
            
            // تحديث الواجهة
            updateUI();
            
            closeModal();
            alert(`🎉 مرحباً بعودتك ${user.name}!`);
            
        } else {
            // ========== 3. إنشاء حساب جديد ==========
            console.log('📝 محاولة إنشاء حساب:', { name, email });
            
            // التحقق من عدم وجود الحساب محلياً
            if (users.some(u => u.email === email)) {
                alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً');
                return;
            }
            
            // محاولة التسجيل في السيرفر
            const response = await postData('register', { name, email, password });
            
            if (response.status === 201) {
                const newUser = response.data;
                console.log('✅ تم إنشاء حساب جديد:', newUser);
                
                // إضافة إلى البيانات المحلية
                users.push(newUser);
                currentUser = newUser;
                isAdminLoggedIn = false;
                
                // حفظ في التخزين المحلي
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
                
                // تحديث الواجهة
                updateUI();
                
                closeModal();
                alert(`🎉 تم إنشاء حسابك بنجاح ${name}!\n\n⚠️ ملاحظة: تواصل مع الإدارة عبر الإنستجرام لطلب ترقية حسابك إلى تاجر.`);
            } else {
                alert(`❌ ${response.message || 'فشل إنشاء الحساب'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ في المصادقة:', error);
        alert('⚠️ حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
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
    
    // فرز المنتجات: المميزة أولاً
    const featuredProducts = products.filter(p => p.featured);
    const regularProducts = products.filter(p => !p.featured);
    const allProducts = [...featuredProducts, ...regularProducts];
    
    allProducts.forEach(product => {
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
                </div>
                <button class="view-btn" onclick="showProductDetail(${product.id})">
                    <i class="fas fa-eye"></i> عرض التفاصيل
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        alert('❌ المنتج غير موجود');
        return;
    }
    
    const merchant = users.find(u => u.id == product.merchantId);
    const detailBody = document.getElementById('detailBody');
    
    detailBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-image">
                <img src="${product.image || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                     alt="${product.title}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Error+Loading'">
            </div>
            <div class="detail-info">
                <h2 class="detail-title">${product.title || 'بدون عنوان'}</h2>
                <div class="detail-price">${product.price || 0} ريال عماني</div>
                
                ${product.featured ? `
                    <div class="featured-badge">
                        <i class="fas fa-crown"></i> إعلان مميز
                    </div>
                ` : ''}
                
                <div class="detail-merchant">
                    <i class="fas fa-user-tie"></i> 
                    <strong>التاجر:</strong> ${merchant ? merchant.name : 'غير معروف'}
                </div>
                
                <div class="detail-contact">
                    <i class="fas fa-phone"></i> 
                    <strong>رقم التواصل:</strong> ${product.contact || 'غير متوفر'}
                </div>
                
                <div class="detail-date">
                    <i class="fas fa-calendar"></i> 
                    <strong>تاريخ النشر:</strong> ${product.date || 'غير معروف'}
                </div>
            </div>
        </div>
        
        <div class="detail-description">
            <h3><i class="fas fa-align-right"></i> وصف المنتج</h3>
            <p>${product.description || 'لا يوجد وصف للمنتج'}</p>
        </div>
        
        <div class="detail-actions">
            <button class="btn btn-secondary" onclick="closeDetailModal()">
                <i class="fas fa-times"></i> إغلاق
            </button>
            
            ${currentUser && currentUser.type === 'admin' ? `
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> حذف المنتج
                </button>
            ` : ''}
        </div>
    `;
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

// إغلاق نافذة تفاصيل المنتج
function closeDetailModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

// ==================== وظائف رفع الصور ====================

// معالجة رفع الصور
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.match('image.*')) {
        alert('⚠️ يرجى اختيار صورة فقط');
        return;
    }
    
    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ حجم الصورة كبير جداً. الحد الأقصى 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageData = e.target.result;
        
        // عرض معاينة الصورة
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <img src="${selectedImageData}" 
                     alt="معاينة الصورة" 
                     style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <p style="color: #666; margin-top: 10px; font-size: 0.9rem;">
                    <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                    تم اختيار الصورة
                </p>
            `;
        }
    };
    
    reader.readAsDataURL(file);
}

// رفع الصورة إلى Google Drive
async function uploadImageToDrive() {
    if (!selectedImageData) {
        alert('⚠️ يرجى اختيار صورة أولاً');
        return null;
    }
    
    try {
        console.log('🔼 جاري رفع الصورة...');
        
        const response = await postData('uploadImage', {
            imageData: selectedImageData,
            fileName: `product_${Date.now()}.jpg`
        });
        
        if (response.status === 200) {
            console.log('✅ تم رفع الصورة بنجاح:', response.data);
            return response.data.directUrl;
        } else {
            console.error('❌ فشل رفع الصورة:', response.message);
            return null;
        }
    } catch (error) {
        console.error('❌ خطأ في رفع الصورة:', error);
        return null;
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
    
    // تحميل جداول الإدارة
    renderMerchantsTable();
    renderAccountsTable();
    renderAdsTable();
    populateMerchantSelect();
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

// تبديل علامات التبويب في لوحة الإدارة
function openAdminTab(evt, tabName) {
    // إخفاء جميع محتويات التبويبات
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active-tab');
    }
    
    // إزالة النشاط من جميع أزرار التبويبات
    const tabLinks = document.getElementsByClassName('tab-link');
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove('active');
    }
    
    // عرض محتوى التبويب المحدد وإضافة النشاط للزر
    document.getElementById(tabName).classList.add('active-tab');
    evt.currentTarget.classList.add('active');
}

// ==================== جداول الإدارة ====================

// عرض جدول التجار
function renderMerchantsTable() {
    const tbody = document.querySelector('#merchantsTable tbody');
    if (!tbody) return;
    
    const merchants = users.filter(u => u.type === 'merchant' || u.type === 'admin');
    
    if (merchants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-user-tie" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <p>لا يوجد تجار مسجلين بعد</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    merchants.forEach(user => {
        const userAds = products.filter(p => p.merchantId == user.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'غير معروف'}</td>
            <td>${user.email || 'غير معروف'}</td>
            <td>${user.joinDate || 'غير معروف'}</td>
            <td>${userAds.length}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${user.type !== 'admin' ? `
                        <button class="action-btn btn-remove" onclick="removeMerchant('${user.id}')" title="إلغاء صلاحية التاجر">
                            <i class="fas fa-user-times"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn btn-view" onclick="viewUserAds('${user.id}')" title="عرض إعلانات التاجر">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// عرض جدول جميع الحسابات
function renderAccountsTable() {
    const tbody = document.querySelector('#accountsTable tbody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <p>لا يوجد مستخدمين مسجلين بعد</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'غير معروف'}</td>
            <td>${user.email || 'غير معروف'}</td>
            <td>
                <span class="user-type-badge ${user.type === 'merchant' ? 'merchant-badge' : 
                                              user.type === 'admin' ? 'admin-badge' : 'user-badge'}">
                    ${user.type === 'merchant' ? 'تاجر' : 
                     user.type === 'admin' ? 'مدير' : 'مستخدم عادي'}
                </span>
            </td>
            <td>${user.joinDate || 'غير معروف'}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${user.type === 'user' ? `
                        <button class="action-btn btn-approve" onclick="makeMerchant('${user.id}')" title="ترقية إلى تاجر">
                            <i class="fas fa-user-check"></i> جعله تاجر
                        </button>
                    ` : user.type === 'merchant' ? 
                        '<span style="color:#2e7d32; padding: 5px 10px; background: #e8f5e9; border-radius: 4px;">تاجر بالفعل</span>' :
                        '<span style="color:#d32f2f; padding: 5px 10px; background: #ffebee; border-radius: 4px;">مدير النظام</span>'
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// عرض جدول الإعلانات
function renderAdsTable() {
    const tbody = document.querySelector('#adsTable tbody');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <p>لا يوجد إعلانات منشورة بعد</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const merchant = users.find(u => u.id == product.merchantId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${product.image || 'https://via.placeholder.com/50'}" 
                     alt="${product.title || 'منتج'}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>${product.title || 'بدون عنوان'}</td>
            <td>${product.price || 0}</td>
            <td>${merchant ? merchant.name : 'غير معروف'}</td>
            <td>${product.date || 'غير معروف'}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="action-btn btn-view" onclick="showProductDetail(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-remove" onclick="removeAd(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${!product.featured ? `
                        <button class="action-btn btn-approve" onclick="makeFeatured(${product.id})" title="جعله إعلان مميز">
                            <i class="fas fa-crown"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ملء قائمة التجار في نموذج نشر الإعلان
function populateMerchantSelect() {
    const select = document.getElementById('adMerchant');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- اختر تاجر --</option>';
    
    const merchants = users.filter(u => u.type === 'merchant');
    merchants.forEach(merchant => {
        const option = document.createElement('option');
        option.value = merchant.id;
        option.textContent = `${merchant.name} (${merchant.email})`;
        select.appendChild(option);
    });
}

// البحث في الجداول
function searchTable(tableId, query) {
    const table = document.getElementById(tableId);
    if (!table || !query) return;
    
    const rows = table.getElementsByTagName('tr');
    let visibleCount = 0;
    
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().includes(query.toLowerCase())) {
                found = true;
                break;
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
        if (found) visibleCount++;
    }
    
    // إذا لم توجد نتائج، عرض رسالة
    if (visibleCount === 0 && rows.length > 1) {
        const tbody = table.querySelector('tbody');
        if (tbody && !tbody.querySelector('.no-results')) {
            const row = document.createElement('tr');
            row.className = 'no-results';
            row.innerHTML = `
                <td colspan="10" style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <p>لا توجد نتائج تطابق "${query}"</p>
                </td>
            `;
            tbody.appendChild(row);
        }
    } else {
        const noResults = table.querySelector('.no-results');
        if (noResults) noResults.remove();
    }
}

// ==================== إجراءات الإدارة ====================

// ترقية مستخدم إلى تاجر
async function makeMerchant(userId) {
    if (!confirm('هل تريد حقًا ترقية هذا المستخدم إلى تاجر؟')) return;
    
    try {
        const response = await postData('updateUserType', {
            adminEmail: 'msdfrrt@gmail.com',
            adminPassword: 'Shabib95873061@99',
            userId: userId
        });
        
        if (response.status === 200) {
            // تحديث البيانات المحلية
            const user = users.find(u => u.id == userId);
            if (user) {
                user.type = 'merchant';
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                
                // تحديث الجداول
                renderMerchantsTable();
                renderAccountsTable();
                populateMerchantSelect();
                
                alert('✅ تم ترقية المستخدم إلى تاجر بنجاح.');
            }
        } else {
            alert(`❌ ${response.message || 'فشلت العملية'}`);
        }
    } catch (error) {
        console.error('❌ خطأ في ترقية المستخدم:', error);
        alert('⚠️ حدث خطأ أثناء ترقية المستخدم');
    }
}

// إلغاء صلاحية التاجر
async function removeMerchant(userId) {
    if (!confirm('هل تريد إلغاء صلاحية التاجر عن هذا المستخدم؟')) return;
    
    try {
        const user = users.find(u => u.id == userId);
        if (user && user.type === 'merchant') {
            user.type = 'user';
            localStorage.setItem('webaidea_users', JSON.stringify(users));
            
            // تحديث الجداول
            renderMerchantsTable();
            renderAccountsTable();
            populateMerchantSelect();
            
            alert('✅ تم إلغاء صلاحية التاجر.');
        }
    } catch (error) {
        console.error('❌ خطأ في إلغاء صلاحية التاجر:', error);
        alert('⚠️ حدث خطأ أثناء العملية');
    }
}

// نشر إعلان جديد من قبل الإدارة
async function postAdminAd(event) {
    event.preventDefault();
    
    const title = document.getElementById('adTitle').value.trim();
    const price = document.getElementById('adPrice').value;
    const description = document.getElementById('adDescription').value.trim();
    const contact = document.getElementById('adContact').value.trim();
    const merchantId = document.getElementById('adMerchant').value;
    
    // التحقق من البيانات
    if (!title || !price || !description || !contact || !merchantId) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (!selectedImageData) {
        alert('⚠️ يرجى اختيار صورة للمنتج');
        return;
    }
    
    if (!confirm('هل تريد نشر هذا الإعلان المميز؟')) return;
    
    try {
        // 1. رفع الصورة
        const imageUrl = await uploadImageToDrive();
        if (!imageUrl) {
            alert('❌ فشل رفع الصورة. يرجى المحاولة مرة أخرى');
            return;
        }
        
        // 2. نشر المنتج
        const response = await postData('addProduct', {
            isAdmin: 'true',
            userId: merchantId,
            title: title,
            price: parseFloat(price),
            description: description,
            image: imageUrl,
            contact: contact,
            merchantId: merchantId,
            featured: 'true'
        });
        
        if (response.status === 201) {
            // إضافة المنتج إلى البيانات المحلية
            const newProduct = {
                id: response.data.productId,
                title: title,
                price: parseFloat(price),
                description: description,
                image: imageUrl,
                contact: contact,
                merchantId: merchantId,
                featured: true,
                date: new Date().toISOString().split('T')[0]
            };
            
            products.push(newProduct);
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            
            // إعادة تعيين النموذج
            document.getElementById('adminAdForm').reset();
            selectedImageData = null;
            
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.innerHTML = `
                    <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
                    <p style="color: #999; margin-top: 10px;">لم يتم اختيار صورة</p>
                `;
            }
            
            // تحديث الجداول والعروض
            renderAdsTable();
            renderProducts();
            
            alert('🎉 تم نشر الإعلان المميز بنجاح!');
        } else {
            alert(`❌ ${response.message || 'فشل نشر الإعلان'}`);
        }
    } catch (error) {
        console.error('❌ خطأ في نشر الإعلان:', error);
        alert('⚠️ حدث خطأ أثناء نشر الإعلان');
    }
}

// حذف إعلان
async function removeAd(productId) {
    if (!confirm('هل تريد حذف هذا الإعلان؟')) return;
    
    try {
        const response = await postData('deleteProduct', {
            adminEmail: 'msdfrrt@gmail.com',
            adminPassword: 'Shabib95873061@99',
            productId: productId
        });
        
        if (response.status === 200) {
            // تحديث البيانات المحلية
            products = products.filter(p => p.id != productId);
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            
            // تحديث الجداول والعروض
            renderAdsTable();
            renderProducts();
            
            alert('✅ تم حذف الإعلان بنجاح.');
        } else {
            alert(`❌ ${response.message || 'فشلت العملية'}`);
        }
    } catch (error) {
        console.error('❌ خطأ في حذف الإعلان:', error);
        alert('⚠️ حدث خطأ أثناء حذف الإعلان');
    }
}

// جعل الإعلان مميزاً
async function makeFeatured(productId) {
    if (!confirm('هل تريد جعل هذا الإعلان مميزاً؟')) return;
    
    const product = products.find(p => p.id == productId);
    if (product) {
        product.featured = true;
        localStorage.setItem('webaidea_products', JSON.stringify(products));
        
        renderAdsTable();
        renderProducts();
        alert('✅ تم جعل الإعلان مميزاً.');
    }
}

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    await removeAd(productId);
    closeDetailModal();
}

// عرض إعلانات تاجر معين
function viewUserAds(userId) {
    const userAds = products.filter(p => p.merchantId == userId);
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        alert('❌ التاجر غير موجود');
        return;
    }
    
    if (userAds.length > 0) {
        let message = `📋 إعلانات ${user.name} (${userAds.length} إعلان):\n\n`;
        userAds.forEach((ad, index) => {
            message += `${index + 1}. ${ad.title} - ${ad.price} ريال\n`;
        });
        alert(message);
    } else {
        alert(`ℹ️ ليس لدى ${user.name} أي إعلانات منشورة.`);
    }
}

// ==================== وظائف مساعدة ====================

// إعادة توجيه إلى إنستجرام
function redirectToInstagram() {
    window.open('https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr', '_blank');
}

// فتح/إغلاق القائمة على الجوال
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// إغلاق النوافذ المنبثقة بالنقر خارجها
window.addEventListener('click', function(event) {
    const authModal = document.getElementById('authModal');
    const detailModal = document.getElementById('productDetailModal');
    
    if (event.target === authModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
});

// منع إرسال النموذج عند الضغط على Enter
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        const activeModal = document.querySelector('.modal[style*="display: flex"]');
        if (activeModal && !activeModal.contains(event.target)) {
            event.preventDefault();
        }
    }
});

// تهيئة البيانات التجريبية عند عدم وجود بيانات
function initSampleData() {
    if (users.length === 0) {
        users = [
            {
                id: 1,
                name: "أحمد العماني",
                email: "ahmed@example.com",
                password: "123456",
                type: "merchant",
                joinDate: "2023-10-01"
            },
            {
                id: 2,
                name: "سارة البوسعيدي",
                email: "sara@example.com",
                password: "123456",
                type: "user",
                joinDate: "2023-10-05"
            }
        ];
        localStorage.setItem('webaidea_users', JSON.stringify(users));
    }
    
    if (products.length === 0) {
        products = [
            {
                id: 1,
                title: "ساعة ذكية جديدة",
                description: "ساعة ذكية بشاشة AMOLED ومقاومة للماء، تدعم الاتصال الهاتفي.",
                price: 199,
                image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                merchantId: 1,
                contact: "+968 1234 5678",
                date: "2023-10-15",
                featured: true
            }
        ];
        localStorage.setItem('webaidea_products', JSON.stringify(products));
    }
}

// تشغيل البيانات التجريبية إذا لزم الأمر
if (users.length === 0 && products.length === 0) {
    initSampleData();
    location.reload();
}

console.log('🎯 جاهز للاستخدام!');
console.log('📌 رابط الإدارة:', window.location.href);
console.log('🔑 بيانات المدير:', 'msdfrrt@gmail.com / Shabib95873061@99');