document.addEventListener('DOMContentLoaded', () => {
    // ===== التهيئة =====
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqMgpu-HDREaLDhtDBjsbalBnGKInQ9pvfRru7RwqF-OeBxO66GoSFCI1drLp2s8ziCA/exec';
    const ADMIN_EMAIL = "msdfrrt@gmail.com";
    const WHATSAPP_NUMBER = "+96812345678";
    
    // ===== المتغيرات العالمية =====
    let currentUser = null;
    let isAdmin = false;
    let allProducts = [];
    let allUsers = [];
    let uploadedImages = [];
    
    // ===== عناصر DOM الرئيسية =====
    const elements = {
        mainNav: document.getElementById('main-nav'),
        productsView: document.getElementById('products-view'),
        authView: document.getElementById('auth-view'),
        adminPanel: document.getElementById('admin-panel'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        productsContainer: document.getElementById('products-container'),
        businessAlert: document.getElementById('business-activation-alert'),
        closeBusinessAlert: document.getElementById('close-business-alert'),
        productSearch: document.getElementById('product-search'),
        priceRange: document.getElementById('price-range'),
        priceValue: document.getElementById('price-value'),
        floatAddProduct: document.getElementById('float-add-product'),
        floatWhatsapp: document.getElementById('float-whatsapp'),
        adminProductsContainer: document.getElementById('admin-products-container'),
        accountsTableBody: document.getElementById('accounts-table-body'),
        merchantsTableBody: document.getElementById('merchants-table-body'),
        businessRequestsBody: document.getElementById('business-requests-body'),
        adminProductForm: document.getElementById('admin-product-form'),
        userProductModal: document.getElementById('user-product-modal'),
        productDetailsModal: document.getElementById('product-details-modal')
    };
    
    // ===== دالة الاتصال الرئيسية =====
    async function makeRequest(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).substr(2)}`;
            
            let url = `${SCRIPT_URL}?action=${action}&callback=${callbackName}`;
            
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                }
            });
            
            console.log(`📡 Request: ${action}`, params);
            
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                
                console.log(`✅ Response: ${action}`, data);
                
                if (data && data.status === 'success') {
                    resolve(data);
                } else {
                    reject(new Error(data?.message || 'حدث خطأ غير معروف'));
                }
            };
            
            const script = document.createElement('script');
            script.src = url;
            
            script.onerror = () => {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('فشل الاتصال بالخادم'));
            };
            
            document.body.appendChild(script);
            
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('انتهت مهلة الاتصال'));
                }
            }, 15000);
        });
    }
    
    // ===== دوال العرض والتنقل =====
    function showView(viewId) {
        const views = ['products-view', 'auth-view', 'admin-panel'];
        views.forEach(view => {
            const element = document.getElementById(view);
            if (element) element.classList.add('hidden');
        });
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // إظهار/إخفاء الأزرار العائمة
        if (viewId === 'products-view') {
            document.querySelector('.floating-buttons').classList.remove('hidden');
        } else {
            document.querySelector('.floating-buttons').classList.add('hidden');
        }
        
        // تحديث عنوان الصفحة
        updatePageTitle(viewId);
    }
    
    function updatePageTitle(viewId) {
        const titles = {
            'products-view': 'المنتجات - WebAidea عُمان',
            'auth-view': 'تسجيل الدخول - WebAidea عُمان',
            'admin-panel': 'لوحة التحكم - WebAidea عُمان'
        };
        
        document.title = titles[viewId] || 'WebAidea عُمان';
    }
    
    function updateNavbar() {
        let navHTML = '';
        
        if (isAdmin && currentUser && currentUser.email === ADMIN_EMAIL) {
            navHTML = `
                <button id="admin-panel-btn" class="nav-btn">
                    <i class="fas fa-cog"></i> لوحة التحكم
                </button>
                <button id="logout-btn" class="nav-btn">
                    <i class="fas fa-sign-out-alt"></i> تسجيل خروج
                </button>
            `;
        } else if (currentUser) {
            navHTML = `
                <span class="welcome-msg">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </span>
                ${currentUser.isMerchant ? `
                    <button id="post-product-btn" class="nav-btn">
                        <i class="fas fa-plus"></i> نشر منتج
                    </button>
                ` : ''}
                <button id="logout-btn" class="nav-btn">
                    <i class="fas fa-sign-out-alt"></i> تسجيل خروج
                </button>
            `;
        } else {
            navHTML = `
                <button id="login-btn" class="nav-btn">
                    <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                </button>
                <button id="register-btn" class="nav-btn">
                    <i class="fas fa-user-plus"></i> إنشاء حساب
                </button>
            `;
        }
        
        elements.mainNav.innerHTML = navHTML;
        
        // إضافة مستمعي الأحداث
        setTimeout(() => {
            const adminPanelBtn = document.getElementById('admin-panel-btn');
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const postProductBtn = document.getElementById('post-product-btn');
            
            if (adminPanelBtn) adminPanelBtn.addEventListener('click', () => {
                showView('admin-panel');
                setupAdminPanel();
            });
            
            if (loginBtn) loginBtn.addEventListener('click', showLoginForm);
            if (registerBtn) registerBtn.addEventListener('click', showRegisterForm);
            if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
            if (postProductBtn) postProductBtn.addEventListener('click', showUserProductForm);
        }, 100);
    }
    
    // ===== دوال المنتجات =====
    async function fetchAndDisplayProducts() {
        showLoading(elements.productsContainer);
        
        try {
            const data = await makeRequest('getAllProducts');
            
            if (data.status === 'success') {
                allProducts = data.products || [];
                displayProducts(allProducts);
                setupProductFilters();
            } else {
                showError('حدث خطأ في تحميل المنتجات');
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            showError('لا يمكن الاتصال بالخادم');
        }
    }
    
    function displayProducts(products) {
        if (!elements.productsContainer) return;
        
        elements.productsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            elements.productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات حالياً</h3>
                    <p>كن أول من ينشر منتجاً!</p>
                    ${currentUser && currentUser.isMerchant ? `
                        <button class="btn btn-primary" onclick="showUserProductForm()">
                            <i class="fas fa-plus"></i> نشر منتج جديد
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const productCard = createProductCard(product);
            elements.productsContainer.appendChild(productCard);
        });
    }
    
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const isNew = isProductNew(product.datePosted);
        const price = formatPrice(product.price);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x200.png?text=لا+توجد+صورة'}" 
                     alt="${product.name}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200.png?text=صورة+غير+متوفرة'">
                
                <div class="product-badges">
                    ${product.isFeatured ? `
                        <div class="featured-badge">
                            <i class="fas fa-star"></i> مميز
                        </div>
                    ` : ''}
                    
                    ${isNew ? `
                        <div class="new-badge">
                            <i class="fas fa-fire"></i> جديد
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-price">${price}</div>
            </div>
            
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                
                <div class="product-meta">
                    <div class="product-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${product.location || 'غير محدد'}</span>
                    </div>
                    
                    <div class="product-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(product.datePosted)}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => showProductDetails(product));
        
        return card;
    }
    
    function setupProductFilters() {
        // فلترة بالبحث
        if (elements.productSearch) {
            elements.productSearch.addEventListener('input', filterProducts);
        }
        
        // فلترة بالسعر
        if (elements.priceRange && elements.priceValue) {
            elements.priceRange.addEventListener('input', function() {
                const value = this.value;
                elements.priceValue.textContent = value === '1000' ? 'أي سعر' : `حتى ${value} ر.ع`;
                filterProducts();
            });
        }
        
        // فلترة بالأزرار
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterProducts();
            });
        });
    }
    
    function filterProducts() {
        const searchTerm = elements.productSearch?.value.toLowerCase() || '';
        const maxPrice = parseInt(elements.priceRange?.value) || 1000;
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        
        const filtered = allProducts.filter(product => {
            // البحث النصي
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                 product.description.toLowerCase().includes(searchTerm) ||
                                 product.category?.toLowerCase().includes(searchTerm);
            
            // السعر
            const price = parseFloat(product.price) || 0;
            const matchesPrice = price <= maxPrice;
            
            // الفلتر النشط
            let matchesFilter = true;
            if (activeFilter === 'featured') matchesFilter = product.isFeatured;
            if (activeFilter === 'new') matchesFilter = isProductNew(product.datePosted);
            
            return matchesSearch && matchesPrice && matchesFilter;
        });
        
        displayProducts(filtered);
    }
    
    // ===== تفاصيل المنتج =====
    function showProductDetails(product) {
        const modal = elements.productDetailsModal;
        if (!modal) return;
        
        const price = formatPrice(product.price);
        const isNew = isProductNew(product.datePosted);
        
        modal.innerHTML = `
            <div class="modal-content details-modal">
                <div class="modal-header">
                    <h3>${product.name}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="product-images">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/500x300.png?text=لا+توجد+صورة'}" 
                             alt="${product.name}"
                             class="main-image">
                    </div>
                    
                    <div class="product-info">
                        <div class="price-section">
                            <span class="price">${price}</span>
                            ${product.negotiable ? '<span class="negotiable-badge">قابل للتفاوض</span>' : ''}
                        </div>
                        
                        <div class="product-category">
                            <i class="fas fa-tag"></i>
                            <span>${product.category || 'غير محدد'}</span>
                        </div>
                        
                        <div class="product-condition">
                            <i class="fas fa-certificate"></i>
                            <span>${getConditionText(product.condition)}</span>
                        </div>
                        
                        <div class="product-description-full">
                            <h4>وصف المنتج:</h4>
                            <p>${product.description}</p>
                        </div>
                        
                        <div class="seller-info">
                            <h4>معلومات البائع:</h4>
                            <div class="seller-details">
                                <div class="seller-name">
                                    <i class="fas fa-user"></i>
                                    <span>${product.postedByName || product.postedBy}</span>
                                </div>
                                
                                <div class="seller-phone">
                                    <i class="fas fa-phone"></i>
                                    <span>${product.phone || 'غير متوفر'}</span>
                                </div>
                                
                                <div class="seller-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${product.location || 'غير محدد'}</span>
                                </div>
                                
                                <div class="seller-date">
                                    <i class="fas fa-calendar"></i>
                                    <span>${formatDate(product.datePosted)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="product-actions">
                            <button class="btn btn-whatsapp btn-block" id="whatsapp-contact">
                                <i class="fab fa-whatsapp"></i> تواصل عبر واتساب
                            </button>
                            
                            <button class="btn btn-primary btn-block" id="call-contact">
                                <i class="fas fa-phone"></i> الاتصال
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة مستمعي الأحداث لأزرار الاتصال
        setTimeout(() => {
            const whatsappBtn = document.getElementById('whatsapp-contact');
            const callBtn = document.getElementById('call-contact');
            
            if (whatsappBtn && product.phone) {
                whatsappBtn.addEventListener('click', () => {
                    const message = `مرحباً، أنا مهتم بالمنتج: ${product.name}`;
                    const whatsappUrl = `https://wa.me/${product.phone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                });
            }
            
            if (callBtn && product.phone) {
                callBtn.addEventListener('click', () => {
                    window.location.href = `tel:${product.phone}`;
                });
            }
            
            // إغلاق النافذة
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }, 100);
        
        modal.classList.remove('hidden');
    }
    
    // ===== نماذج المستخدم =====
    function showLoginForm() {
        showView('auth-view');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('show-login').classList.add('active');
    }
    
    function showRegisterForm() {
        showView('auth-view');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('show-register').classList.add('active');
    }
    
    // تسجيل الدخول
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const btn = elements.loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // التحقق من البيانات
            if (!validateEmail(email)) {
                showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
                return;
            }
            
            if (password.length < 6) {
                showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                return;
            }
            
            // تغيير حالة الزر
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
            btn.disabled = true;
            
            try {
                const data = await makeRequest('login', { email, password });
                
                if (data.status === 'success') {
                    currentUser = data.user;
                    isAdmin = data.isAdmin && currentUser.email === ADMIN_EMAIL;
                    
                    // حفظ في localStorage
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isAdmin', isAdmin.toString());
                    
                    updateNavbar();
                    showView('products-view');
                    fetchAndDisplayProducts();
                    
                    showAlert(`مرحباً بعودتك ${currentUser.name}!`, 'success');
                    elements.loginForm.reset();
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                showAlert('فشل تسجيل الدخول. تحقق من بياناتك.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // إنشاء حساب
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const phone = document.getElementById('register-phone').value.trim();
            const governorate = document.getElementById('register-governorate').value;
            const address = document.getElementById('register-address').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const businessAccount = document.getElementById('business-account').checked;
            const btn = elements.registerForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // التحقق من البيانات
            if (!validateRegistration(name, email, phone, password, confirmPassword, governorate)) {
                return;
            }
            
            // تغيير حالة الزر
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
            btn.disabled = true;
            
            try {
                const data = await makeRequest('register', {
                    name,
                    email,
                    phone,
                    password,
                    governorate,
                    address,
                    wantsBusiness: businessAccount
                });
                
                if (data.status === 'success') {
                    currentUser = data.user;
                    isAdmin = data.isAdmin && currentUser.email === ADMIN_EMAIL;
                    
                    // حفظ في localStorage
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isAdmin', isAdmin.toString());
                    
                    updateNavbar();
                    showView('products-view');
                    fetchAndDisplayProducts();
                    
                    showAlert(data.message, 'success');
                    elements.registerForm.reset();
                    
                    // إظهار تنبيه Business إذا تم اختياره
                    if (businessAccount) {
                        showBusinessAlert();
                    }
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('❌ Registration error:', error);
                showAlert('فشل إنشاء الحساب. حاول مرة أخرى.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // ===== لوحة التحكم =====
    async function setupAdminPanel() {
        try {
            // تحميل البيانات
            const [usersData, productsData] = await Promise.all([
                makeRequest('getAllUsers'),
                makeRequest('getAllProducts')
            ]);
            
            if (usersData.status === 'success') {
                allUsers = usersData.users || [];
                displayAdminUsers(allUsers);
                updateAdminStats(allUsers, productsData.products || []);
            }
            
            if (productsData.status === 'success') {
                displayAdminProducts(productsData.products || []);
            }
            
            // إعداد علامات التبويب
            setupAdminTabs();
            
            // إعداد البحث
            if (elements.searchUser) {
                elements.searchUser.addEventListener('input', searchAdminUsers);
            }
            
            // إعداد نموذج إضافة منتج
            if (elements.adminProductForm) {
                setupAdminProductForm();
            }
            
        } catch (error) {
            console.error('❌ Error setting up admin panel:', error);
            showAlert('حدث خطأ في تحميل بيانات لوحة التحكم', 'error');
        }
    }
    
    function displayAdminUsers(users) {
        if (!elements.accountsTableBody || !elements.merchantsTableBody || !elements.businessRequestsBody) return;
        
        // مسح الجداول
        elements.accountsTableBody.innerHTML = '';
        elements.merchantsTableBody.innerHTML = '';
        elements.businessRequestsBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            elements.accountsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">لا يوجد مستخدمون مسجلون</td>
                </tr>
            `;
            return;
        }
        
        let totalUsers = 0;
        let totalMerchants = 0;
        let businessRequests = 0;
        
        users.forEach(user => {
            totalUsers++;
            
            if (user.isMerchant) totalMerchants++;
            if (user.wantsBusiness) businessRequests++;
            
            // تخطي المدير
            if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return;
            
            // جدول جميع الحسابات
            const accountRow = createUserRow(user);
            elements.accountsTableBody.appendChild(accountRow);
            
            // جدول التجار
            if (user.isMerchant) {
                const merchantRow = createUserRow(user);
                elements.merchantsTableBody.appendChild(merchantRow);
            }
            
            // جدول طلبات Business
            if (user.wantsBusiness && !user.businessActivated) {
                const businessRow = createBusinessRequestRow(user);
                elements.businessRequestsBody.appendChild(businessRow);
            }
        });
        
        // تحديث الإحصائيات
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-merchants').textContent = totalMerchants;
        document.getElementById('total-products').textContent = allProducts.length;
    }
    
    function createUserRow(user) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'غير متوفر'}</td>
            <td>${user.governorate || 'غير محدد'}</td>
            <td>
                ${user.wantsBusiness ? 
                    (user.businessActivated ? 
                        '<span class="status-badge success"><i class="fas fa-check"></i> مفعل</span>' : 
                        '<span class="status-badge warning"><i class="fas fa-clock"></i> قيد الانتظار</span>') : 
                    '<span class="status-badge">غير مفعل</span>'
                }
            </td>
            <td class="actions">
                ${!user.isMerchant ? `
                    <button class="btn btn-small btn-primary make-merchant-btn" data-email="${user.email}">
                        <i class="fas fa-user-plus"></i> تاجر
                    </button>
                ` : `
                    <button class="btn btn-small btn-warning revoke-merchant-btn" data-email="${user.email}">
                        <i class="fas fa-user-minus"></i> إلغاء
                    </button>
                `}
                
                ${user.wantsBusiness && !user.businessActivated ? `
                    <button class="btn btn-small btn-success activate-business-btn" data-email="${user.email}">
                        <i class="fas fa-crown"></i> تفعيل
                    </button>
                ` : ''}
            </td>
        `;
        
        return row;
    }
    
    function createBusinessRequestRow(user) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'غير متوفر'}</td>
            <td>${user.governorate || 'غير محدد'}</td>
            <td>${formatDate(user.joinDate)}</td>
            <td class="actions">
                <button class="btn btn-small btn-success approve-business-btn" data-email="${user.email}">
                    <i class="fas fa-check"></i> قبول
                </button>
                <button class="btn btn-small btn-danger reject-business-btn" data-email="${user.email}">
                    <i class="fas fa-times"></i> رفض
                </button>
            </td>
        `;
        
        return row;
    }
    
    function searchAdminUsers() {
        const searchTerm = elements.searchUser.value.toLowerCase();
        const rows = elements.accountsTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let shouldShow = false;
            
            cells.forEach(cell => {
                if (cell.textContent.toLowerCase().includes(searchTerm)) {
                    shouldShow = true;
                }
            });
            
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    function displayAdminProducts(products) {
        if (!elements.adminProductsContainer) return;
        
        elements.adminProductsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            elements.adminProductsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات</h3>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const productCard = createProductCard(product);
            elements.adminProductsContainer.appendChild(productCard);
        });
    }
    
    function setupAdminTabs() {
        const tabButtons = document.querySelectorAll('.admin-nav button');
        const tabViews = document.querySelectorAll('.admin-sub-view');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetView = button.dataset.view;
                
                // تحديث الأزرار النشطة
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // إظهار العرض المطلوب
                tabViews.forEach(view => view.classList.add('hidden'));
                document.getElementById(targetView).classList.remove('hidden');
            });
        });
    }
    
    function setupAdminProductForm() {
        elements.adminProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(elements.adminProductForm);
            const productData = {
                name: document.getElementById('admin-product-name').value.trim(),
                category: document.getElementById('admin-product-category').value,
                description: document.getElementById('admin-product-desc').value.trim(),
                price: document.getElementById('admin-product-price').value,
                condition: document.getElementById('admin-product-condition').value,
                location: document.getElementById('admin-product-location').value,
                phone: '+968' + document.getElementById('admin-product-phone').value.trim(),
                featured: document.getElementById('admin-product-featured').checked,
                negotiable: document.getElementById('admin-product-negotiable').checked,
                postedBy: ADMIN_EMAIL,
                postedByName: 'الإدارة'
            };
            
            // التحقق من البيانات
            if (!validateProductData(productData)) return;
            
            const btn = elements.adminProductForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
            btn.disabled = true;
            
            try {
                const data = await makeRequest('addProduct', productData);
                
                if (data.status === 'success') {
                    showAlert('تم نشر المنتج بنجاح!', 'success');
                    elements.adminProductForm.reset();
                    uploadedImages = [];
                    
                    // تحديث قائمة المنتجات
                    const productsData = await makeRequest('getAllProducts');
                    if (productsData.status === 'success') {
                        displayAdminProducts(productsData.products || []);
                        updateAdminStats(allUsers, productsData.products || []);
                    }
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('❌ Error adding product:', error);
                showAlert('حدث خطأ أثناء نشر المنتج', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    function updateAdminStats(users, products) {
        const totalUsers = users.length;
        const totalMerchants = users.filter(u => u.isMerchant).length;
        const totalProducts = products.length;
        
        if (document.getElementById('total-users')) {
            document.getElementById('total-users').textContent = totalUsers;
        }
        
        if (document.getElementById('total-merchants')) {
            document.getElementById('total-merchants').textContent = totalMerchants;
        }
        
        if (document.getElementById('total-products')) {
            document.getElementById('total-products').textContent = totalProducts;
        }
    }
    
    // ===== نموذج نشر المنتج للمستخدمين =====
    function showUserProductForm() {
        if (!currentUser || !currentUser.isMerchant) {
            showAlert('يجب أن تكون تاجراً لنشر منتجات', 'error');
            return;
        }
        
        const modal = elements.userProductModal;
        const form = document.getElementById('user-product-form');
        
        if (!modal || !form) return;
        
        form.innerHTML = `
            <div class="form-group">
                <label for="user-product-name">
                    <i class="fas fa-tag"></i> اسم المنتج *
                </label>
                <input type="text" id="user-product-name" placeholder="اسم المنتج" required>
            </div>
            
            <div class="form-group">
                <label for="user-product-category">
                    <i class="fas fa-list"></i> الفئة *
                </label>
                <select id="user-product-category" required>
                    <option value="">اختر الفئة</option>
                    <option value="الكترونيات">الكترونيات</option>
                    <option value="موبايلات">موبايلات</option>
                    <option value="سيارات">سيارات</option>
                    <option value="عقارات">عقارات</option>
                    <option value="أثاث">أثاث</option>
                    <option value="ملابس">ملابس</option>
                    <option value="خدمات">خدمات</option>
                    <option value="أخرى">أخرى</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="user-product-desc">
                    <i class="fas fa-file-alt"></i> وصف المنتج *
                </label>
                <textarea id="user-product-desc" rows="4" placeholder="صف منتجك بالتفصيل..." required></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="user-product-price">
                        <i class="fas fa-coins"></i> السعر (ريال عماني) *
                    </label>
                    <input type="number" id="user-product-price" placeholder="السعر" min="0" step="0.5" required>
                </div>
                
                <div class="form-group">
                    <label for="user-product-condition">
                        <i class="fas fa-certificate"></i> الحالة *
                    </label>
                    <select id="user-product-condition" required>
                        <option value="">اختر الحالة</option>
                        <option value="جديد">جديد</option>
                        <option value="مستعمل-جيد">مستعمل (جيد)</option>
                        <option value="مستعمل-متوسط">مستعمل (متوسط)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="user-product-location">
                        <i class="fas fa-map-marker-alt"></i> المكان *
                    </label>
                    <select id="user-product-location" required>
                        <option value="">اختر المحافظة</option>
                        <option value="مسقط">مسقط</option>
                        <option value="ظفار">ظفار</option>
                        <option value="الوسطى">الوسطى</option>
                        <option value="ظاهرة">ظاهرة</option>
                        <option value="الباطنة">الباطنة</option>
                        <option value="البريمي">البريمي</option>
                        <option value="الشرقية">الشرقية</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="user-product-phone">
                        <i class="fas fa-phone"></i> رقم التواصل *
                    </label>
                    <div class="phone-input">
                        <span class="country-code">+968</span>
                        <input type="tel" id="user-product-phone" 
                               placeholder="رقم الجوال" 
                               value="${currentUser.phone || ''}"
                               pattern="[0-9]{8}" 
                               maxlength="8" 
                               required>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>
                    <i class="fas fa-images"></i> صور المنتج (اختياري)
                </label>
                <div class="image-upload-area" id="user-image-upload-area">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>انقر لرفع الصور أو اسحبها هنا</p>
                    <small>يمكنك رفع حتى 8 صور</small>
                    <input type="file" id="user-product-images" multiple accept="image/*" hidden>
                </div>
                <div class="image-preview" id="user-image-preview"></div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="user-product-negotiable">
                        <span>السعر قابل للتفاوض</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="user-product-featured">
                        <span>منتج مميز (رسوم إضافية)</span>
                    </label>
                </div>
            </div>
            
            <div class="form-buttons">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i> نشر المنتج
                </button>
                <button type="button" class="btn btn-outline" id="cancel-user-product">
                    <i class="fas fa-times"></i> إلغاء
                </button>
            </div>
        `;
        
        // إعداد رفع الصور
        setupImageUpload(
            document.getElementById('user-image-upload-area'),
            document.getElementById('user-product-images'),
            document.getElementById('user-image-preview')
        );
        
        // إرسال النموذج
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('user-product-name').value.trim(),
                category: document.getElementById('user-product-category').value,
                description: document.getElementById('user-product-desc').value.trim(),
                price: document.getElementById('user-product-price').value,
                condition: document.getElementById('user-product-condition').value,
                location: document.getElementById('user-product-location').value,
                phone: '+968' + document.getElementById('user-product-phone').value.trim(),
                featured: document.getElementById('user-product-featured').checked,
                negotiable: document.getElementById('user-product-negotiable').checked,
                postedBy: currentUser.email,
                postedByName: currentUser.name
            };
            
            // التحقق من البيانات
            if (!validateProductData(productData)) return;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
            submitBtn.disabled = true;
            
            try {
                const data = await makeRequest('addProduct', productData);
                
                if (data.status === 'success') {
                    showAlert('تم نشر المنتج بنجاح!', 'success');
                    modal.classList.add('hidden');
                    fetchAndDisplayProducts();
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('❌ Error adding user product:', error);
                showAlert('حدث خطأ أثناء نشر المنتج', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
        
        // إلغاء النموذج
        document.getElementById('cancel-user-product')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // إغلاق النافذة
        modal.querySelector('.close-modal')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
        
        modal.classList.remove('hidden');
    }
    
    // ===== دوال المساعدة =====
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        const re = /^[0-9]{8}$/;
        return re.test(phone);
    }
    
    function validateRegistration(name, email, phone, password, confirmPassword, governorate) {
        if (name.length < 2) {
            showAlert('الاسم يجب أن يكون حرفين على الأقل', 'error');
            return false;
        }
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return false;
        }
        
        if (!validatePhone(phone)) {
            showAlert('يرجى إدخال رقم جوال عماني صحيح (8 أرقام)', 'error');
            return false;
        }
        
        if (password.length < 6) {
            showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            showAlert('كلمتا المرور غير متطابقتين', 'error');
            return false;
        }
        
        if (!governorate) {
            showAlert('يرجى اختيار المحافظة', 'error');
            return false;
        }
        
        return true;
    }
    
    function validateProductData(product) {
        if (!product.name || product.name.length < 3) {
            showAlert('اسم المنتج يجب أن يكون 3 أحرف على الأقل', 'error');
            return false;
        }
        
        if (!product.category) {
            showAlert('يرجى اختيار فئة المنتج', 'error');
            return false;
        }
        
        if (!product.description || product.description.length < 10) {
            showAlert('وصف المنتج يجب أن يكون 10 أحرف على الأقل', 'error');
            return false;
        }
        
        if (!product.price || parseFloat(product.price) <= 0) {
            showAlert('السعر يجب أن يكون أكبر من صفر', 'error');
            return false;
        }
        
        if (!product.condition) {
            showAlert('يرجى اختيار حالة المنتج', 'error');
            return false;
        }
        
        if (!product.location) {
            showAlert('يرجى اختيار مكان المنتج', 'error');
            return false;
        }
        
        if (!product.phone || product.phone.length !== 13) {
            showAlert('رقم الجوال غير صحيح', 'error');
            return false;
        }
        
        return true;
    }
    
    function setupImageUpload(uploadArea, fileInput, previewArea) {
        let images = [];
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(219, 31, 42, 0.1)';
            uploadArea.style.borderColor = 'var(--primary-color)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
            uploadArea.style.borderColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            uploadArea.style.borderColor = '';
            handleImageUpload(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            handleImageUpload(e.target.files);
        });
        
        function handleImageUpload(files) {
            const maxImages = 8;
            if (images.length + files.length > maxImages) {
                showAlert(`يمكنك رفع حتى ${maxImages} صور فقط`, 'error');
                return;
            }
            
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        images.push({
                            url: e.target.result,
                            file: file
                        });
                        updateImagePreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        function updateImagePreview() {
            previewArea.innerHTML = '';
            images.forEach((img, index) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${img.url}" alt="Preview ${index + 1}">
                    <button class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewArea.appendChild(div);
            });
            
            // إضافة مستمعي الأحداث لأزرار الحذف
            previewArea.querySelectorAll('.remove-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    images.splice(index, 1);
                    updateImagePreview();
                });
            });
        }
        
        return images;
    }
    
    function formatPrice(price) {
        if (!price || isNaN(price)) return '0 ر.ع';
        return `${parseFloat(price).toLocaleString('ar-OM')} ر.ع`;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'غير معروف';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'اليوم';
            if (diffDays === 1) return 'أمس';
            if (diffDays < 7) return `منذ ${diffDays} أيام`;
            if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
            
            return date.toLocaleDateString('ar-OM', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'غير معروف';
        }
    }
    
    function isProductNew(dateString) {
        if (!dateString) return false;
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            return diffDays <= 7; // منتج جديد إذا كان منشوراً خلال أسبوع
        } catch (error) {
            return false;
        }
    }
    
    function getConditionText(condition) {
        const conditions = {
            'جديد': 'جديد',
            'مستعمل-جيد': 'مستعمل (جيد)',
            'مستعمل-متوسط': 'مستعمل (متوسط)'
        };
        
        return conditions[condition] || condition || 'غير محدد';
    }
    
    function showBusinessAlert() {
        if (elements.businessAlert) {
            elements.businessAlert.classList.remove('hidden');
        }
    }
    
    function showLoading(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
                <div class="spinner" style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: var(--gray-medium);">جاري التحميل...</p>
            </div>
        `;
    }
    
    function showError(message) {
        if (!elements.productsContainer) return;
        
        elements.productsContainer.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">حدث خطأ</h3>
                <p style="color: var(--gray-medium); margin-bottom: 20px;">${message}</p>
                <button class="btn btn-primary" onclick="fetchAndDisplayProducts()">
                    <i class="fas fa-redo"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
    
    function showAlert(message, type = 'info') {
        // إزالة أي تنبيهات سابقة
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${type === 'success' ? '#2A9D8F' : type === 'error' ? '#DB1F2A' : '#3A86FF'}; color: white; padding: 15px 25px; border-radius: var(--border-radius); box-shadow: var(--shadow-lg); z-index: 2000; display: flex; align-items: center; gap: 15px; max-width: 500px; animation: slideDown 0.3s ease;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="close-alert" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-right: auto;">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // إغلاق التنبيه
        const closeBtn = alert.querySelector('.close-alert');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alert.remove();
            });
        }
        
        // إغلاق تلقائي بعد 5 ثواني
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    function handleLogout() {
        currentUser = null;
        isAdmin = false;
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
        
        updateNavbar();
        showView('products-view');
        fetchAndDisplayProducts();
        
        showAlert('تم تسجيل الخروج بنجاح', 'success');
    }
    
    // ===== تهيئة التطبيق =====
    function initializeApp() {
        console.log('🚀 بدء تشغيل WebAidea عُمان...');
        
        // تحميل بيانات المستخدم من localStorage
        const savedUser = localStorage.getItem('currentUser');
        const savedAdmin = localStorage.getItem('isAdmin');
        
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            isAdmin = savedAdmin === 'true' && currentUser.email === ADMIN_EMAIL;
        }
        
        // إعداد مستمعي الأحداث العامة
        setupEventListeners();
        
        // تحديث الواجهة
        updateNavbar();
        showView('products-view');
        
        // تحميل المنتجات
        fetchAndDisplayProducts();
        
        // اختبار الاتصال
        testConnection();
    }
    
    function setupEventListeners() {
        // تبديل نماذج الدخول/التسجيل
        const showLoginBtn = document.getElementById('show-login');
        const showRegisterBtn = document.getElementById('show-register');
        const switchToLogin = document.getElementById('switch-to-login');
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', showLoginForm);
        }
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', showRegisterForm);
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', showLoginForm);
        }
        
        // إغلاق تنبيه Business
        if (elements.closeBusinessAlert) {
            elements.closeBusinessAlert.addEventListener('click', () => {
                elements.businessAlert.classList.add('hidden');
                localStorage.setItem('businessAlertClosed', 'true');
            });
        }
        
        // مفاتيح إظهار/إخفاء كلمة المرور
        const toggleLoginPassword = document.getElementById('toggle-login-password');
        const toggleRegisterPassword = document.getElementById('toggle-register-password');
        
        if (toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', function() {
                const input = document.getElementById('login-password');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
        
        if (toggleRegisterPassword) {
            toggleRegisterPassword.addEventListener('click', function() {
                const input = document.getElementById('register-password');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
        
        // الأزرار العائمة
        if (elements.floatAddProduct) {
            elements.floatAddProduct.addEventListener('click', showUserProductForm);
        }
        
        if (elements.floatWhatsapp) {
            elements.floatWhatsapp.addEventListener('click', () => {
                window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
            });
        }
    }
    
    async function testConnection() {
        try {
            const data = await makeRequest('ping');
            console.log('✅ اتصال السكربت:', data);
        } catch (error) {
            console.warn('⚠️ تحذير: مشكلة في الاتصال', error.message);
        }
    }
    
    // جعل الدوال متاحة بشكل عام
    window.fetchAndDisplayProducts = fetchAndDisplayProducts;
    window.showUserProductForm = showUserProductForm;
    
    // بدء التطبيق
    initializeApp();
});