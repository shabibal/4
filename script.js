// Webaidea Platform - JavaScript with Google Sheets Integration - FIXED VERSION
const API_URL = 'https://script.google.com/macros/s/AKfycbzRsdGpvl8hESQ8Yyc19vdHek87a5b6Leo1JYjty2j3LMqRumgYSpN1msO2D1TGthZc/exec';

// متغيرات عامة
let users = [];
let products = [];
let currentUser = null;
let isAdminLoggedIn = false;
let selectedImageData = null;
let merchantSelectedImage = null;

// ========== تهيئة الموقع عند تحميل الصفحة ==========
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 بدء تهيئة موقع ويب أيديا - النسخة المعدلة...');
    
    // 1. تحميل البيانات المحلية فوراً
    await loadLocalData();
    
    // 2. التحقق من وجود بيانات محلية صالحة
    const hasLocalData = users.length > 0 || products.length > 0;
    console.log('📊 البيانات المحلية:', { 
        users: users.length, 
        products: products.length,
        currentUser: currentUser ? currentUser.name : 'لا يوجد'
    });
    
    // 3. إذا لم توجد بيانات، أنشئ بيانات تجريبية
    if (!hasLocalData || (users.length === 0 && products.length === 0)) {
        console.log('📝 إنشاء بيانات تجريبية...');
        await initSampleData();
    }
    
    // 4. عرض البيانات المحلية فوراً
    renderProducts();
    updateUI();
    
    // 5. إعداد الأحداث
    setupEventListeners();
    
    // 6. إضافة زر المزامنة
    addSyncButton();
    
    // 7. محاولة تحميل البيانات من السيرفر في الخلفية
    setTimeout(async () => {
        try {
            console.log('🔄 محاولة تحميل البيانات من السيرفر...');
            await loadDataFromServer();
            renderProducts();
            updateUI();
            console.log('✅ تم تحميل البيانات من السيرفر بنجاح');
        } catch (error) {
            console.log('⚠️ استخدام البيانات المحلية فقط:', error.message);
        }
    }, 1500);
    
    console.log('✅ تم تهيئة الموقع بنجاح - النسخة المعدلة');
});

// ========== دالة تحميل البيانات المحلية ==========
async function loadLocalData() {
    console.log('📥 جاري تحميل البيانات المحلية...');
    
    try {
        // 1. تحميل المستخدمين
        const storedUsers = localStorage.getItem('webaidea_users');
        if (storedUsers && storedUsers !== 'undefined' && storedUsers !== 'null') {
            users = JSON.parse(storedUsers);
            console.log(`✅ تم تحميل ${users.length} مستخدم`);
        } else {
            users = [];
            console.log('📭 لا يوجد مستخدمين محفوظين');
        }
        
        // 2. تحميل المنتجات
        const storedProducts = localStorage.getItem('webaidea_products');
        if (storedProducts && storedProducts !== 'undefined' && storedProducts !== 'null') {
            products = JSON.parse(storedProducts);
            console.log(`✅ تم تحميل ${products.length} منتج`);
        } else {
            products = [];
            console.log('📭 لا يوجد منتجات محفوظة');
        }
        
        // 3. تحميل حالة المستخدم الحالي
        const storedCurrentUser = localStorage.getItem('webaidea_currentUser');
        if (storedCurrentUser && storedCurrentUser !== 'undefined' && storedCurrentUser !== 'null') {
            currentUser = JSON.parse(storedCurrentUser);
            console.log(`👤 المستخدم الحالي: ${currentUser.name} (${currentUser.type})`);
        } else {
            currentUser = null;
            console.log('👤 لا يوجد مستخدم مسجل دخوله');
        }
        
        // 4. تحميل حالة المدير
        const storedAdminStatus = localStorage.getItem('webaidea_adminLoggedIn');
        if (storedAdminStatus && storedAdminStatus !== 'undefined' && storedAdminStatus !== 'null') {
            isAdminLoggedIn = JSON.parse(storedAdminStatus);
            console.log(`👑 حالة المدير: ${isAdminLoggedIn ? 'مسجل دخول' : 'غير مسجل'}`);
        } else {
            isAdminLoggedIn = false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات المحلية:', error);
        
        // محاولة استعادة من النسخ الاحتياطيات
        try {
            const backupUsers = localStorage.getItem('webaidea_backup_users');
            const backupProducts = localStorage.getItem('webaidea_backup_products');
            const backupCurrentUser = localStorage.getItem('webaidea_backup_currentUser');
            
            if (backupUsers && backupProducts) {
                console.log('🔄 استعادة البيانات من النسخ الاحتياطية');
                users = JSON.parse(backupUsers);
                products = JSON.parse(backupProducts);
                currentUser = backupCurrentUser ? JSON.parse(backupCurrentUser) : null;
                
                // حفظ البيانات المستعادة
                saveLocalData();
                return true;
            }
        } catch (backupError) {
            console.error('❌ فشل استعادة النسخ الاحتياطية:', backupError);
        }
        
        // إعادة تعيين المتغيرات
        users = [];
        products = [];
        currentUser = null;
        isAdminLoggedIn = false;
        return false;
    }
}

// ========== دالة حفظ البيانات محلياً ==========
function saveLocalData() {
    console.log('💾 جاري حفظ البيانات محلياً...');
    
    try {
        // 1. حفظ المستخدمين
        localStorage.setItem('webaidea_users', JSON.stringify(users));
        
        // 2. حفظ المنتجات
        localStorage.setItem('webaidea_products', JSON.stringify(products));
        
        // 3. حفظ حالة المستخدم الحالي
        if (currentUser) {
            localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('webaidea_currentUser');
        }
        
        // 4. حفظ حالة المدير
        localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(isAdminLoggedIn));
        
        // 5. إنشاء نسخة احتياطية
        localStorage.setItem('webaidea_backup_users', JSON.stringify(users));
        localStorage.setItem('webaidea_backup_products', JSON.stringify(products));
        if (currentUser) {
            localStorage.setItem('webaidea_backup_currentUser', JSON.stringify(currentUser));
        }
        
        console.log(`✅ تم حفظ ${users.length} مستخدم و ${products.length} منتج`);
        
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات المحلية:', error);
        showNotification('❌ حدث خطأ في حفظ البيانات', 'error');
        return false;
    }
}

// ========== دالة تحميل البيانات من السيرفر ==========
async function loadDataFromServer() {
    try {
        console.log('🌐 جاري الاتصال بالسيرفر...');
        
        let serverUsers = [];
        let serverProducts = [];
        
        // محاولة تحميل المستخدمين
        try {
            const usersResponse = await fetchData('getUsers');
            if (usersResponse && usersResponse.status === 200) {
                serverUsers = usersResponse.data.users || [];
                console.log(`✅ تم تحميل ${serverUsers.length} مستخدم من السيرفر`);
            }
        } catch (error) {
            console.warn('⚠️ تعذر تحميل المستخدمين من السيرفر:', error.message);
        }
        
        // محاولة تحميل المنتجات
        try {
            const productsResponse = await fetchData('getProducts');
            if (productsResponse && productsResponse.status === 200) {
                serverProducts = productsResponse.data.products || [];
                console.log(`✅ تم تحميل ${serverProducts.length} منتج من السيرفر`);
            }
        } catch (error) {
            console.warn('⚠️ تعذر تحميل المنتجات من السيرفر:', error.message);
        }
        
        // دمج البيانات المحلية مع السيرفر
        if (serverUsers.length > 0 || serverProducts.length > 0) {
            // دمج المستخدمين
            const mergedUsers = mergeUsers(users, serverUsers);
            
            // دمج المنتجات
            const mergedProducts = mergeProducts(products, serverProducts);
            
            // تحديث المتغيرات العامة
            users = mergedUsers;
            products = mergedProducts;
            
            // حفظ البيانات المدمجة
            saveLocalData();
            
            console.log(`✅ تم دمج البيانات: ${users.length} مستخدم، ${products.length} منتج`);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من السيرفر:', error);
        return false;
    }
}

// ========== دالة دمج المستخدمين ==========
function mergeUsers(localUsers, serverUsers) {
    const userMap = new Map();
    
    // أولاً: إضافة مستخدمي السيرفر
    serverUsers.forEach(user => {
        if (user.email) {
            userMap.set(user.email, {
                ...user,
                source: 'server',
                synced: true
            });
        }
    });
    
    // ثانياً: إضافة المستخدمين المحليين غير الموجودين في السيرفر
    localUsers.forEach(user => {
        if (user.email && !userMap.has(user.email)) {
            userMap.set(user.email, {
                ...user,
                source: user.source || 'local',
                synced: user.synced || false
            });
        }
    });
    
    return Array.from(userMap.values());
}

// ========== دالة دمج المنتجات ==========
function mergeProducts(localProducts, serverProducts) {
    const productMap = new Map();
    
    // أولاً: إضافة منتجات السيرفر
    serverProducts.forEach(product => {
        if (product.id) {
            productMap.set(product.id, {
                ...product,
                source: 'server',
                synced: true
            });
        }
    });
    
    // ثانياً: إضافة المنتجات المحلية غير الموجودة في السيرفر
    localProducts.forEach(product => {
        if (product.id && !productMap.has(product.id)) {
            productMap.set(product.id, {
                ...product,
                source: product.source || 'local',
                synced: product.synced || false
            });
        }
    });
    
    return Array.from(productMap.values());
}

// ========== إعداد مستمعي الأحداث ==========
function setupEventListeners() {
    console.log('🔧 جاري إعداد مستمعي الأحداث...');
    
    // زر تسجيل الدخول في الشريط
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal();
        });
    }
    
    // زر لوحة الإدارة
    const adminBtn = document.getElementById('adminDashboardBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAdminPanel();
        });
    }
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    console.log('✅ تم إعداد مستمعي الأحداث');
}

// ========== دالة تسجيل خروج المستخدم ==========
function logoutUser() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        const backupUser = currentUser;
        
        // إعادة تعيين الحالة
        currentUser = null;
        isAdminLoggedIn = false;
        
        // حفظ الحالة الجديدة
        saveLocalData();
        
        // تحديث الواجهة
        updateUI();
        
        // إخفاء لوحة الإدارة
        showMainSite();
        
        // إزالة زر نشر الإعلان
        const postBtn = document.getElementById('merchantPostBtn');
        if (postBtn) postBtn.remove();
        
        showNotification('✅ تم تسجيل الخروج بنجاح', 'success');
        
        // حفظ نسخة احتياطية من المستخدم المسجل
        if (backupUser) {
            localStorage.setItem('webaidea_lastUser', JSON.stringify(backupUser));
        }
    }
}

// ========== تحديث واجهة المستخدم ==========
function updateUI() {
    console.log('🎨 جاري تحديث واجهة المستخدم...');
    
    // تحديث أزرار التنقل
    updateNavbarButtons();
    
    // التحقق من حالة المستخدم
    if (isAdminLoggedIn && currentUser && currentUser.type === 'admin') {
        showAdminPanel();
    } else {
        showMainSite();
        
        // ✅ إظهار زر نشر الإعلان للتجار (بعد التحقق من الدخول والنوع)
        if (currentUser && currentUser.type === 'merchant') {
            console.log('👨‍💼 تاجر مسجل دخوله - عرض زر النشر');
            showMerchantPostButton();
        } else {
            // ✅ إزالة زر النشر إذا لم يكن تاجراً
            const postBtn = document.getElementById('merchantPostBtn');
            if (postBtn) {
                postBtn.remove();
                console.log('❌ إزالة زر النشر (المستخدم ليس تاجراً)');
            }
        }
    }
    
    // إظهار عدد المنتجات في الكونسول
    console.log(`📊 عدد المنتجات المعروضة: ${products.length}`);
}

// ========== تحديث أزرار التنقل ==========
function updateNavbarButtons() {
    const adminBtn = document.getElementById('adminDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.querySelector('.login-btn');
    
    if (currentUser) {
        // إخفاء زر تسجيل الدخول
        if (loginBtn) loginBtn.style.display = 'none';
        
        // إظهار زر الخروج
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
        // إظهار زر الإدارة للمدير فقط
        if (adminBtn) {
            if (isAdminLoggedIn && currentUser.type === 'admin') {
                adminBtn.style.display = 'flex';
            } else {
                adminBtn.style.display = 'none';
            }
        }
        
        console.log(`👤 أزرار التنقل: ${currentUser.name} (${currentUser.type})`);
    } else {
        // إظهار زر تسجيل الدخول
        if (loginBtn) loginBtn.style.display = 'flex';
        
        // إخفاء زر الإدارة وزر الخروج
        if (adminBtn) adminBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        console.log('👤 أزرار التنقل: زائر');
    }
}

// ========== عرض المنتجات ==========
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 1rem; color: #ccc;"></i>
                <h3>لا توجد منتجات حالياً</h3>
                <p>كن أول من يعرض منتجاتك على المنصة!</p>
                ${!currentUser ? `
                    <a href="javascript:void(0);" class="btn btn-primary" onclick="openAuthModal()" style="margin-top: 1rem;">
                        <i class="fas fa-user-plus"></i> سجل الآن لعرض منتجاتك
                    </a>
                ` : ''}
            </div>
        `;
        return;
    }
    
    // فرز المنتجات: المميزة أولاً ثم الأحدث
    const sortedProducts = [...products].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });
    
    sortedProducts.forEach(product => {
        const merchant = users.find(u => u.id == product.merchantId || u.email === product.merchantId);
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // إضافة علامة "مميز" للمنتجات المميزة
        if (product.featured) {
            card.innerHTML = `<div class="special-badge"><i class="fas fa-crown"></i> مميز</div>`;
        }
        
        // إضافة علامة "محلي" للمنتجات غير المزامنة
        if (product.source === 'local' && !product.synced) {
            card.innerHTML += `
                <div class="special-badge" style="top: 45px; right: 10px; background: #ff9800;">
                    <i class="fas fa-laptop-house"></i> محلي
                </div>
            `;
        }
        
        // استخدام الصورة المحلية إذا كانت متاحة، وإلا استخدام الصورة العامة
        const displayImage = product.localImage || product.image || 'https://via.placeholder.com/300x200?text=No+Image';
        
        card.innerHTML += `
            <div class="product-image">
                <img src="${displayImage}" 
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
                    <div class="product-date" style="font-size: 0.8rem; color: #666;">
                        <i class="fas fa-calendar"></i> ${product.date || product.createdAt?.split('T')[0] || ''}
                    </div>
                </div>
                <button class="view-btn" onclick="showProductDetail('${product.id}')">
                    <i class="fas fa-eye"></i> عرض التفاصيل
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    console.log(`✅ تم عرض ${sortedProducts.length} منتج`);
}

// ========== عرض زر نشر الإعلان للتجار ==========
function showMerchantPostButton() {
    // إزالة الزر السابق إذا كان موجوداً
    const oldBtn = document.getElementById('merchantPostBtn');
    if (oldBtn) oldBtn.remove();
    
    // إنشاء زر جديد
    const postBtn = document.createElement('a');
    postBtn.id = 'merchantPostBtn';
    postBtn.className = 'btn btn-primary';
    postBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    postBtn.innerHTML = `<i class="fas fa-plus-circle"></i> نشر إعلان`;
    postBtn.href = 'javascript:void(0);';
    postBtn.onclick = function() {
        openMerchantAdModal();
    };
    
    document.body.appendChild(postBtn);
    console.log('✅ تم إضافة زر نشر الإعلان للتجار');
}

// ========== فتح نافذة نشر إعلان للتجار ==========
function openMerchantAdModal() {
    if (!currentUser || currentUser.type !== 'merchant') {
        alert('❌ يجب أن تكون تاجراً لنشر إعلان');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'merchantAdModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #333;">
                    <i class="fas fa-bullhorn"></i> نشر إعلان جديد
                </h2>
                <span onclick="closeMerchantAdModal()" style="font-size: 1.5rem; cursor: pointer; color: #666;">&times;</span>
            </div>
            
            <form id="merchantAdForm" onsubmit="postMerchantAd(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">عنوان المنتج *</label>
                    <input type="text" id="merchantAdTitle" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">السعر (ريال) *</label>
                    <input type="number" id="merchantAdPrice" required min="1" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">وصف المنتج *</label>
                    <textarea id="merchantAdDescription" rows="3" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;"></textarea>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">رقم التواصل *</label>
                    <input type="tel" id="merchantAdContact" required pattern="[0-9+]{8,}" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="مثال: +96812345678">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">صورة المنتج *</label>
                    <input type="file" id="merchantAdImage" accept="image/*" style="display: none;" onchange="handleMerchantImageUpload(event)">
                    <button type="button" onclick="document.getElementById('merchantAdImage').click()" style="background: #f5f5f5; color: #333; padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; width: 100%;">
                        <i class="fas fa-upload"></i> اختر صورة
                    </button>
                    <div id="merchantImagePreview" style="margin-top: 1rem; text-align: center; color: #666;">
                        <i class="fas fa-image" style="font-size: 2rem;"></i>
                        <p>لم يتم اختيار صورة</p>
                    </div>
                </div>
                
                <div style="background: #fff8e1; padding: 1rem; border-radius: 8px; border-right: 4px solid #ffb300; margin-bottom: 1.5rem;">
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> هذا إعلان عادي. للإعلانات المميزة تواصل مع الإدارة.
                    </p>
                </div>
                
                <button type="submit" style="background: linear-gradient(135deg, #4361ee, #3a0ca3); color: white; width: 100%; padding: 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i> نشر الإعلان
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========== معالجة رفع صورة للتجار ==========
function handleMerchantImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('⚠️ يرجى اختيار صورة فقط');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('⚠️ حجم الصورة كبير جداً. الحد الأقصى 2MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        merchantSelectedImage = e.target.result;
        
        const preview = document.getElementById('merchantImagePreview');
        if (preview) {
            preview.innerHTML = `
                <img src="${merchantSelectedImage}" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
                <p style="color: #4CAF50; margin-top: 5px;">
                    <i class="fas fa-check-circle"></i> تم اختيار الصورة
                </p>
            `;
        }
    };
    
    reader.readAsDataURL(file);
}

// ========== إغلاق نافذة نشر إعلان للتجار ==========
function closeMerchantAdModal() {
    const modal = document.getElementById('merchantAdModal');
    if (modal) modal.remove();
    merchantSelectedImage = null;
}

// ========== دالة توليد صورة ذكية بناءً على المحتوى ==========
function generateSmartImage(title, description) {
    const keywordsMap = {
        // إلكترونيات
        'ساعة': ['watch', 'smartwatch', 'clock'],
        'ساعة ذكية': ['smartwatch', 'watch', 'technology'],
        'موبايل': ['phone', 'smartphone', 'mobile'],
        'جوال': ['phone', 'smartphone'],
        'لابتوب': ['laptop', 'computer', 'macbook'],
        'كمبيوتر': ['computer', 'laptop', 'desktop'],
        'حاسوب': ['computer', 'laptop'],
        'تابلت': ['tablet', 'ipad'],
        'سماعة': ['headphone', 'earphone', 'audio'],
        'سماعات': ['headphones', 'earphones'],
        'كاميرا': ['camera', 'photography'],
        'تلفزيون': ['television', 'tv', 'screen'],
        'تلفاز': ['television', 'tv'],
        'شاشة': ['monitor', 'screen', 'display'],
        
        // سيارات
        'سيارة': ['car', 'automobile', 'vehicle'],
        'دراجة': ['bike', 'motorcycle', 'bicycle'],
        'عربية': ['car', 'vehicle'],
        
        // ملابس
        'ملابس': ['clothes', 'fashion', 'clothing'],
        'ثوب': ['dress', 'clothes'],
        'عباءة': ['abaya', 'dress'],
        'قميص': ['shirt', 'clothes'],
        'بنطال': ['pants', 'jeans'],
        'حذاء': ['shoes', 'sneakers'],
        'نعال': ['shoes', 'sandals'],
        
        // أثاث
        'أثاث': ['furniture', 'home', 'interior'],
        'كرسي': ['chair', 'furniture'],
        'طاولة': ['table', 'desk', 'furniture'],
        'سرير': ['bed', 'bedroom', 'furniture'],
        'خزانة': ['wardrobe', 'closet', 'furniture'],
        
        // مجوهرات
        'ذهب': ['gold', 'jewelry', 'necklace'],
        'فضة': ['silver', 'jewelry'],
        'ماس': ['diamond', 'jewelry'],
        'خاتم': ['ring', 'jewelry'],
        'سوار': ['bracelet', 'jewelry'],
        
        // عطور ومستحضرات
        'عطر': ['perfume', 'fragrance', 'bottle'],
        'كولونيا': ['perfume', 'cologne'],
        'مكياج': ['makeup', 'cosmetics'],
        
        // كتب
        'كتاب': ['book', 'reading', 'literature'],
        'رواية': ['book', 'novel', 'reading'],
        'مجلة': ['magazine', 'reading'],
        
        // رياضة
        'كرة': ['ball', 'sports'],
        'مضرب': ['racket', 'sports'],
        'دراجة': ['bicycle', 'sports'],
        
        // أطعمة
        'طعام': ['food', 'meal', 'cooking'],
        'حلوى': ['dessert', 'sweet', 'cake'],
        'قهوة': ['coffee', 'drink', 'cup'],
        'شاي': ['tea', 'drink'],
    };
    
    // البحث عن الكلمات المفتاحية في العنوان والوصف
    const searchText = (title + ' ' + description).toLowerCase();
    let selectedKeywords = ['product', 'shopping', 'sale'];
    
    for (const [arabicKeyword, englishKeywords] of Object.entries(keywordsMap)) {
        if (searchText.includes(arabicKeyword)) {
            selectedKeywords = [...englishKeywords, ...selectedKeywords];
            break;
        }
    }
    
    // اختيار كلمة مفتاحية عشوائية
    const randomKeyword = selectedKeywords[Math.floor(Math.random() * selectedKeywords.length)];
    
    // إنشاء رابط Unsplash ذكي
    const encodedTitle = encodeURIComponent(title.substring(0, 20));
    return `https://source.unsplash.com/600x400/?${randomKeyword},${encodedTitle}&orientation=landscape`;
}

// ========== نشر إعلان للتجار (نسخة محسنة) ==========
async function postMerchantAd(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.type !== 'merchant') {
        alert('❌ يجب أن تكون تاجراً لنشر إعلان');
        return;
    }
    
    const title = document.getElementById('merchantAdTitle').value.trim();
    const price = document.getElementById('merchantAdPrice').value;
    const description = document.getElementById('merchantAdDescription').value.trim();
    const contact = document.getElementById('merchantAdContact').value.trim();
    
    if (!title || !price || !description || !contact) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (!merchantSelectedImage) {
        alert('⚠️ يرجى اختيار صورة للمنتج');
        return;
    }
    
    if (!confirm('هل تريد نشر هذا الإعلان؟')) return;
    
    try {
        // عرض مؤشر التحميل
        showNotification('🔄 جاري نشر الإعلان...', 'info');
        
        // إنشاء ID فريد للمنتج
        const productId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // توليد صورة ذكية
        const productImage = generateSmartImage(title, description);
        
        // إنشاء المنتج (محلياً أولاً)
        const newProduct = {
            id: productId,
            title: title,
            price: parseFloat(price),
            description: description,
            image: productImage,
            merchantId: currentUser.id,
            contact: contact,
            featured: false,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            source: 'local',
            synced: false,
            localImage: merchantSelectedImage
        };
        
        console.log('📝 إنشاء منتج جديد:', newProduct);
        
        // إضافة المنتج إلى الذاكرة
        products.push(newProduct);
        
        // الحفظ الفوري في localStorage
        if (saveLocalData()) {
            console.log(`✅ تم حفظ المنتج محلياً: ${products.length} منتج`);
            
            // تحديث العرض فوراً للمستخدم الحالي
            renderProducts();
            
            // إغلاق النافذة
            closeMerchantAdModal();
            merchantSelectedImage = null;
            
            showNotification('✅ تم نشر الإعلان بنجاح (محلياً)', 'success');
            
            // محاولة النشر إلى السيرفر في الخلفية
            setTimeout(async () => {
                try {
                    console.log('🌐 محاولة النشر إلى السيرفر...');
                    
                    // محاولة النشر إلى السيرفر
                    const serverResponse = await postData('addProduct', {
                        title: title,
                        price: price,
                        description: description,
                        image: productImage,
                        contact: contact,
                        merchantId: currentUser.id,
                        featured: 'false'
                    });
                    
                    if (serverResponse && serverResponse.status === 201) {
                        console.log('✅ تم النشر إلى السيرفر بنجاح');
                        
                        // تحديث حالة المنتج
                        const productIndex = products.findIndex(p => p.id === productId);
                        if (productIndex !== -1) {
                            products[productIndex].synced = true;
                            products[productIndex].source = 'server';
                            products[productIndex].id = serverResponse.data.productId || productId;
                            
                            // حفظ البيانات المحدثة
                            saveLocalData();
                            renderProducts();
                            
                            showNotification('✅ تم مزامنة الإعلان مع السيرفر', 'success');
                        }
                    } else {
                        console.warn('⚠️ فشل النشر إلى السيرفر');
                    }
                    
                } catch (serverError) {
                    console.warn('⚠️ لا يمكن الاتصال بالسيرفر:', serverError.message);
                }
            }, 2000);
            
        } else {
            showNotification('❌ فشل حفظ الإعلان محلياً', 'error');
        }
        
    } catch (error) {
        console.error('❌ خطأ في نشر الإعلان:', error);
        showNotification('❌ حدث خطأ أثناء نشر الإعلان', 'error');
    }
}

// ========== دوال المصادقة ==========

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

// ========== دالة المصادقة الرئيسية ==========
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
        // ========== دخول كمدير ==========
        if (email === 'msdfrrt@gmail.com' && password === 'Shabib95873061@99') {
            console.log('👑 دخول كمدير النظام');
            
            currentUser = {
                id: "admin_0",
                name: 'Administrator',
                email: email,
                password: password,
                type: 'admin',
                joinDate: new Date().toISOString().split('T')[0],
                source: 'local',
                synced: false
            };
            
            isAdminLoggedIn = true;
            
            // إضافة المدير إلى المستخدمين إذا لم يكن موجوداً
            const existingAdmin = users.find(u => u.email === email);
            if (!existingAdmin) {
                users.push(currentUser);
            } else {
                // تحديث بيانات المدير الحالية
                const adminIndex = users.findIndex(u => u.email === email);
                users[adminIndex] = currentUser;
            }
            
            // حفظ البيانات
            saveLocalData();
            
            // تحديث الواجهة
            updateUI();
            
            closeModal();
            showNotification('🎉 مرحباً بك في لوحة تحكم الإدارة!', 'success');
            return;
        }
        
        if (isLoginMode) {
            // ========== تسجيل الدخول ==========
            console.log('🔐 محاولة تسجيل دخول:', email);
            
            // البحث في البيانات المحلية أولاً
            let user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // ✅ نجاح الدخول من البيانات المحلية
                console.log('✅ تسجيل دخول ناجح (محلي):', user.name);
                currentUser = user;
                isAdminLoggedIn = user.type === 'admin';
                
                saveLocalData();
                updateUI();
                closeModal();
                showNotification(`🎉 مرحباً بعودتك ${user.name}!`, 'success');
                return;
            }
            
            // ⭐⭐ محاولة الدخول من السيرفر
            console.log('🔄 محاولة تسجيل الدخول من السيرفر...');
            
            try {
                const response = await fetchData('login', { 
                    email: email, 
                    password: password 
                });
                
                if (response && response.status === 200) {
                    user = response.data;
                    console.log('✅ تسجيل دخول ناجح (سيرفر):', user.name);
                    
                    // إضافة كلمة المرور إلى بيانات المستخدم
                    user.password = password;
                    user.source = 'server';
                    user.synced = true;
                    
                    // إضافة المستخدم إلى البيانات المحلية
                    const existingUserIndex = users.findIndex(u => u.email === email);
                    if (existingUserIndex !== -1) {
                        users[existingUserIndex] = user;
                    } else {
                        users.push(user);
                    }
                    
                    currentUser = user;
                    isAdminLoggedIn = user.type === 'admin';
                    
                    saveLocalData();
                    updateUI();
                    closeModal();
                    showNotification(`🎉 مرحباً بعودتك ${user.name}!`, 'success');
                    
                } else if (response && response.status === 401) {
                    showNotification('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
                } else {
                    showNotification('❌ خطأ في الخادم', 'error');
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في الاتصال بالسيرفر:', serverError);
                showNotification('❌ بيانات الدخول غير صحيحة أو مشكلة في الاتصال', 'error');
            }
            
        } else {
            // ========== إنشاء حساب جديد ==========
            console.log('📝 محاولة إنشاء حساب:', { name, email });
            
            // التحقق من عدم وجود الحساب محلياً
            const localUser = users.find(u => u.email === email);
            if (localUser) {
                showNotification('⚠️ هذا البريد الإلكتروني مسجل مسبقاً', 'warning');
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
                
                if (response && response.status === 201) {
                    const newUser = response.data;
                    console.log('✅ تم إنشاء حساب جديد (سيرفر):', newUser.name);
                    
                    // إضافة خصائص إضافية
                    newUser.password = password;
                    newUser.source = 'server';
                    newUser.synced = true;
                    
                    // إضافة المستخدم محلياً
                    users.push(newUser);
                    currentUser = newUser;
                    isAdminLoggedIn = false;
                    
                    saveLocalData();
                    updateUI();
                    closeModal();
                    showNotification(`🎉 تم إنشاء حسابك بنجاح ${name}!`, 'success');
                    
                } else if (response && response.status === 409) {
                    showNotification('⚠️ هذا البريد الإلكتروني مسجل مسبقاً', 'warning');
                } else {
                    showNotification('❌ فشل إنشاء الحساب', 'error');
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في السيرفر، إنشاء حساب محلي:', serverError);
                
                // ⭐⭐ إنشاء حساب محلي
                const newId = 'user_' + Date.now();
                const newUser = {
                    id: newId,
                    name: name,
                    email: email,
                    password: password,
                    type: 'user',
                    joinDate: new Date().toISOString().split('T')[0],
                    source: 'local',
                    synced: false
                };
                
                users.push(newUser);
                currentUser = newUser;
                isAdminLoggedIn = false;
                
                saveLocalData();
                updateUI();
                closeModal();
                showNotification(`🎉 تم إنشاء حسابك بنجاح ${name}! (محلياً)`, 'success');
            }
        }
        
    } catch (error) {
        console.error('❌ خطأ غير متوقع في المصادقة:', error);
        showNotification('⚠️ حدث خطأ غير متوقع', 'error');
    }
}

// ========== دوال الاتصال بالAPI ==========
async function fetchData(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
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
        console.log(`✅ استجابة API: ${action}`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ خطأ في طلب ${action}:`, error);
        throw error;
    }
}

async function postData(action, params = {}) {
    return fetchData(action, params);
}

// ========== دوال الإدارة ==========

// عرض لوحة الإدارة
function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    adminPanel.style.display = 'block';
    
    // إخفاء أقسام الموقع العادي
    const sectionsToHide = ['.hero', '.products-section', '.how-section', '.footer'];
    sectionsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = 'none';
    });
    
    // إخفاء شريط التنقل الأصلي
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'none';
    
    // تحميل جداول الإدارة
    renderMerchantsTable();
    renderAccountsTable();
    renderAdsTable();
    populateMerchantSelect();
}

// إخفاء لوحة الإدارة
function showMainSite() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
    
    // إظهار أقسام الموقع العادي
    const sectionsToShow = ['.hero', '.products-section', '.how-section', '.footer'];
    sectionsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = '';
    });
    
    // إظهار شريط التنقل
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'block';
}

// العودة للقائمة الرئيسية
function goToMainSite() {
    if (confirm('هل تريد العودة للقائمة الرئيسية؟')) {
        logoutAdmin();
    }
}

// تسجيل خروج المدير
function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
        isAdminLoggedIn = false;
        
        // إذا كان المدير هو المستخدم الحالي، تسجيل الخروج بالكامل
        if (currentUser && currentUser.type === 'admin') {
            currentUser = null;
        }
        
        saveLocalData();
        showMainSite();
        updateUI();
        
        showNotification('✅ تم تسجيل الخروج من لوحة الإدارة', 'success');
    }
}

// تبديل علامات التبويب
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
    
    // عرض محتوى التبويب المحدد
    document.getElementById(tabName).classList.add('active-tab');
    evt.currentTarget.classList.add('active');
}

// ========== جداول الإدارة ==========

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
        const userAds = products.filter(p => p.merchantId == user.id || p.merchantId == user.email);
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
                    <button class="action-btn btn-view" onclick="viewUserAds('${user.email}')" title="عرض إعلانات التاجر">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// عرض جدول الحسابات
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
                        <button class="action-btn btn-approve" onclick="makeMerchant('${user.email}')" title="ترقية إلى تاجر">
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
        const merchant = users.find(u => u.id == product.merchantId || u.email === product.merchantId);
        const row = document.createElement('tr');
        
        // استخدام الصورة المحلية إذا كانت متاحة
        const displayImage = product.localImage || product.image || 'https://via.placeholder.com/50';
        
        row.innerHTML = `
            <td>
                <img src="${displayImage}" 
                     alt="${product.title || 'منتج'}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>${product.title || 'بدون عنوان'}</td>
            <td>${product.price || 0}</td>
            <td>${merchant ? merchant.name : 'غير معروف'}</td>
            <td>${product.date || product.createdAt?.split('T')[0] || 'غير معروف'}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="action-btn btn-view" onclick="showProductDetail('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-remove" onclick="removeAd('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${!product.featured ? `
                        <button class="action-btn btn-approve" onclick="makeFeatured('${product.id}')" title="جعله إعلان مميز">
                            <i class="fas fa-crown"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ملء قائمة التجار
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

// ========== نشر إعلان مميز من الإدارة ==========
async function postAdminAd(event) {
    event.preventDefault();
    
    const title = document.getElementById('adTitle').value.trim();
    const price = document.getElementById('adPrice').value;
    const description = document.getElementById('adDescription').value.trim();
    const contact = document.getElementById('adContact').value.trim();
    const merchantId = document.getElementById('adMerchant').value;
    
    if (!title || !price || !description || !contact) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (!confirm('هل تريد نشر هذا الإعلان المميز؟')) return;
    
    try {
        showNotification('🔄 جاري نشر الإعلان المميز...', 'info');
        
        // إنشاء ID فريد
        const productId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // توليد صورة ذكية
        const productImage = generateSmartImage(title, description);
        
        // النشر إلى السيرفر مباشرة (لظهوره للجميع)
        let serverUploadSuccess = false;
        let finalProductId = productId;
        
        try {
            console.log('🌐 نشر إعلان مميز إلى السيرفر...');
            
            const serverResponse = await postData('addProduct', {
                title: title,
                price: price,
                description: description,
                image: productImage,
                contact: contact,
                merchantId: merchantId || '0',
                featured: 'true'
            });
            
            if (serverResponse && serverResponse.status === 201) {
                serverUploadSuccess = true;
                finalProductId = serverResponse.data.productId || productId;
                console.log('✅ تم نشر الإعلان المميز إلى السيرفر:', finalProductId);
                showNotification('✅ تم نشر الإعلان المميز للجميع!', 'success');
            } else {
                throw new Error('فشل النشر إلى السيرفر');
            }
            
        } catch (serverError) {
            console.warn('⚠️ فشل نشر الإعلان المميز إلى السيرفر:', serverError.message);
            showNotification('⚠️ تم حفظ الإعلان المميز محلياً', 'warning');
        }
        
        // إنشاء المنتج المميز
        const newProduct = {
            id: finalProductId,
            title: title,
            price: parseFloat(price),
            description: description,
            image: productImage,
            merchantId: merchantId || '0',
            contact: contact,
            featured: true,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            source: serverUploadSuccess ? 'server' : 'local',
            synced: serverUploadSuccess,
            adminPosted: true
        };
        
        console.log('👑 إنشاء إعلان مميز:', newProduct);
        
        // إضافة المنتج إلى الذاكرة
        products.push(newProduct);
        
        // الحفظ الفوري
        saveLocalData();
        
        // تحديث الجداول
        renderAdsTable();
        renderProducts();
        
        // إعادة تعيين النموذج
        event.target.reset();
        
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
                <p style="color: #999; margin-top: 10px;">لم يتم اختيار صورة</p>
            `;
        }
        
        showNotification('✅ تم نشر الإعلان المميز بنجاح', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في نشر الإعلان المميز:', error);
        showNotification('❌ حدث خطأ أثناء نشر الإعلان المميز', 'error');
    }
}

// ========== معالجة رفع الصورة للإدارة ==========
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('⚠️ يرجى اختيار صورة فقط');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('⚠️ حجم الصورة كبير جداً. الحد الأقصى 2MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageData = e.target.result;
        
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <img src="${selectedImageData}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                <p style="color: #4CAF50; margin-top: 10px;">
                    <i class="fas fa-check-circle"></i> تم اختيار الصورة
                </p>
            `;
        }
    };
    
    reader.readAsDataURL(file);
}

// ========== دوال المزامنة ==========

// إضافة زر مزامنة
function addSyncButton() {
    // إزالة الزر السابق
    const oldBtn = document.getElementById('syncDataBtn');
    if (oldBtn) oldBtn.remove();
    
    // إنشاء زر جديد
    const syncBtn = document.createElement('button');
    syncBtn.id = 'syncDataBtn';
    syncBtn.className = 'btn btn-secondary';
    syncBtn.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        background: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
    `;
    syncBtn.innerHTML = `<i class="fas fa-sync-alt"></i> مزامنة`;
    syncBtn.onclick = async function() {
        await syncDataManually();
    };
    
    document.body.appendChild(syncBtn);
}

// مزامنة يدوية
async function syncDataManually() {
    if (confirm('هل تريد مزامنة البيانات مع السيرفر؟\n\nسيتم دمج البيانات المحلية مع السيرفر.')) {
        try {
            const syncBtn = document.getElementById('syncDataBtn');
            if (syncBtn) {
                syncBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري المزامنة...`;
                syncBtn.disabled = true;
            }
            
            const success = await loadDataFromServer();
            
            if (syncBtn) {
                if (success) {
                    syncBtn.innerHTML = `<i class="fas fa-check"></i> تمت المزامنة`;
                    showNotification('✅ تمت مزامنة البيانات بنجاح', 'success');
                } else {
                    syncBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> فشلت المزامنة`;
                    showNotification('⚠️ فشلت مزامنة البيانات', 'warning');
                }
                
                setTimeout(() => {
                    syncBtn.innerHTML = `<i class="fas fa-sync-alt"></i> مزامنة`;
                    syncBtn.disabled = false;
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ خطأ في المزامنة:', error);
            showNotification('❌ حدث خطأ أثناء مزامنة البيانات', 'error');
            
            const syncBtn = document.getElementById('syncDataBtn');
            if (syncBtn) {
                syncBtn.innerHTML = `<i class="fas fa-sync-alt"></i> مزامنة`;
                syncBtn.disabled = false;
            }
        }
    }
}

// ========== دالة عرض إشعار ==========
function showNotification(message, type = 'info') {
    // إنشاء العنصر
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    // تحديد اللون حسب النوع
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'warning') {
        notification.style.background = '#ff9800';
    } else if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#2196F3';
    }
    
    // إضافة الأيقونة
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    
    // إضافة العنصر إلى الصفحة
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========== دوال مساعدة ==========

// إعادة توجيه إلى إنستجرام
function redirectToInstagram() {
    window.open('https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr', '_blank');
}

// فتح/إغلاق القائمة على الجوال
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// إغلاق النوافذ بالنقر خارجها
window.addEventListener('click', function(event) {
    const authModal = document.getElementById('authModal');
    const detailModal = document.getElementById('productDetailModal');
    const merchantModal = document.getElementById('merchantAdModal');
    
    if (event.target === authModal) closeModal();
    if (event.target === detailModal) closeDetailModal();
    if (event.target === merchantModal) closeMerchantAdModal();
});

// ========== عرض تفاصيل المنتج ==========
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        showNotification('❌ المنتج غير موجود', 'error');
        return;
    }
    
    const merchant = users.find(u => u.id == product.merchantId || u.email === product.merchantId);
    const detailBody = document.getElementById('detailBody');
    
    // استخدام الصورة المحلية إذا كانت متاحة
    const displayImage = product.localImage || product.image || 'https://via.placeholder.com/400x300?text=No+Image';
    
    detailBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-image">
                <img src="${displayImage}" 
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
                    <strong>تاريخ النشر:</strong> ${product.date || product.createdAt?.split('T')[0] || 'غير معروف'}
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
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> حذف المنتج
                </button>
            ` : ''}
        </div>
    `;
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

// إغلاق تفاصيل المنتج
function closeDetailModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

// ========== دوال إضافية للإدارة ==========

// ترقية مستخدم إلى تاجر
async function makeMerchant(userEmail) {
    if (!confirm('هل تريد ترقية هذا المستخدم إلى تاجر؟')) return;
    
    try {
        const user = users.find(u => u.email === userEmail);
        if (user) {
            user.type = 'merchant';
            saveLocalData();
            
            renderMerchantsTable();
            renderAccountsTable();
            
            showNotification(`✅ تم ترقية ${user.name} إلى تاجر`, 'success');
            
            // محاولة تحديث السيرفر
            try {
                await postData('updateUserType', {
                    adminEmail: 'msdfrrt@gmail.com',
                    adminPassword: 'Shabib95873061@99',
                    userId: user.id
                });
                console.log('✅ تم تحديث السيرفر بترقية المستخدم');
            } catch (error) {
                console.warn('⚠️ لا يمكن تحديث السيرفر:', error.message);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في ترقية المستخدم:', error);
        showNotification('❌ حدث خطأ أثناء ترقية المستخدم', 'error');
    }
}

// حذف إعلان
async function removeAd(productId) {
    if (!confirm('هل تريد حذف هذا الإعلان؟')) return;
    
    try {
        const productIndex = products.findIndex(p => p.id == productId);
        if (productIndex !== -1) {
            products.splice(productIndex, 1);
            saveLocalData();
            
            renderAdsTable();
            renderProducts();
            
            showNotification('✅ تم حذف الإعلان', 'success');
            
            // محاولة حذف من السيرفر
            try {
                await postData('deleteProduct', {
                    adminEmail: 'msdfrrt@gmail.com',
                    adminPassword: 'Shabib95873061@99',
                    productId: productId
                });
                console.log('✅ تم حذف الإعلان من السيرفر');
            } catch (error) {
                console.warn('⚠️ لا يمكن حذف الإعلان من السيرفر:', error.message);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في حذف الإعلان:', error);
        showNotification('❌ حدث خطأ أثناء حذف الإعلان', 'error');
    }
}

// حذف منتج
function deleteProduct(productId) {
    removeAd(productId);
    closeDetailModal();
}

// جعل إعلان مميزاً
function makeFeatured(productId) {
    if (!confirm('هل تريد جعل هذا الإعلان مميزاً؟')) return;
    
    const product = products.find(p => p.id == productId);
    if (product) {
        product.featured = true;
        saveLocalData();
        
        renderAdsTable();
        renderProducts();
        
        showNotification('✅ تم جعل الإعلان مميزاً', 'success');
    }
}

// ========== دوال مساعدة إضافية ==========

// إزالة تاجر
function removeMerchant(userId) {
    if (!confirm('هل تريد إلغاء صلاحية هذا التاجر؟')) return;
    
    const user = users.find(u => u.id == userId);
    if (user) {
        user.type = 'user';
        saveLocalData();
        
        renderMerchantsTable();
        renderAccountsTable();
        
        showNotification(`✅ تم إلغاء صلاحية ${user.name} كتاجر`, 'success');
    }
}

// عرض إعلانات تاجر
function viewUserAds(userEmail) {
    const userAds = products.filter(p => {
        const merchant = users.find(u => u.email === userEmail);
        return merchant && (p.merchantId == merchant.id || p.merchantId === userEmail);
    });
    
    if (userAds.length === 0) {
        alert('⚠️ هذا التاجر ليس لديه إعلانات');
        return;
    }
    
    let message = `عدد إعلانات التاجر: ${userAds.length}\n\n`;
    userAds.forEach((ad, index) => {
        message += `${index + 1}. ${ad.title} - ${ad.price} ريال\n`;
    });
    
    alert(message);
}

// ========== تهيئة البيانات التجريبية ==========
async function initSampleData() {
    console.log('📝 إنشاء بيانات تجريبية...');
    
    // بيانات تجريبية للمستخدمين
    users = [
        {
            id: "user_1",
            name: "أحمد العماني",
            email: "ahmed@example.com",
            password: "123456",
            type: "merchant",
            joinDate: "2023-10-01",
            source: 'server',
            synced: true
        },
        {
            id: "user_2",
            name: "سارة البوسعيدي",
            email: "sara@example.com",
            password: "123456",
            type: "user",
            joinDate: "2023-10-05",
            source: 'server',
            synced: true
        }
    ];
    
    // بيانات تجريبية للمنتجات
    products = [
        {
            id: "prod_1",
            title: "ساعة ذكية جديدة",
            description: "ساعة ذكية بشاشة AMOLED ومقاومة للماء، تدعم الاتصال الهاتفي.",
            price: 199,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            merchantId: "user_1",
            contact: "+968 1234 5678",
            date: "2023-10-15",
            createdAt: "2023-10-15T10:00:00.000Z",
            featured: true,
            source: 'server',
            synced: true
        },
        {
            id: "prod_2",
            title: "سماعات بلوتوث عالية الجودة",
            description: "سماعات لاسلكية بتقنية إلغاء الضوضاء، بطارية تدوم 20 ساعة.",
            price: 149,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            merchantId: "user_1",
            contact: "+968 9876 5432",
            date: "2023-10-20",
            createdAt: "2023-10-20T14:30:00.000Z",
            featured: false,
            source: 'server',
            synced: true
        }
    ];
    
    // حفظ البيانات
    saveLocalData();
    
    console.log('✅ تم إنشاء بيانات تجريبية:', { users: users.length, products: products.length });
}

// ========== إضافة أنماط CSS للرسوم المتحركة ==========
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ========== حماية البيانات عند إغلاق المتصفح ==========
window.addEventListener('beforeunload', function() {
    console.log('🛡️ حماية البيانات قبل إغلاق الصفحة...');
    
    // حفظ نسخة احتياطية إضافية
    try {
        localStorage.setItem('webaidea_backup_users', JSON.stringify(users));
        localStorage.setItem('webaidea_backup_products', JSON.stringify(products));
        
        if (currentUser) {
            localStorage.setItem('webaidea_backup_currentUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ النسخ الاحتياطية:', error);
    }
});

// ========== رسالة بدء التشغيل ==========
console.log('🎯 موقع ويب أيديا جاهز للعمل - النسخة المعدلة!');
console.log('🔑 بيانات المدير: msdfrrt@gmail.com / Shabib95873061@99');
console.log('💾 نظام الحفظ المضمون مفعل');
console.log('🔄 المزامنة التلقائية مفعلة');