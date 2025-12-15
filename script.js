document.addEventListener('DOMContentLoaded', () => {
    // ===== التهيئة =====
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqMgpu-HDREaLDhtDBjsbalBnGKInQ9pvfRru7RwqF-OeBxO66GoSFCI1drLp2s8ziCA/exec';
    const ADMIN_EMAIL = "msdfrrt@gmail.com";
    const INSTAGRAM_URL = "https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr";
    const SUPPORT_PHONE = "+96895873061";
    
    // ===== المتغيرات العالمية =====
    let currentUser = null;
    let isAdmin = false;
    let allProducts = [];
    let allUsers = [];
    let userProductsCount = {};
    
    // ===== عناصر DOM الرئيسية =====
    const elements = {
        mainNav: document.getElementById('main-nav'),
        productsView: document.getElementById('products-view'),
        adminPanel: document.getElementById('admin-panel'),
        productsContainer: document.getElementById('products-container'),
        businessAlert: document.getElementById('business-activation-alert'),
        closeBusinessAlert: document.getElementById('close-business-alert'),
        productSearch: document.getElementById('product-search'),
        priceRange: document.getElementById('price-range'),
        priceValue: document.getElementById('price-value'),
        floatAddProduct: document.getElementById('float-add-product'),
        adminProductsContainer: document.getElementById('admin-products-container'),
        accountsTableBody: document.getElementById('accounts-table-body'),
        merchantsTableBody: document.getElementById('merchants-table-body'),
        adminProductForm: document.getElementById('admin-product-form'),
        userProductModal: document.getElementById('user-product-modal'),
        productDetailsModal: document.getElementById('product-details-modal'),
        contactAdminModal: document.getElementById('contact-admin-modal'),
        registerModal: document.getElementById('register-modal'),
        loginModal: document.getElementById('login-modal'),
        registerFormModal: document.getElementById('register-form-modal'),
        loginFormModal: document.getElementById('login-form-modal'),
        publishProductLink: document.querySelector('.publish-product-link'),
        homeLink: document.querySelector('.home-link'),
        allProductsLink: document.querySelector('.all-products-link'),
        contactLink: document.querySelector('.contact-link')
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
        const views = ['products-view', 'admin-panel'];
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
                ${currentUser.canPublish ? `
                    <button id="post-product-btn" class="nav-btn">
                        <i class="fas fa-plus"></i> نشر منتج
                    </button>
                ` : `
                    <button id="request-publish-btn" class="nav-btn">
                        <i class="fas fa-plus"></i> طلب تصريح نشر
                    </button>
                `}
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
            const requestPublishBtn = document.getElementById('request-publish-btn');
            
            if (adminPanelBtn) adminPanelBtn.addEventListener('click', () => {
                showView('admin-panel');
                setupAdminPanel();
            });
            
            if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
            if (registerBtn) registerBtn.addEventListener('click', showRegisterModal);
            if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
            if (postProductBtn) postProductBtn.addEventListener('click', showUserProductForm);
            if (requestPublishBtn) requestPublishBtn.addEventListener('click', showContactAdminModal);
        }, 100);
    }
    
    // ===== دوال المنتجات =====
    async function fetchAndDisplayProducts() {
        showLoading(elements.productsContainer);
        
        try {
            const data = await makeRequest('getAllProducts');
            
            if (data.status === 'success') {
                allProducts = data.products || [];
                
                // حساب عدد منتجات كل مستخدم
                userProductsCount = {};
                allProducts.forEach(product => {
                    if (product.postedBy) {
                        userProductsCount[product.postedBy] = (userProductsCount[product.postedBy] || 0) + 1;
                    }
                });
                
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
                    ${currentUser ? `
                        ${currentUser.canPublish ? `
                            <button class="btn btn-primary" onclick="showUserProductForm()">
                                <i class="fas fa-plus"></i> نشر منتج جديد
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="showContactAdminModal()">
                                <i class="fas fa-plus"></i> طلب تصريح للنشر
                            </button>
                        `}
                    ` : `
                        <button class="btn btn-primary" onclick="showRegisterModal()">
                            <i class="fas fa-user-plus"></i> إنشاء حساب للنشر
                        </button>
                    `}
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
                    <div class="product-seller">
                        <i class="fas fa-user"></i>
                        <span>${product.postedByName || product.postedBy}</span>
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
                            </div>
                        </div>
                        
                        <div class="product-actions">
                            <button class="btn btn-primary btn-block" id="whatsapp-contact">
                                <i class="fab fa-whatsapp"></i> تواصل مع البائع
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة مستمعي الأحداث لأزرار الاتصال
        setTimeout(() => {
            const whatsappBtn = document.getElementById('whatsapp-contact');
            
            if (whatsappBtn && product.phone) {
                whatsappBtn.addEventListener('click', () => {
                    const message = `مرحباً، أنا مهتم بالمنتج: ${product.name}`;
                    const whatsappUrl = `https://wa.me/${product.phone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
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
    
    // ===== نافذة انشاء حساب =====
    function showRegisterModal() {
        const modal = elements.registerModal;
        if (!modal) return;
        
        modal.classList.remove('hidden');
        
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
        
        // التحويل إلى تسجيل الدخول
        const switchToLogin = document.getElementById('switch-to-login-modal');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('hidden');
                showLoginModal();
            });
        }
    }
    
    // ===== نافذة تسجيل الدخول =====
    function showLoginModal() {
        const modal = elements.loginModal;
        if (!modal) return;
        
        modal.classList.remove('hidden');
        
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
        
        // التحويل إلى انشاء حساب
        const switchToRegister = document.getElementById('switch-to-register-modal');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('hidden');
                showRegisterModal();
            });
        }
    }
    
    // ===== عرض نافذة التواصل مع الإدارة =====
    function showContactAdminModal() {
        const modal = elements.contactAdminModal;
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content contact-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-info-circle"></i> مطلوب تصريح للنشر</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="contact-instructions">
                        <div class="contact-icon">
                            <i class="fab fa-instagram" style="font-size: 4rem; color: #E1306C;"></i>
                        </div>
                        <h4>لنشر منتجاتك تحتاج إلى تصريح من الإدارة</h4>
                        <p>يرجى التواصل معنا عبر حساب Instagram للحصول على تصريح النشر:</p>
                        <div class="contact-link">
                            <a href="${INSTAGRAM_URL}" 
                               target="_blank" class="btn btn-instagram">
                                <i class="fab fa-instagram"></i> تواصل معنا على Instagram
                            </a>
                        </div>
                        <p class="contact-note">بعد التواصل وموافقة الإدارة، ستتمكن من نشر منتجاتك على المنصة</p>
                        <div class="user-info">
                            <p><strong>اسم المستخدم:</strong> ${currentUser?.name || ''}</p>
                            <p><strong>البريد الإلكتروني:</strong> ${currentUser?.email || ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة مستمعي الأحداث
        setTimeout(() => {
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
    
    // ===== تسجيل الدخول =====
    if (elements.loginFormModal) {
        elements.loginFormModal.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email-modal').value.trim();
            const password = document.getElementById('login-password-modal').value;
            const btn = elements.loginFormModal.querySelector('button[type="submit"]');
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
                    
                    // إضافة خاصية canPublish من بيانات الجدول
                    if (data.userData && data.userData.canPublish !== undefined) {
                        currentUser.canPublish = data.userData.canPublish;
                    } else {
                        currentUser.canPublish = false;
                    }
                    
                    // حفظ في localStorage
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isAdmin', isAdmin.toString());
                    
                    updateNavbar();
                    showView('products-view');
                    fetchAndDisplayProducts();
                    
                    showAlert(`مرحباً بعودتك ${currentUser.name}!`, 'success');
                    elements.loginFormModal.reset();
                    
                    // إغلاق النافذة
                    elements.loginModal.classList.add('hidden');
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
    
    // ===== إنشاء حساب =====
    if (elements.registerFormModal) {
        elements.registerFormModal.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name-modal').value.trim();
            const email = document.getElementById('register-email-modal').value.trim();
            const password = document.getElementById('register-password-modal').value;
            const confirmPassword = document.getElementById('register-confirm-password-modal').value;
            const btn = elements.registerFormModal.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // التحقق من البيانات
            if (!validateRegistration(name, email, password, confirmPassword)) {
                return;
            }
            
            // تغيير حالة الزر
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
            btn.disabled = true;
            
            try {
                const data = await makeRequest('register', {
                    name,
                    email,
                    phone: "",
                    password,
                    governorate: "",
                    address: "",
                    wantsBusiness: false
                });
                
                if (data.status === 'success') {
                    currentUser = data.user;
                    currentUser.canPublish = false;
                    isAdmin = data.isAdmin && currentUser.email === ADMIN_EMAIL;
                    
                    // حفظ في localStorage
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isAdmin', isAdmin.toString());
                    
                    updateNavbar();
                    showView('products-view');
                    fetchAndDisplayProducts();
                    
                    showAlert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن', 'success');
                    elements.registerFormModal.reset();
                    
                    // إغلاق النافذة وفتح نافذة تسجيل الدخول
                    elements.registerModal.classList.add('hidden');
                    showLoginModal();
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
    
    // ===== نموذج نشر المنتج للمستخدمين =====
    function showUserProductForm() {
        if (!currentUser || !currentUser.canPublish) {
            showContactAdminModal();
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
                <label for="user-product-desc">
                    <i class="fas fa-file-alt"></i> وصف المنتج *
                </label>
                <textarea id="user-product-desc" rows="4" placeholder="صف منتجك بالتفصيل..." required></textarea>
            </div>
            
            <div class="form-group">
                <label for="user-product-price">
                    <i class="fas fa-coins"></i> السعر (ريال عماني) *
                </label>
                <input type="number" id="user-product-price" placeholder="السعر" min="0" step="0.5" required>
            </div>
            
            <div class="form-group">
                <label>
                    <i class="fas fa-images"></i> صورة المنتج
                </label>
                <div class="image-upload-area" id="user-image-upload-area">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>انقر لرفع صورة للمنتج</p>
                    <input type="file" id="user-product-image" accept="image/*" hidden>
                </div>
                <div class="image-preview" id="user-image-preview"></div>
            </div>
            
            <div class="form-group">
                <label for="user-product-phone">
                    <i class="fas fa-phone"></i> رقم التواصل *
                </label>
                <div class="phone-input">
                    <span class="country-code">+968</span>
                    <input type="tel" id="user-product-phone" 
                           placeholder="رقم الجوال" 
                           pattern="[0-9]{8}" 
                           maxlength="8" 
                           required>
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
        let uploadedImage = null;
        const uploadArea = document.getElementById('user-image-upload-area');
        const fileInput = document.getElementById('user-product-image');
        const previewArea = document.getElementById('user-image-preview');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        uploadedImage = {
                            url: e.target.result,
                            file: file
                        };
                        updateImagePreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            function updateImagePreview() {
                previewArea.innerHTML = '';
                if (uploadedImage) {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `
                        <img src="${uploadedImage.url}" alt="Preview">
                        <button class="remove-image" id="remove-user-image">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    previewArea.appendChild(div);
                    
                    document.getElementById('remove-user-image').addEventListener('click', (e) => {
                        e.stopPropagation();
                        uploadedImage = null;
                        fileInput.value = '';
                        updateImagePreview();
                    });
                }
            }
        }
        
        // إرسال النموذج
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const productData = {
                productName: document.getElementById('user-product-name').value.trim(),
                description: document.getElementById('user-product-desc').value.trim(),
                price: document.getElementById('user-product-price').value,
                phone: '+968' + document.getElementById('user-product-phone').value.trim(),
                postedBy: currentUser.email,
                postedByName: currentUser.name,
                imageUrl: uploadedImage ? uploadedImage.url : ''
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
            const searchUser = document.getElementById('search-user');
            if (searchUser) {
                searchUser.addEventListener('input', searchAdminUsers);
            }
            
            const searchMerchant = document.getElementById('search-merchant');
            if (searchMerchant) {
                searchMerchant.addEventListener('input', searchAdminMerchants);
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
        if (!elements.accountsTableBody || !elements.merchantsTableBody) return;
        
        // مسح الجداول
        elements.accountsTableBody.innerHTML = '';
        elements.merchantsTableBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            elements.accountsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">لا يوجد مستخدمون مسجلون</td>
                </tr>
            `;
            return;
        }
        
        let totalUsers = 0;
        let totalMerchants = 0;
        
        users.forEach(user => {
            totalUsers++;
            
            // تخطي المدير
            if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return;
            
            // جدول جميع الحسابات
            const accountRow = createUserRow(user);
            elements.accountsTableBody.appendChild(accountRow);
            
            // جدول المصرح لهم بالنشر
            if (user.canPublish) {
                totalMerchants++;
                const merchantRow = createMerchantRow(user);
                elements.merchantsTableBody.appendChild(merchantRow);
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
            <td>
                ${user.canPublish ? 
                    '<span class="status-badge success"><i class="fas fa-check"></i> مصرح بالنشر</span>' : 
                    '<span class="status-badge warning"><i class="fas fa-times"></i> غير مصرح</span>'
                }
            </td>
            <td>${formatDate(user.joinDate)}</td>
            <td class="actions">
                ${!user.canPublish ? `
                    <button class="btn btn-small btn-primary approve-publish-btn" data-email="${user.email}">
                        <i class="fas fa-check"></i> تصريح نشر
                    </button>
                ` : `
                    <button class="btn btn-small btn-warning revoke-publish-btn" data-email="${user.email}">
                        <i class="fas fa-times"></i> إلغاء التصريح
                    </button>
                `}
                
                <button class="btn btn-small btn-danger delete-user-btn" data-email="${user.email}">
                    <i class="fas fa-trash"></i> حذف الحساب
                </button>
            </td>
        `;
        
        // إضافة مستمعي الأحداث للأزرار
        setTimeout(() => {
            const approveBtn = row.querySelector('.approve-publish-btn');
            const revokeBtn = row.querySelector('.revoke-publish-btn');
            const deleteBtn = row.querySelector('.delete-user-btn');
            
            if (approveBtn) {
                approveBtn.addEventListener('click', async () => {
                    if (confirm(`هل تريد منح ${user.name} صلاحية نشر المنتجات؟`)) {
                        await togglePublishPermission(user.email, true);
                    }
                });
            }
            
            if (revokeBtn) {
                revokeBtn.addEventListener('click', async () => {
                    if (confirm(`هل تريد إلغاء صلاحية النشر من ${user.name}؟`)) {
                        await togglePublishPermission(user.email, false);
                    }
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`هل تريد حذف حساب ${user.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                        deleteUser(user.email);
                    }
                });
            }
        }, 100);
        
        return row;
    }
    
    function createMerchantRow(user) {
        const row = document.createElement('tr');
        
        // حساب عدد منتجات المستخدم
        const userProducts = userProductsCount[user.email] || 0;
        
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${userProducts}</td>
            <td>${formatDate(user.joinDate)}</td>
            <td class="actions">
                <button class="btn btn-small btn-warning revoke-publish-btn" data-email="${user.email}">
                    <i class="fas fa-times"></i> إلغاء التصريح
                </button>
                <button class="btn btn-small btn-danger delete-user-btn" data-email="${user.email}">
                    <i class="fas fa-trash"></i> حذف الحساب
                </button>
            </td>
        `;
        
        // إضافة مستمعي الأحداث للأزرار
        setTimeout(() => {
            const revokeBtn = row.querySelector('.revoke-publish-btn');
            const deleteBtn = row.querySelector('.delete-user-btn');
            
            if (revokeBtn) {
                revokeBtn.addEventListener('click', async () => {
                    if (confirm(`هل تريد إلغاء صلاحية النشر من ${user.name}؟`)) {
                        await togglePublishPermission(user.email, false);
                    }
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`هل تريد حذف حساب ${user.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                        deleteUser(user.email);
                    }
                });
            }
        }, 100);
        
        return row;
    }
    
    async function togglePublishPermission(email, canPublish) {
        try {
            const data = await makeRequest('toggleMerchantStatus', { email });
            
            if (data.status === 'success') {
                showAlert(canPublish ? 'تم منح صلاحية النشر' : 'تم إلغاء صلاحية النشر', 'success');
                
                // تحديث حالة المستخدم الحالي إذا كان هو نفسه
                if (currentUser && currentUser.email === email) {
                    currentUser.canPublish = canPublish;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateNavbar();
                }
                
                // إعادة تحميل لوحة التحكم
                setupAdminPanel();
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error toggling publish permission:', error);
            showAlert('حدث خطأ أثناء تعديل الصلاحيات', 'error');
        }
    }
    
    async function deleteUser(email) {
        try {
            const data = await makeRequest('deleteUser', { email });
            
            if (data.status === 'success') {
                showAlert('تم حذف الحساب بنجاح', 'success');
                setupAdminPanel(); // تحديث البيانات
                fetchAndDisplayProducts(); // تحديث المنتجات
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            showAlert('حدث خطأ أثناء حذف الحساب', 'error');
        }
    }
    
    async function deleteProduct(productId) {
        try {
            if (confirm('هل تريد حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                const data = await makeRequest('deleteProduct', { productId });
                
                if (data.status === 'success') {
                    showAlert('تم حذف المنتج بنجاح', 'success');
                    setupAdminPanel(); // تحديث البيانات
                    fetchAndDisplayProducts(); // تحديث المنتجات
                } else {
                    showAlert(data.message, 'error');
                }
            }
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            showAlert('حدث خطأ أثناء حذف المنتج', 'error');
        }
    }
    
    function searchAdminUsers() {
        const searchTerm = document.getElementById('search-user').value.toLowerCase();
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
    
    function searchAdminMerchants() {
        const searchTerm = document.getElementById('search-merchant').value.toLowerCase();
        const rows = elements.merchantsTableBody.querySelectorAll('tr');
        
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
            const productCard = createAdminProductCard(product);
            elements.adminProductsContainer.appendChild(productCard);
        });
    }
    
    function createAdminProductCard(product) {
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
                    <div class="product-seller">
                        <i class="fas fa-user"></i>
                        <span>${product.postedByName || product.postedBy}</span>
                    </div>
                    
                    <div class="product-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(product.datePosted)}</span>
                    </div>
                </div>
                
                <div class="admin-product-actions">
                    <button class="btn btn-small btn-danger delete-product-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
        
        // إضافة مستمع الأحداث لحذف المنتج
        setTimeout(() => {
            const deleteBtn = card.querySelector('.delete-product-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteProduct(product.id);
                });
            }
        }, 100);
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.admin-product-actions')) {
                showProductDetails(product);
            }
        });
        
        return card;
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
                
                // عند النقر على "المصرح لهم" نقوم بتحديث الجدول
                if (targetView === 'merchants-view') {
                    setupAdminPanel();
                }
            });
        });
    }
    
    function setupAdminProductForm() {
        elements.adminProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productData = {
                productName: document.getElementById('admin-product-name').value.trim(),
                category: document.getElementById('admin-product-category').value,
                description: document.getElementById('admin-product-desc').value.trim(),
                price: document.getElementById('admin-product-price').value,
                condition: document.getElementById('admin-product-condition').value,
                location: document.getElementById('admin-product-location').value,
                phone: '+968' + document.getElementById('admin-product-phone').value.trim(),
                isFeatured: document.getElementById('admin-product-featured').checked ? 'true' : 'false',
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
        const totalMerchants = users.filter(u => u.canPublish).length;
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
    
    // ===== دوال المساعدة =====
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validateRegistration(name, email, password, confirmPassword) {
        if (name.length < 2) {
            showAlert('الاسم يجب أن يكون حرفين على الأقل', 'error');
            return false;
        }
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
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
        
        return true;
    }
    
    function validateProductData(product) {
        if (!product.productName || product.productName.length < 3) {
            showAlert('اسم المنتج يجب أن يكون 3 أحرف على الأقل', 'error');
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
        
        if (!product.phone || product.phone.length !== 13) {
            showAlert('رقم الجوال غير صحيح', 'error');
            return false;
        }
        
        return true;
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
            
            return diffDays <= 7;
        } catch (error) {
            return false;
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
            <div class="alert-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="close-alert">&times;</button>
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
    
    // ===== إدارة مفاتيح إظهار/إخفاء كلمة المرور =====
    function setupPasswordToggles() {
        // تسجيل الدخول
        const toggleLoginPassword = document.getElementById('toggle-login-password-modal');
        if (toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', function() {
                const input = document.getElementById('login-password-modal');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
        
        // انشاء حساب
        const toggleRegisterPassword = document.getElementById('toggle-register-password-modal');
        if (toggleRegisterPassword) {
            toggleRegisterPassword.addEventListener('click', function() {
                const input = document.getElementById('register-password-modal');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        }
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
        
        // إعداد مفاتيح كلمات المرور
        setupPasswordToggles();
        
        // تحديث الواجهة
        updateNavbar();
        showView('products-view');
        
        // تحميل المنتجات
        fetchAndDisplayProducts();
        
        // اختبار الاتصال
        testConnection();
    }
    
    function setupEventListeners() {
        // إغلاق تنبيه Business
        if (elements.closeBusinessAlert) {
            elements.closeBusinessAlert.addEventListener('click', () => {
                elements.businessAlert.classList.add('hidden');
                localStorage.setItem('businessAlertClosed', 'true');
            });
        }
        
        // الأزرار العائمة
        if (elements.floatAddProduct) {
            elements.floatAddProduct.addEventListener('click', () => {
                if (!currentUser) {
                    showRegisterModal();
                } else if (!currentUser.canPublish) {
                    showContactAdminModal();
                } else {
                    showUserProductForm();
                }
            });
        }
        
        // روابط الفوتر
        if (elements.publishProductLink) {
            elements.publishProductLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentUser) {
                    showRegisterModal();
                } else if (!currentUser.canPublish) {
                    showContactAdminModal();
                } else {
                    showUserProductForm();
                }
            });
        }
        
        if (elements.homeLink) {
            elements.homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                showView('products-view');
            });
        }
        
        if (elements.allProductsLink) {
            elements.allProductsLink.addEventListener('click', (e) => {
                e.preventDefault();
                showView('products-view');
                fetchAndDisplayProducts();
            });
        }
        
        if (elements.contactLink) {
            elements.contactLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(`https://wa.me/${SUPPORT_PHONE}`, '_blank');
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
    window.showContactAdminModal = showContactAdminModal;
    window.showRegisterModal = showRegisterModal;
    window.showLoginModal = showLoginModal;
    
    // بدء التطبيق
    initializeApp();
});