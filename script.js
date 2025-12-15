document.addEventListener('DOMContentLoaded', () => {
    // روابط السكربت - ضع رابطك الجديد هنا
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqMgpu-HDREaLDhtDBjsbalBnGKInQ9pvfRru7RwqF-OeBxO66GoSFCI1drLp2s8ziCA/exec';
    const ADMIN_EMAIL = "msdfrrt@gmail.com";
    
    // عناصر DOM
    const mainNav = document.getElementById('main-nav');
    const productsView = document.getElementById('products-view');
    const authView = document.getElementById('auth-view');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const productsContainer = document.getElementById('products-container');
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    
    // حالة التطبيق
    let currentUser = null;
    let isAdmin = false;
    
    // === دالة الاتصال باستخدام JSONP ===
    async function makeRequest(action, params = {}) {
        return new Promise((resolve, reject) => {
            // إنشاء اسم فريد للدالة callback
            const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2);
            
            // بناء رابط الطلب
            let url = `${SCRIPT_URL}?action=${action}&callback=${callbackName}`;
            
            // إضافة المعاملات
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                }
            });
            
            console.log('🔗 جاري إرسال طلب JSONP:', url);
            
            // تعريف دالة callback مؤقتة
            window[callbackName] = function(data) {
                // تنظيف بعد الاستجابة
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                
                console.log('✅ استجابة JSONP:', data);
                
                if (data && data.status === 'success') {
                    resolve(data);
                } else {
                    reject(new Error(data?.message || 'خطأ غير معروف'));
                }
            };
            
            // إنشاء عنصر script
            const script = document.createElement('script');
            script.src = url;
            
            // معالجة الأخطاء
            script.onerror = function() {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('فشل تحميل السكربت. تأكد من رابط السكربت.'));
            };
            
            // إضافة السكربت للصفحة
            document.body.appendChild(script);
            
            // انتهاء الصلاحية بعد 10 ثواني
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('انتهت مهلة الاتصال بالخادم'));
                }
            }, 10000);
        });
    }
    
    // === دوال العرض ===
    function showView(viewId) {
        [productsView, authView, adminPanel].forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(viewId).classList.remove('hidden');
    }
    
    function updateNavbar() {
        mainNav.innerHTML = '';
        
        if (isAdmin) {
            mainNav.innerHTML = `
                <button id="admin-panel-btn" class="nav-btn">
                    <i class="fas fa-cog"></i> لوحة التحكم
                </button>
                <button id="logout-btn" class="nav-btn">
                    <i class="fas fa-sign-out-alt"></i> تسجيل خروج
                </button>
            `;
        } else if (currentUser) {
            const merchantBtn = currentUser.isMerchant 
                ? `<a href="#" id="post-ad-btn" class="nav-btn">
                      <i class="fas fa-plus"></i> نشر إعلان جديد
                   </a>` 
                : `<a href="https://www.instagram.com/webaidea" target="_blank" class="nav-btn">
                      <i class="fas fa-store"></i> كن تاجراً
                   </a>`;
            
            mainNav.innerHTML = `
                <span class="welcome-msg">
                    <i class="fas fa-user"></i> أهلاً بك, ${currentUser.name}
                </span>
                ${merchantBtn}
                <button id="logout-btn" class="nav-btn">
                    <i class="fas fa-sign-out-alt"></i> تسجيل خروج
                </button>
            `;
        } else {
            mainNav.innerHTML = `
                <button id="login-btn" class="nav-btn">
                    <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                </button>
            `;
        }
        
        // إضافة مستمعي الأحداث
        setTimeout(() => {
            const adminPanelBtn = document.getElementById('admin-panel-btn');
            const loginBtn = document.getElementById('login-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const postAdBtn = document.getElementById('post-ad-btn');
            
            if (adminPanelBtn) {
                adminPanelBtn.addEventListener('click', () => {
                    showView('admin-panel');
                    setupAdminPanel();
                });
            }
            
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    showView('auth-view');
                    showLoginBtn.click();
                });
            }
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
            
            if (postAdBtn) {
                postAdBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showMerchantPostAdForm();
                });
            }
        }, 100);
    }
    
    // === دوال المنتجات ===
    async function fetchAndDisplayProducts() {
        showLoading(productsContainer);
        
        try {
            const data = await makeRequest('getAllProducts');
            
            if (data.status === 'success') {
                displayProducts(data.products);
            } else {
                productsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${data.message || 'حدث خطأ في تحميل المنتجات'}</p>
                        <button onclick="fetchAndDisplayProducts()">إعادة المحاولة</button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ خطأ في جلب المنتجات:', error);
            productsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-wifi-slash"></i>
                    <p>لا يمكن الاتصال بالخادم</p>
                    <p><small>${error.message}</small></p>
                    <button onclick="fetchAndDisplayProducts()">إعادة المحاولة</button>
                </div>
            `;
        }
    }
    
    function displayProducts(products) {
        productsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات حالياً</h3>
                    <p>كن أول من ينشر منتجاً!</p>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = `product-card ${product.isFeatured ? 'featured' : ''}`;
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'">
                    ${product.isFeatured ? '<span class="featured-badge">مميز</span>' : ''}
                </div>
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-meta">
                        <span class="posted-by">
                            <i class="fas fa-user"></i> ${product.postedBy || 'غير معروف'}
                        </span>
                        <span class="product-date">
                            <i class="fas fa-calendar"></i> ${formatDate(product.datePosted)}
                        </span>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
    }
    
    function showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'غير معروف';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA');
        } catch (e) {
            return 'غير معروف';
        }
    }
    
    // === تسجيل الدخول والتسجيل ===
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        if (password.length < 4) {
            showAlert('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
            return;
        }
        
        const loginBtn = loginForm.querySelector('button');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        loginBtn.disabled = true;
        
        try {
            const data = await makeRequest('login', { email, password });
            
            if (data.status === 'success') {
                currentUser = data.user;
                isAdmin = data.isAdmin;
                updateNavbar();
                
                if (isAdmin) {
                    showView('admin-panel');
                    setupAdminPanel();
                    showAlert(`مرحباً بك يا مدير ${currentUser.name}!`, 'success');
                } else {
                    showView('products-view');
                    fetchAndDisplayProducts();
                    showAlert(`مرحباً بك ${currentUser.name}!`, 'success');
                }
                
                // مسح الحقول
                loginForm.reset();
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            showAlert(error.message || 'فشل الاتصال بالخادم', 'error');
        } finally {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    });
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        
        if (name.length < 2) {
            showAlert('الاسم يجب أن يكون حرفين على الأقل', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return;
        }
        
        if (password.length < 4) {
            showAlert('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
            return;
        }
        
        const registerBtn = registerForm.querySelector('button');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        registerBtn.disabled = true;
        
        try {
            const data = await makeRequest('register', { name, email, password });
            
            if (data.status === 'success') {
                // تسجيل الدخول تلقائياً بعد التسجيل
                currentUser = data.user;
                updateNavbar();
                showView('products-view');
                fetchAndDisplayProducts();
                showAlert(data.message, 'success');
                registerForm.reset();
                showLoginBtn.click();
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ خطأ في التسجيل:', error);
            showAlert(error.message || 'فشل الاتصال بالخادم', 'error');
        } finally {
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    });
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showAlert(message, type = 'info') {
        // إزالة أي تنبيهات سابقة
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="close-alert">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // إظهار التنبيه
        setTimeout(() => alert.classList.add('show'), 10);
        
        // إغلاق التنبيه
        alert.querySelector('.close-alert').addEventListener('click', () => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        });
        
        // إغلاق تلقائي بعد 5 ثواني
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
    
    // === تسجيل الخروج ===
    function handleLogout() {
        currentUser = null;
        isAdmin = false;
        updateNavbar();
        showView('products-view');
        fetchAndDisplayProducts();
        showAlert('تم تسجيل الخروج بنجاح', 'success');
    }
    
    // === تبديل نماذج الدخول/التسجيل ===
    showLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    });
    
    showRegisterBtn.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
    });
    
    // === لوحة تحكم المدير ===
    async function setupAdminPanel() {
        showLoading(document.getElementById('admin-content-area'));
        await fetchAndDisplayUsers();
        await fetchAndDisplayAdminAds();
        
        // علامات التبويب
        const adminNavBtns = document.querySelectorAll('.admin-nav button');
        const adminSubViews = document.querySelectorAll('.admin-sub-view');
        
        adminNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetViewId = btn.dataset.view;
                adminSubViews.forEach(view => view.classList.add('hidden'));
                document.getElementById(targetViewId).classList.remove('hidden');
                adminNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // البحث
        const searchInput = document.getElementById('search-user');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#accounts-table-body tr');
                rows.forEach(row => {
                    const email = row.cells[1].textContent.toLowerCase();
                    const name = row.cells[0].textContent.toLowerCase();
                    row.style.display = (email.includes(searchTerm) || name.includes(searchTerm)) ? '' : 'none';
                });
            });
        }
        
        // نشر إعلان إداري
        const adminPostForm = document.getElementById('admin-post-ad-form');
        if (adminPostForm) {
            adminPostForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('admin-product-name').value.trim();
                const desc = document.getElementById('admin-product-desc').value.trim();
                const imgUrl = document.getElementById('admin-product-image').value.trim();
                const isFeatured = document.getElementById('is-featured-ad').checked;
                
                if (!name || !desc) {
                    showAlert('اسم المنتج والوصف مطلوبان', 'error');
                    return;
                }
                
                const data = await makeRequest('addProduct', {
                    productName: name,
                    description: desc,
                    imageUrl: imgUrl || 'https://via.placeholder.com/300x200.png?text=No+Image',
                    postedBy: ADMIN_EMAIL,
                    isFeatured: isFeatured
                });
                
                showAlert(data.message, data.status);
                
                if (data.status === 'success') {
                    adminPostForm.reset();
                    await fetchAndDisplayAdminAds();
                    await fetchAndDisplayProducts();
                }
            });
        }
    }
    
    async function fetchAndDisplayUsers() {
        try {
            const data = await makeRequest('getAllUsers');
            if (data.status === 'success') {
                displayUsers(data.users);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            showAlert('خطأ في تحميل المستخدمين', 'error');
        }
    }
    
    function displayUsers(users) {
        const accountsTableBody = document.getElementById('accounts-table-body');
        const merchantsTableBody = document.getElementById('merchants-table-body');
        
        accountsTableBody.innerHTML = '';
        merchantsTableBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            accountsTableBody.innerHTML = '<tr><td colspan="3">لا يوجد مستخدمون مسجلون</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    ${user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() 
                        ? (user.isMerchant 
                            ? `<button class="btn revoke-btn" data-email="${user.email}">
                                 <i class="fas fa-user-minus"></i> إلغاء التاجر
                               </button>`
                            : `<button class="btn approve-btn" data-email="${user.email}">
                                 <i class="fas fa-user-plus"></i> جعله تاجراً
                               </button>`
                          )
                        : '<span class="admin-badge"><i class="fas fa-crown"></i> مدير النظام</span>'
                    }
                </td>
            `;
            
            if (user.isMerchant && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                merchantsTableBody.appendChild(row.cloneNode(true));
            }
            
            if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                accountsTableBody.appendChild(row);
            }
        });
        
        // إضافة مستمعي الأحداث
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, true));
        });
        
        document.querySelectorAll('.revoke-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, false));
        });
    }
    
    async function toggleMerchantStatus(email, makeMerchant) {
        const action = makeMerchant ? 'ترقية' : 'إلغاء ترقية';
        if (!confirm(`هل أنت متأكد من ${action} المستخدم ${email}؟`)) return;
        
        const data = await makeRequest('toggleMerchantStatus', { email });
        showAlert(data.message, data.status);
        
        if (data.status === 'success') {
            await fetchAndDisplayUsers();
        }
    }
    
    async function fetchAndDisplayAdminAds() {
        try {
            const data = await makeRequest('getAllProducts');
            if (data.status === 'success') {
                displayAdminAds(data.products);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب الإعلانات:', error);
        }
    }
    
    function displayAdminAds(products) {
        const adminAdsContainer = document.getElementById('admin-ads-container');
        adminAdsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            adminAdsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ad"></i>
                    <h3>لا توجد إعلانات منشورة</h3>
                    <p>ابدأ بنشر أول إعلان من لوحة التحكم</p>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = `product-card ${product.isFeatured ? 'featured' : ''}`;
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x220.png?text=صورة+غير+متوفرة'">
                    ${product.isFeatured ? '<span class="featured-badge">مميز</span>' : ''}
                </div>
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-meta">
                        <span class="posted-by">
                            <i class="fas fa-user"></i> ${product.postedBy}
                        </span>
                        <span class="product-id">#${product.id}</span>
                    </div>
                    ${product.isFeatured ? '<div class="featured-tag">إعلان مميز</div>' : ''}
                </div>
            `;
            adminAdsContainer.appendChild(card);
        });
    }
    
    // === نشر إعلان للتاجر ===
    function showMerchantPostAdForm() {
        if (!currentUser || !currentUser.isMerchant) {
            showAlert('يجب أن تكون تاجراً لنشر إعلان', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle"></i> نشر إعلان جديد</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="merchant-post-form" class="auth-form">
                        <div class="form-group">
                            <label for="merchant-product-name">اسم المنتج *</label>
                            <input type="text" id="merchant-product-name" required>
                        </div>
                        <div class="form-group">
                            <label for="merchant-product-desc">وصف المنتج *</label>
                            <textarea id="merchant-product-desc" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="merchant-product-image">رابط صورة المنتج</label>
                            <input type="url" id="merchant-product-image" 
                                   placeholder="https://example.com/image.jpg">
                            <small class="form-hint">اتركه فارغاً لاستخدام صورة افتراضية</small>
                        </div>
                        <div class="form-buttons">
                            <button type="submit" class="btn primary-btn">
                                <i class="fas fa-paper-plane"></i> نشر الإعلان
                            </button>
                            <button type="button" class="btn secondary-btn" id="cancel-post">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // إغلاق المودال
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-post').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // إرسال النموذج
        modal.querySelector('#merchant-post-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('merchant-product-name').value.trim();
            const desc = document.getElementById('merchant-product-desc').value.trim();
            const imgUrl = document.getElementById('merchant-product-image').value.trim();
            
            if (!name || !desc) {
                showAlert('اسم المنتج والوصف مطلوبان', 'error');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
            submitBtn.disabled = true;
            
            try {
                const data = await makeRequest('addProduct', {
                    productName: name,
                    description: desc,
                    imageUrl: imgUrl || '',
                    postedBy: currentUser.email,
                    isFeatured: false
                });
                
                if (data.status === 'success') {
                    modal.remove();
                    showAlert(data.message, 'success');
                    fetchAndDisplayProducts();
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('❌ خطأ في نشر الإعلان:', error);
                showAlert(error.message || 'فشل نشر الإعلان', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // === بدء التطبيق ===
    async function initializeApp() {
        console.log('🚀 بدء تشغيل WebAidea...');
        
        // اختبار الاتصال
        try {
            const testResult = await makeRequest('ping');
            console.log('✅ اتصال السكربت:', testResult);
            
            if (testResult.status === 'success') {
                console.log('✅ السكربت يعمل بشكل صحيح');
            }
        } catch (error) {
            console.warn('⚠️ تحذير: هناك مشكلة في الاتصال بالسكربت:', error.message);
        }
        
        // تحميل البيانات
        updateNavbar();
        fetchAndDisplayProducts();
        showLoginBtn.click();
        
        // إضافة زر اختبار في الشريط (للإدارة فقط)
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            const testBtn = document.createElement('button');
            testBtn.innerHTML = '<i class="fas fa-vial"></i> اختبار الاتصال';
            testBtn.className = 'nav-btn test-btn';
            testBtn.style.marginLeft = '10px';
            testBtn.style.background = '#9b59b6';
            
            testBtn.addEventListener('click', async () => {
                try {
                    const result = await makeRequest('ping');
                    alert(JSON.stringify(result, null, 2));
                } catch (error) {
                    alert('خطأ: ' + error.message);
                }
            });
            
            mainNav.appendChild(testBtn);
        }
    }
    
    // بدء التطبيق
    initializeApp();
});

// إضافة دوال عامة للاستخدام من HTML
window.fetchAndDisplayProducts = function() {
    window.location.reload();
};