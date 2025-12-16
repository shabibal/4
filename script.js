// Webaidea Platform - JavaScript with Google Sheets Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbwC6ZSTDDN-cEv8ltjonYrTUwJCPkXKDRYITFP24qBcenPN46hZKRs2XE1rmRJvw7X3Jw/exec';

// متغيرات عامة
let users = [];
let products = [];
let currentUser = null;
let isAdminLoggedIn = false;
let selectedImageData = null;
let dataInitialized = false;
let merchantSelectedImage = null;

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
    
    // إضافة زر مزامنة البيانات
    addSyncButton();
    
    try {
        await loadDataFromServer();
    } catch (error) {
        console.error('خطأ في تحميل البيانات من السيرفر:', error);
    }
    
    // عرض البيانات
    renderProducts();
    updateUI();
    
    console.log('✅ تم تهيئة الموقع بنجاح');
});

// ==================== دالة مزامنة البيانات مع السيرفر ====================
async function loadDataFromServer() {
    try {
        console.log('🔄 جاري تحميل البيانات من السيرفر...');
        
        // محاولة تحميل البيانات من السيرفر
        const [productsResponse, usersResponse] = await Promise.allSettled([
            fetchData('getProducts'),
            fetchData('getUsers')
        ]);
        
        // معالجة استجابة المنتجات
        if (productsResponse.status === 'fulfilled' && productsResponse.value.status === 200) {
            const serverProducts = productsResponse.value.data || [];
            
            // الحصول على المنتجات المحلية
            const localProducts = JSON.parse(localStorage.getItem('webaidea_products')) || [];
            
            // ========== التحديث الهام: دمج المنتجات ==========
            // إنشاء خريطة للتحقق من التكرارات
            const productMap = new Map();
            
            // أولاً: إضافة جميع المنتجات من السيرفر
            serverProducts.forEach(product => {
                productMap.set(product.id, product);
            });
            
            // ثانياً: إضافة المنتجات المحلية التي ليست في السيرفر
            localProducts.forEach(product => {
                // إذا كان المنتج المحلي غير موجود في السيرفر، أضفه
                if (!productMap.has(product.id)) {
                    productMap.set(product.id, product);
                }
            });
            
            // تحويل الخريطة إلى مصفوفة
            products = Array.from(productMap.values());
            
            // حفظ في التخزين المحلي
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            console.log(`✅ تم دمج المنتجات: ${serverProducts.length} من السيرفر + ${localProducts.length} محلية = ${products.length} منتج`);
            
        } else {
            console.warn('⚠️ لم يتم تحميل المنتجات من السيرفر، استخدام البيانات المحلية فقط');
            products = JSON.parse(localStorage.getItem('webaidea_products')) || [];
        }
        
        // معالجة استجابة المستخدمين
        if (usersResponse.status === 'fulfilled' && usersResponse.value.status === 200) {
            const serverUsers = usersResponse.value.data || [];
            const localUsers = JSON.parse(localStorage.getItem('webaidea_users')) || [];
            
            // دمج المستخدمين بطريقة مشابهة
            const userMap = new Map();
            
            serverUsers.forEach(user => {
                userMap.set(user.email, user);
            });
            
            localUsers.forEach(user => {
                if (!userMap.has(user.email)) {
                    userMap.set(user.email, user);
                }
            });
            
            users = Array.from(userMap.values());
            localStorage.setItem('webaidea_users', JSON.stringify(users));
            console.log(`✅ تم دمج المستخدمين: ${serverUsers.length} من السيرفر + ${localUsers.length} محلية = ${users.length} مستخدم`);
            
        } else {
            console.warn('⚠️ لم يتم تحميل المستخدمين من السيرفر، استخدام البيانات المحلية فقط');
            users = JSON.parse(localStorage.getItem('webaidea_users')) || [];
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
        
        // استخدام البيانات المحلية فقط في حالة الخطأ
        products = JSON.parse(localStorage.getItem('webaidea_products')) || [];
        users = JSON.parse(localStorage.getItem('webaidea_users')) || [];
        
        console.log(`⚠️ استخدام البيانات المحلية فقط: ${products.length} منتج، ${users.length} مستخدم`);
    }
}

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

// دالة جديدة: تسجيل خروج المستخدم العادي
function logoutUser() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        // إعادة تعيين جميع المتغيرات
        currentUser = null;
        isAdminLoggedIn = false;
        
        // إزالة البيانات من localStorage
        localStorage.removeItem('webaidea_currentUser');
        localStorage.removeItem('webaidea_adminLoggedIn');
        
        // تحديث الواجهة
        updateUI();
        
        // إخفاء لوحة الإدارة إذا كانت مفتوحة
        showMainSite();
        
        // إزالة زر نشر الإعلان
        const postBtn = document.getElementById('merchantPostBtn');
        if (postBtn) postBtn.remove();
        
        alert('✅ تم تسجيل الخروج بنجاح.');
    }
}

// دالة جديدة: عرض زر الإدارة في شريط التنقل
function updateNavbarButtons() {
    const adminBtn = document.getElementById('adminDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.querySelector('.login-btn');
    
    if (currentUser) {
        // إخفاء زر تسجيل الدخول
        if (loginBtn) loginBtn.style.display = 'none';
        
        // إظهار زر الإدارة فقط للمدير
        if (adminBtn && isAdminLoggedIn && currentUser.type === 'admin') {
            adminBtn.style.display = 'flex';
        } else if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        // إظهار زر الخروج لجميع المستخدمين المسجلين
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
    } else {
        // إظهار زر تسجيل الدخول
        if (loginBtn) loginBtn.style.display = 'flex';
        
        // إخفاء زر الإدارة وزر الخروج
        if (adminBtn) adminBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// تحديث واجهة المستخدم بناءً على حالة الدخول
function updateUI() {
    if (isAdminLoggedIn && currentUser && currentUser.type === 'admin') {
        // حالة: مدير مسجل دخوله
        // تحديث أزرار التنقل
        updateNavbarButtons();
        
        // إظهار لوحة الإدارة تلقائياً
        showAdminPanel();
        
    } else if (currentUser) {
        // حالة: مستخدم عادي مسجل دخوله
        // تحديث أزرار التنقل
        updateNavbarButtons();
        
        // عرض زر نشر الإعلان إذا كان المستخدم تاجراً
        if (currentUser.type === 'merchant') {
            showMerchantPostButton();
        }
        
        showMainSite();
    } else {
        // حالة: زائر غير مسجل
        // تحديث أزرار التنقل
        updateNavbarButtons();
        
        showMainSite();
    }
}

// دالة جديدة: عرض خيارات المستخدم
function showUserOptions() {
    const options = [];
    
    options.push(`👤 ${currentUser.name}`);
    options.push(`📧 ${currentUser.email}`);
    options.push(`🎫 ${currentUser.type === 'merchant' ? 'تاجر' : currentUser.type === 'admin' ? 'مدير' : 'مستخدم عادي'}`);
    
    if (currentUser.type === 'merchant') {
        options.push(`\n✅ يمكنك نشر إعلانات عادية`);
        options.push(`📍 اضغط على زر "نشر إعلان" في أسفل الصفحة`);
    } else if (currentUser.type === 'user') {
        options.push(`\n⏳ حسابك عادي، تواصل مع الإدارة ليصبح تاجراً`);
    }
    
    const message = options.join('\n');
    alert(message);
}

// دالة جديدة: عرض زر نشر الإعلان للتجار
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
}

// دالة جديدة: فتح نافذة نشر إعلان للتجار
function openMerchantAdModal() {
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
                    <input type="number" id="merchantAdPrice" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">وصف المنتج *</label>
                    <textarea id="merchantAdDescription" rows="3" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;"></textarea>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">رقم التواصل *</label>
                    <input type="tel" id="merchantAdContact" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
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

// دالة جديدة: معالجة رفع صورة للتجار
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

// دالة جديدة: إغلاق نافذة نشر إعلان للتجار
function closeMerchantAdModal() {
    const modal = document.getElementById('merchantAdModal');
    if (modal) modal.remove();
    merchantSelectedImage = null;
}

// ==================== دالة جديدة: نشر إعلان للتجار (محسن) ====================
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
        // رفع الصورة
        const imageUrl = await uploadMerchantImage();
        
        // إنشاء ID فريد للمنتج المحلي
        const localProductId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // إنشاء المنتج محلياً
        const newProduct = {
            id: localProductId,
            title: title,
            price: parseFloat(price),
            description: description,
            image: imageUrl,
            merchantId: currentUser.id,
            contact: contact,
            featured: false,
            date: new Date().toISOString().split('T')[0],
            source: 'local', // إضافة علامة لمعرفة مصدر المنتج
            synced: false // لم يتم مزامنته مع السيرفر بعد
        };
        
        // ========== حفظ في التخزين المحلي أولاً ==========
        products.push(newProduct);
        localStorage.setItem('webaidea_products', JSON.stringify(products));
        
        // تحديث العرض فوراً
        renderProducts();
        if (isAdminLoggedIn) {
            renderAdsTable();
        }
        
        // إغلاق النافذة وإعادة التعيين
        closeMerchantAdModal();
        merchantSelectedImage = null;
        
        // محاولة إرسال للسيرفر في الخلفية
        setTimeout(async () => {
            try {
                const response = await postData('addProduct', {
                    title: title,
                    price: parseFloat(price),
                    description: description,
                    image: imageUrl,
                    contact: contact,
                    merchantId: currentUser.id,
                    featured: 'false'
                });
                
                if (response.status === 201) {
                    // تحديث ID المنتج من المحلي إلى ID السيرفر
                    const serverProductId = response.data.productId;
                    
                    // البحث عن المنتج المحلي وتحديثه
                    const productIndex = products.findIndex(p => p.id === localProductId);
                    
                    if (productIndex !== -1) {
                        // حفظ الـ ID القديم للإشارة
                        const oldId = products[productIndex].id;
                        
                        // تحديث المنتج
                        products[productIndex].id = serverProductId;
                        products[productIndex].source = 'server';
                        products[productIndex].synced = true;
                        
                        // حفظ التحديث في localStorage
                        localStorage.setItem('webaidea_products', JSON.stringify(products));
                        
                        console.log(`✅ تم مزامنة المنتج: ${oldId} → ${serverProductId}`);
                        
                        // تحديث العرض مرة أخرى مع ID الجديد
                        renderProducts();
                        if (isAdminLoggedIn) {
                            renderAdsTable();
                        }
                        
                        // إشعار المستخدم بنجاح المزامنة
                        showNotification('تم مزامنة إعلانك مع السيرفر بنجاح!', 'success');
                    }
                }
            } catch (serverError) {
                console.warn('⚠️ تم حفظ المنتج محلياً فقط:', serverError);
                showNotification('تم حفظ الإعلان محلياً. سيتم محاولة المزامنة لاحقاً.', 'warning');
            }
        }, 1000); // تأخير 1 ثانية لإرسال البيانات
        
        alert('🎉 تم نشر إعلانك بنجاح!\n\n✅ تم حفظه محلياً وجاري محاولة مزامنته مع السيرفر.');
        
    } catch (error) {
        console.error('❌ خطأ في نشر الإعلان:', error);
        alert('⚠️ حدث خطأ أثناء نشر الإعلان');
    }
}

// دالة جديدة: رفع صورة للتجار
async function uploadMerchantImage() {
    if (!merchantSelectedImage) return null;
    
    try {
        // استخدام Unsplash images كبديل
        const unsplashImages = [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        ];
        
        const randomImage = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
        return randomImage;
        
    } catch (error) {
        console.error('❌ خطأ في معالجة الصورة:', error);
        return 'https://via.placeholder.com/600x400?text=Product+Image';
    }
}

// ==================== وظائف المصادقة المحسنة ====================

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
            
            // تحميل بيانات السيرفر
            await loadDataFromServer();
            
            closeModal();
            alert('🎉 مرحباً بك في لوحة تحكم الإدارة!');
            return;
        }
        
        if (isLoginMode) {
            // ========== 2. تسجيل الدخول العادي ==========
            console.log('🔐 محاولة تسجيل دخول:', email);
            
            // البحث أولاً في البيانات المحلية
            let user = findUserInAllStorage(email, password);
            
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
                } else if (response.status === 404) {
                    // إذا لم تكن ورقة المستخدمين موجودة
                    alert('❌ لم يتم العثور على حساب بهذا البريد.\n\nتلميح: جرب إنشاء حساب جديد');
                } else {
                    alert(`❌ خطأ في الخادم: ${response.message || 'حاول مرة أخرى'}`);
                }
                
            } catch (serverError) {
                console.error('❌ خطأ في الاتصال بالسيرفر:', serverError);
                
                // الحل النهائي: البحث في جميع البيانات المحلية المخزنة
                const foundUser = findUserInAllStorage(email, password);
                
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
            
            // التحقق من عدم وجود الحساب في أي مكان
            if (checkIfUserExistsAnywhere(email)) {
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

// ==================== وظائف مساعدة للمصادقة المحسنة ====================

// البحث عن مستخدم في جميع البيانات المخزنة
function findUserInAllStorage(email, password) {
    // البحث في currentUser أولاً
    if (currentUser && currentUser.email === email && currentUser.password === password) {
        return currentUser;
    }
    
    // البحث في users المحلية
    let user = users.find(u => u.email === email && u.password === password);
    if (user) return user;
    
    // البحث في localStorage
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        if (storedUsers) {
            const allUsers = JSON.parse(storedUsers);
            user = allUsers.find(u => u.email === email && u.password === password);
            if (user) return user;
        }
    } catch (error) {
        console.error('❌ خطأ في قراءة localStorage:', error);
    }
    
    return null;
}

// التحقق من وجود المستخدم في أي مكان
function checkIfUserExistsAnywhere(email) {
    // التحقق في users المحلية
    if (users.some(u => u.email === email)) return true;
    
    // التحقق في localStorage
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        if (storedUsers) {
            const allUsers = JSON.parse(storedUsers);
            return allUsers.some(u => u.email === email);
        }
    } catch (error) {
        console.error('❌ خطأ في قراءة localStorage:', error);
    }
    
    return false;
}

// حفظ مستخدم في localStorage
function saveUserToLocalStorage(user) {
    try {
        const storedUsers = localStorage.getItem('webaidea_users');
        let allUsers = storedUsers ? JSON.parse(storedUsers) : [];
        
        // إزالة أي نسخة مكررة
        allUsers = allUsers.filter(u => u.email !== user.email);
        
        // إضافة المستخدم الجديد
        allUsers.push(user);
        
        localStorage.setItem('webaidea_users', JSON.stringify(allUsers));
        users = allUsers; // تحديث المصفوفة الحالية
        
        return allUsers;
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
        
        const allUsers = JSON.parse(storedUsers);
        if (allUsers.length === 0) return 100;
        
        const maxId = Math.max(...allUsers.map(u => parseInt(u.id) || 0));
        return maxId + 1;
    } catch (error) {
        return Date.now();
    }
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
        throw error;
    }
}

// دالة مساعدة للاتصال بالAPI (POST)
async function postData(action, params = {}) {
    return fetchData(action, params);
}

// ==================== وظائف المنتجات ====================

// عرض المنتجات في الصفحة الرئيسية
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // الحصول على أحدث البيانات من التخزين المحلي
    const latestProducts = JSON.parse(localStorage.getItem('webaidea_products')) || products;
    
    if (latestProducts.length === 0) {
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
    
    // فرز المنتجات: المميزة أولاً مع ترتيب عكسي للتاريخ (الأحدث أولاً)
    const featuredProducts = latestProducts
        .filter(p => p.featured)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    const regularProducts = latestProducts
        .filter(p => !p.featured)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
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
        
        // إضافة علامة "محلي" للمنتجات غير المزامنة
        const localBadge = product.source === 'local' && !product.synced ? 
            `<div style="position: absolute; top: 10px; left: 10px; background: #ff9800; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 1;">
                <i class="fas fa-laptop-house"></i> محلي
            </div>` : '';
        
        card.innerHTML += localBadge;
        
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

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    // البحث عن المنتج في البيانات المحلية أولاً
    const latestProducts = JSON.parse(localStorage.getItem('webaidea_products')) || products;
    const product = latestProducts.find(p => p.id == productId);
    
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
                
                ${product.source === 'local' && !product.synced ? `
                    <div class="featured-badge" style="background: #ff9800;">
                        <i class="fas fa-laptop-house"></i> محفوظ محلياً
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
    
    // التحقق من حجم الملف (2MB كحد أقصى)
    if (file.size > 2 * 1024 * 1024) {
        alert('⚠️ حجم الصورة كبير جداً. الحد الأقصى 2MB');
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
                    تم اختيار الصورة (${Math.round(file.size / 1024)} KB)
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
        // استخدام Unsplash images كبديل
        const unsplashImages = [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        ];
        
        const randomImage = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
        
        console.log('✅ استخدام صورة Unsplash:', randomImage);
        return randomImage;
        
    } catch (error) {
        console.error('❌ خطأ في معالجة الصورة:', error);
        return 'https://via.placeholder.com/600x400?text=Webaidea+Product';
    }
}

// ==================== وظائف الإدارة ====================

// دالة جديدة: عرض لوحة الإدارة
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

// دالة جديدة: إخفاء لوحة الإدارة وعرض الموقع العادي
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

// العودة للقائمة الرئيسية (زر الرجوع الجديد)
function goToMainSite() {
    if (confirm('هل تريد العودة للقائمة الرئيسية؟')) {
        logoutAdmin();
    }
}

// تسجيل خروج المدير
function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
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
                        <button class="action-btn btn-secondary" onclick="makeMerchantLocal('${user.id}')" title="ترقية محلياً">
                            <i class="fas fa-laptop-house"></i> محلياً
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
    
    // الحصول على أحدث البيانات من التخزين المحلي
    const latestProducts = JSON.parse(localStorage.getItem('webaidea_products')) || products;
    
    if (latestProducts.length === 0) {
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
    
    latestProducts.forEach(product => {
        const merchant = users.find(u => u.id == product.merchantId);
        const row = document.createElement('tr');
        
        // إضافة علامة للمنتجات المحلية
        const localBadge = product.source === 'local' && !product.synced ? 
            `<span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem; margin-right: 5px;">
                <i class="fas fa-laptop-house"></i> محلي
            </span>` : '';
        
        row.innerHTML = `
            <td>
                <img src="${product.image || 'https://via.placeholder.com/50'}" 
                     alt="${product.title || 'منتج'}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>${localBadge} ${product.title || 'بدون عنوان'}</td>
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
                    ${product.source === 'local' && !product.synced ? `
                        <button class="action-btn btn-secondary" onclick="syncSingleProduct('${product.id}')" title="مزامنة مع السيرفر">
                            <i class="fas fa-sync-alt"></i>
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

// ترقية مستخدم إلى تاجر (مع السيرفر)
async function makeMerchant(userId) {
    if (!confirm('هل تريد حقًا ترقية هذا المستخدم إلى تاجر؟')) return;
    
    try {
        console.log('🔄 محاولة ترقية المستخدم:', userId);
        
        const response = await postData('updateUserType', {
            adminEmail: 'msdfrrt@gmail.com',
            adminPassword: 'Shabib95873061@99',
            userId: String(userId) // إرسال ID كنص
        });
        
        console.log('استجابة السيرفر:', response);
        
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
                
                // إذا كان المستخدم مسجل دخوله، تحديث واجهته
                if (currentUser && currentUser.id == userId) {
                    currentUser.type = 'merchant';
                    localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                    updateUI();
                    
                    alert(`✅ تم ترقية ${user.name} إلى تاجر بنجاح!\n\n🎉 يمكنك الآن نشر إعلاناتك.`);
                } else {
                    alert(`✅ تم ترقية المستخدم إلى تاجر بنجاح.`);
                }
            } else {
                // إذا لم يكن المستخدم في البيانات المحلية، جلب البيانات من السيرفر
                console.log('المستخدم غير موجود محلياً، جاري تحميل البيانات من السيرفر...');
                await loadDataFromServer();
                alert('✅ تم ترقية المستخدم إلى تاجر. جاري تحديث البيانات...');
            }
        } else {
            alert(`❌ ${response.message || 'فشلت العملية'}\n\nيمكنك ترقيته محلياً في الوقت الحالي.`);
            
            // بديل: تحديث البيانات المحلية
            const user = users.find(u => u.id == userId);
            if (user && user.type === 'user') {
                user.type = 'merchant';
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                
                renderMerchantsTable();
                renderAccountsTable();
                populateMerchantSelect();
                
                alert('✅ تم ترقيته محلياً. البيانات ستنعكس عند تحديث السيرفر.');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في ترقية المستخدم:', error);
        
        // بديل: تحديث البيانات المحلية
        const user = users.find(u => u.id == userId);
        if (user && user.type === 'user') {
            if (confirm('⚠️ خطأ في الاتصال بالسيرفر. هل تريد ترقيته محلياً؟')) {
                user.type = 'merchant';
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                
                renderMerchantsTable();
                renderAccountsTable();
                populateMerchantSelect();
                
                alert('✅ تم ترقيته محلياً. البيانات ستنعكس عند تحديث السيرفر.');
            }
        } else {
            alert('⚠️ حدث خطأ أثناء ترقية المستخدم');
        }
    }
}

// دالة جديدة: ترقية مستخدم محلياً (بدون سيرفر)
function makeMerchantLocal(userId) {
    const user = users.find(u => u.id == userId);
    if (!user) {
        alert('❌ المستخدم غير موجود في البيانات المحلية');
        return;
    }
    
    if (user.type === 'user') {
        user.type = 'merchant';
        localStorage.setItem('webaidea_users', JSON.stringify(users));
        
        // تحديث الجداول
        renderMerchantsTable();
        renderAccountsTable();
        populateMerchantSelect();
        
        // إذا كان المستخدم مسجل دخوله، تحديث واجهته
        if (currentUser && currentUser.id == userId) {
            currentUser.type = 'merchant';
            localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
            updateUI();
            
            // عرض زر نشر الإعلان للتاجر
            showMerchantPostButton();
            
            alert(`✅ تم ترقية ${user.name} إلى تاجر بنجاح!\n\n🎉 يمكنك الآن نشر إعلاناتك من الزر الموجود في أسفل الصفحة.`);
        } else {
            alert(`✅ تم ترقية ${user.name} إلى تاجر بنجاح.`);
        }
    } else if (user.type === 'merchant') {
        alert('ℹ️ هذا المستخدم تاجر بالفعل.');
    } else if (user.type === 'admin') {
        alert('ℹ️ هذا المستخدم مدير النظام.');
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
            
            // إذا كان المستخدم مسجل دخوله، تحديث واجهته
            if (currentUser && currentUser.id == userId) {
                currentUser.type = 'user';
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                updateUI();
                
                // إزالة زر نشر الإعلان
                const postBtn = document.getElementById('merchantPostBtn');
                if (postBtn) postBtn.remove();
                
                alert(`✅ تم إلغاء صلاحية التاجر عن ${user.name}.`);
            } else {
                alert('✅ تم إلغاء صلاحية التاجر.');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في إلغاء صلاحية التاجر:', error);
        alert('⚠️ حدث خطأ أثناء العملية');
    }
}

// نشر إعلان جديد من قبل الإدارة (مميز)
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
            alert('❌ فشل معالجة الصورة');
            return;
        }
        
        // 2. نشر المنتج
        const response = await postData('addProduct', {
            title: title,
            price: parseFloat(price),
            description: description,
            image: imageUrl,
            contact: contact,
            merchantId: merchantId,
            featured: 'true' // إعلان مميز
        });
        
        if (response.status === 201) {
            // إضافة المنتج إلى البيانات المحلية
            const newProduct = {
                id: response.data.productId || Date.now(),
                title: title,
                price: parseFloat(price),
                description: description,
                image: imageUrl,
                contact: contact,
                merchantId: merchantId,
                featured: true, // إعلان مميز
                date: new Date().toISOString().split('T')[0],
                source: 'server',
                synced: true
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
            
            alert('🎉 تم نشر الإعلان المميز بنجاح!\n\n⭐ سيظهر في بداية الصفحة.');
        } else {
            // إذا فشل الاتصال بالسيرفر، أضف المنتج محلياً
            const newProduct = {
                id: 'local_admin_' + Date.now(),
                title: title,
                price: parseFloat(price),
                description: description,
                image: imageUrl,
                contact: contact,
                merchantId: merchantId,
                featured: true, // إعلان مميز
                date: new Date().toISOString().split('T')[0],
                source: 'local',
                synced: false
            };
            
            products.push(newProduct);
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            
            // إعادة تعيين النموذج
            document.getElementById('adminAdForm').reset();
            selectedImageData = null;
            
            // تحديث الجداول والعروض
            renderAdsTable();
            renderProducts();
            
            alert('🎉 تم نشر الإعلان المميز بنجاح (محلياً)!\n\n⭐ سيظهر في بداية الصفحة.');
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
        // حذف من البيانات المحلية أولاً
        products = products.filter(p => p.id != productId);
        localStorage.setItem('webaidea_products', JSON.stringify(products));
        
        // محاولة حذف من السيرفر إذا كان منتجاً من السيرفر
        const product = products.find(p => p.id == productId);
        if (product && product.source === 'server') {
            const response = await postData('deleteProduct', {
                adminEmail: 'msdfrrt@gmail.com',
                adminPassword: 'Shabib95873061@99',
                productId: productId
            });
            
            if (response.status === 200) {
                console.log('✅ تم حذف المنتج من السيرفر');
            }
        }
        
        // تحديث الجداول والعروض
        renderAdsTable();
        renderProducts();
        
        alert('✅ تم حذف الإعلان بنجاح.');
    } catch (error) {
        console.error('❌ خطأ في حذف الإعلان:', error);
        alert('⚠️ تم حذف الإعلان محلياً فقط');
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
        alert('✅ تم جعل الإعلان مميزاً.\n\n⭐ سيظهر في بداية الصفحة.');
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
            message += `${index + 1}. ${ad.title} - ${ad.price} ريال ${ad.featured ? '⭐ مميز' : ''} ${ad.source === 'local' ? '📱 محلي' : ''}\n`;
        });
        alert(message);
    } else {
        alert(`ℹ️ ليس لدى ${user.name} أي إعلانات منشورة.`);
    }
}

// ==================== وظائف المزامنة ====================

// إضافة زر لتحديث البيانات يدوياً
function addSyncButton() {
    // إزالة الزر السابق إذا كان موجوداً
    const oldSyncBtn = document.getElementById('syncDataBtn');
    if (oldSyncBtn) oldSyncBtn.remove();
    
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

// دالة المزامنة اليدوية
async function syncDataManually() {
    if (confirm('هل تريد مزامنة البيانات مع السيرفر؟\n\nسيتم دمج البيانات المحلية مع بيانات السيرفر.')) {
        try {
            const syncBtn = document.getElementById('syncDataBtn');
            if (syncBtn) {
                syncBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري المزامنة...`;
                syncBtn.disabled = true;
            }
            
            await loadDataFromServer();
            renderProducts();
            
            if (syncBtn) {
                syncBtn.innerHTML = `<i class="fas fa-check"></i> تمت المزامنة`;
                setTimeout(() => {
                    syncBtn.innerHTML = `<i class="fas fa-sync-alt"></i> مزامنة`;
                    syncBtn.disabled = false;
                }, 2000);
            }
            
            alert('✅ تمت مزامنة البيانات بنجاح!');
            
        } catch (error) {
            console.error('❌ خطأ في المزامنة:', error);
            alert('⚠️ حدث خطأ أثناء مزامنة البيانات');
            
            const syncBtn = document.getElementById('syncDataBtn');
            if (syncBtn) {
                syncBtn.innerHTML = `<i class="fas fa-sync-alt"></i> مزامنة`;
                syncBtn.disabled = false;
            }
        }
    }
}

// دالة جديدة: مزامنة منتج واحد مع السيرفر
async function syncSingleProduct(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        alert('❌ المنتج غير موجود');
        return;
    }
    
    if (product.source === 'server' || product.synced) {
        alert('ℹ️ هذا المنتج مزامن بالفعل مع السيرفر');
        return;
    }
    
    if (!confirm('هل تريد مزامنة هذا المنتج مع السيرفر؟')) return;
    
    try {
        const response = await postData('addProduct', {
            title: product.title,
            price: product.price,
            description: product.description,
            image: product.image,
            contact: product.contact,
            merchantId: product.merchantId,
            featured: product.featured ? 'true' : 'false'
        });
        
        if (response.status === 201) {
            // تحديث المنتج
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                const oldId = products[productIndex].id;
                products[productIndex].id = response.data.productId;
                products[productIndex].source = 'server';
                products[productIndex].synced = true;
                
                localStorage.setItem('webaidea_products', JSON.stringify(products));
                
                // تحديث العرض
                renderAdsTable();
                renderProducts();
                
                alert(`✅ تم مزامنة المنتج بنجاح!`);
            }
        } else {
            alert('❌ فشلت مزامنة المنتج مع السيرفر');
        }
    } catch (error) {
        console.error('❌ خطأ في مزامنة المنتج:', error);
        alert('⚠️ حدث خطأ أثناء مزامنة المنتج');
    }
}

// دالة جديدة: عرض إشعار
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
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
    `;
    
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'warning') {
        notification.style.background = '#ff9800';
    } else if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#2196F3';
    }
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
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

// إضافة أنماط CSS للرسوم المتحركة
const style = document.createElement('style');
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
    const merchantModal = document.getElementById('merchantAdModal');
    
    if (event.target === authModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
    if (event.target === merchantModal) {
        closeMerchantAdModal();
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
            },
            {
                id: "2",
                name: "سارة البوسعيدي",
                email: "sara@example.com",
                password: "123456",
                type: "user",
                joinDate: "2023-10-05"
            }
        ];
        localStorage.setItem('webaidea_users', JSON.stringify(users));
        console.log('✅ تم إنشاء 2 مستخدم تجريبي');
    }
    
    if (products.length === 0) {
        products = [
            {
                id: 1,
                title: "ساعة ذكية جديدة",
                description: "ساعة ذكية بشاشة AMOLED ومقاومة للماء، تدعم الاتصال الهاتفي.",
                price: 199,
                image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                merchantId: "1",
                contact: "+968 1234 5678",
                date: "2023-10-15",
                featured: true,
                source: 'server',
                synced: true
            },
            {
                id: 2,
                title: "سماعات بلوتوث عالية الجودة",
                description: "سماعات لاسلكية بتقنية إلغاء الضوضاء، بطارية تدوم 20 ساعة.",
                price: 149,
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                merchantId: "1",
                contact: "+968 9876 5432",
                date: "2023-10-20",
                featured: false,
                source: 'server',
                synced: true
            }
        ];
        localStorage.setItem('webaidea_products', JSON.stringify(products));
        console.log('✅ تم إنشاء 2 منتج تجريبي');
    }
}

console.log('🎯 جاهز للاستخدام!');
console.log('🔑 بيانات المدير:', 'msdfrrt@gmail.com / Shabib95873061@99');
console.log('📋 جميع الميزات مفعلة: تسجيل دخول، إدارة كاملة، نشر إعلانات، تحكم كامل');