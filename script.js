document.addEventListener('DOMContentLoaded', () => {
    // ===== التهيئة =====
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzpPVSdelGNUizxky_cqpjSitWhb6PN_5-VF2wJ9jcNawccmHqephWh4KO1hHJUp3yZg/exec';
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
    
    // ===== دالة الاتصال المحسنة =====
    async function makeRequest(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).substr(2)}`;
            
            let url = `${SCRIPT_URL}?action=${action}&callback=${callbackName}`;
            
            // إضافة المعاملات
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                }
            });
            
            console.log(`📡 Request: ${action}`, params);
            
            // دالة استجابة JSONP
            window[callbackName] = function(data) {
                // تنظيف بعد الاستجابة
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
            
            // إنشاء عنصر script للـ JSONP
            const script = document.createElement('script');
            script.src = url;
            
            script.onerror = () => {
                // تنظيف عند الخطأ
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                reject(new Error('فشل الاتصال بالخادم. تحقق من اتصال الإنترنت.'));
            };
            
            script.onload = () => {
                console.log(`📡 Script loaded for ${action}`);
            };
            
            document.body.appendChild(script);
            
            // مهلة الاتصال
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.body.removeChild(script);
                    }
                    reject(new Error('انتهت مهلة الاتصال. حاول مرة أخرى.'));
                }
            }, 10000); // 10 ثواني
        });
    }
    
    // ===== دوال العرض والتنقل المحسنة =====
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
        const floatingButtons = document.querySelector('.floating-buttons');
        if (floatingButtons) {
            if (viewId === 'products-view') {
                floatingButtons.classList.remove('hidden');
            } else {
                floatingButtons.classList.add('hidden');
            }
        }
        
        // تحديث عنوان الصفحة
        updatePageTitle(viewId);
        
        // إغلاق أي نافذة مفتوحة
        closeAllModals();
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
        
        // إضافة مستمعي الأحداث بعد تحديث الـ DOM
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
    
    // ===== دوال المنتجات المحسنة =====
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
                showError('حدث خطأ في تحميل المنتجات: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching products:', error);
            showError('لا يمكن الاتصال بالخادم: ' + error.message);
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
        card.dataset.id = product.id;
        
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
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.product-badges') && !e.target.closest('.product-price')) {
                showProductDetails(product);
            }
        });
        
        // تحسين للمس على الجوال
        card.addEventListener('touchstart', () => {
            card.classList.add('touched');
        });
        
        card.addEventListener('touchend', () => {
            setTimeout(() => {
                card.classList.remove('touched');
            }, 150);
        });
        
        return card;
    }
    
    function setupProductFilters() {
        // فلترة بالبحث
        if (elements.productSearch) {
            elements.productSearch.addEventListener('input', debounce(filterProducts, 300));
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
            const matchesSearch = 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                (product.category?.toLowerCase() || '').includes(searchTerm);
            
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
    
    // ===== تفاصيل المنتج المحسنة =====
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
                             class="main-image"
                             onclick="this.classList.toggle('zoomed')">
                    </div>
                    
                    <div class="product-info">
                        <div class="price-section">
                            <span class="price">${price}</span>
                            ${product.isFeatured ? '<span class="featured-tag"><i class="fas fa-star"></i> مميز</span>' : ''}
                            ${isNew ? '<span class="new-tag"><i class="fas fa-fire"></i> جديد</span>' : ''}
                        </div>
                        
                        <div class="product-description-full">
                            <h4>وصف المنتج:</h4>
                            <p>${product.description || 'لا يوجد وصف'}</p>
                        </div>
                        
                        <div class="seller-info">
                            <h4>معلومات البائع:</h4>
                            <div class="seller-details">
                                <div class="seller-name">
                                    <i class="fas fa-user"></i>
                                    <span>${product.postedByName || product.postedBy}</span>
                                </div>
                                ${product.phone ? `
                                    <div class="seller-phone">
                                        <i class="fas fa-phone"></i>
                                        <span>${product.phone}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="product-actions">
                            ${product.phone ? `
                                <button class="btn btn-primary btn-block" id="whatsapp-contact">
                                    <i class="fab fa-whatsapp"></i> تواصل على واتساب
                                </button>
                                <button class="btn btn-outline btn-block" id="call-contact">
                                    <i class="fas fa-phone"></i> اتصل بالبائع
                                </button>
                            ` : `
                                <p class="no-contact">لا يوجد رقم تواصل</p>
                            `}
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
                    const whatsappUrl = `https://wa.me/${product.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
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
            
            // إغلاق بالنقر خارج المحتوى
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
            
            // إغلاق بالزر Escape
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    modal.classList.add('hidden');
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });
        }, 100);
        
        modal.classList.remove('hidden');
    }
    
    // ===== نافذة انشاء حساب محسنة =====
    function showRegisterModal() {
        const modal = elements.registerModal;
        if (!modal) return;
        
        // إعادة تعيين النموذج
        const form = elements.registerFormModal;
        if (form) form.reset();
        
        modal.classList.remove('hidden');
        
        // التركيز على أول حقل
        setTimeout(() => {
            const nameInput = document.getElementById('register-name-modal');
            if (nameInput) nameInput.focus();
        }, 300);
        
        // إغلاق النافذة
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        // إغلاق بالنقر خارج المحتوى
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
    
    // ===== نافذة تسجيل الدخول محسنة =====
    function showLoginModal() {
        const modal = elements.loginModal;
        if (!modal) return;
        
        // إعادة تعيين النموذج
        const form = elements.loginFormModal;
        if (form) form.reset();
        
        modal.classList.remove('hidden');
        
        // التركيز على حقل البريد
        setTimeout(() => {
            const emailInput = document.getElementById('login-email-modal');
            if (emailInput) emailInput.focus();
        }, 300);
        
        // إغلاق النافذة
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
        
        // إغلاق بالنقر خارج المحتوى
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
    
    // ===== عرض نافذة التواصل مع الإدارة محسنة =====
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
                        <div class="contact-alternative">
                            <p>أو عبر واتساب:</p>
                            <a href="https://wa.me/${SUPPORT_PHONE.replace('+', '')}" 
                               target="_blank" class="btn btn-whatsapp">
                                <i class="fab fa-whatsapp"></i> تواصل على واتساب
                            </a>
                        </div>
                        <p class="contact-note">بعد التواصل وموافقة الإدارة، ستتمكن من نشر منتجاتك على المنصة</p>
                        <div class="user-info">
                            <p><strong>اسم المستخدم:</strong> ${currentUser?.name || ''}</p>
                            <p><strong>البريد الإلكتروني:</strong> ${currentUser?.email || ''}</p>
                            <p><strong>رقم الجوال:</strong> ${currentUser?.phone || 'غير محدد'}</p>
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
            
            // إغلاق بالزر Escape
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    modal.classList.add('hidden');
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });
        }, 100);
        
        modal.classList.remove('hidden');
    }
    
    // ===== تسجيل الدخول محسن =====
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
                shakeElement(document.getElementById('login-email-modal'));
                return;
            }
            
            if (password.length < 6) {
                showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                shakeElement(document.getElementById('login-password-modal'));
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
                    showAlert(data.message || 'فشل تسجيل الدخول', 'error');
                    shakeElement(elements.loginFormModal);
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                showAlert('فشل تسجيل الدخول. تحقق من اتصال الإنترنت.', 'error');
                shakeElement(elements.loginFormModal);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // ===== إنشاء حساب محسن =====
    if (elements.registerFormModal) {
        elements.registerFormModal.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name-modal').value.trim();
            const email = document.getElementById('register-email-modal').value.trim();
            const password = document.getElementById('register-password-modal').value;
            const confirmPassword = document.getElementById('register-confirm-password-modal').value;
            const agreeTerms = document.getElementById('agree-terms-modal').checked;
            const btn = elements.registerFormModal.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // التحقق من البيانات
            if (!validateRegistration(name, email, password, confirmPassword, agreeTerms)) {
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
                    password
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
                    
                    // إغلاق النافذة وفتح نافذة تسجيل الدخول تلقائياً
                    elements.registerModal.classList.add('hidden');
                    
                    // تأخير بسيط ثم فتح تسجيل الدخول
                    setTimeout(() => {
                        showLoginModal();
                        if (document.getElementById('login-email-modal')) {
                            document.getElementById('login-email-modal').value = email;
                        }
                    }, 500);
                } else {
                    showAlert(data.message || 'فشل إنشاء الحساب', 'error');
                    shakeElement(elements.registerFormModal);
                }
            } catch (error) {
                console.error('❌ Registration error:', error);
                showAlert('فشل إنشاء الحساب. تحقق من اتصال الإنترنت.', 'error');
                shakeElement(elements.registerFormModal);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // ===== نموذج نشر المنتج للمستخدمين محسن =====
    function showUserProductForm() {
        if (!currentUser) {
            showAlert('يرجى تسجيل الدخول أولاً', 'error');
            showLoginModal();
            return;
        }
        
        if (!currentUser.canPublish) {
            showContactAdminModal();
            return;
        }
        
        const modal = elements.userProductModal;
        const formContainer = document.getElementById('user-product-form');
        
        if (!modal || !formContainer) return;
        
        formContainer.innerHTML = `
            <div class="form-group">
                <label for="user-product-name">
                    <i class="fas fa-tag"></i> اسم المنتج *
                </label>
                <input type="text" id="user-product-name" placeholder="مثال: آيفون 14 برو ماكس" required>
            </div>
            
            <div class="form-group">
                <label for="user-product-desc">
                    <i class="fas fa-file-alt"></i> وصف المنتج *
                </label>
                <textarea id="user-product-desc" rows="4" placeholder="صف منتجك بالتفصيل (اللون، الحالة، المميزات...)" required></textarea>
                <small class="form-hint">أدخل وصفاً تفصيلياً لجذب المشترين</small>
            </div>
            
            <div class="form-group">
                <label for="user-product-price">
                    <i class="fas fa-coins"></i> السعر (ريال عماني) *
                </label>
                <div class="price-input-container">
                    <input type="number" id="user-product-price" placeholder="مثال: 150" min="0" step="0.5" required>
                    <span class="currency-symbol">ر.ع</span>
                </div>
                <small class="form-hint">يمكنك استخدام الكسور (مثال: 150.5)</small>
            </div>
            
            <div class="form-group">
                <label for="user-product-category">
                    <i class="fas fa-folder"></i> الفئة
                </label>
                <select id="user-product-category">
                    <option value="">اختر الفئة (اختياري)</option>
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
                <label>
                    <i class="fas fa-images"></i> صورة المنتج
                </label>
                <div class="image-upload-area" id="user-image-upload-area">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>انقر لرفع صورة للمنتج</p>
                    <small>الصيغ المدعومة: JPG, PNG, GIF (حتى 5MB)</small>
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
                           placeholder="رقم الجوال (8 أرقام)" 
                           pattern="[0-9]{8}" 
                           maxlength="8" 
                           required>
                </div>
                <small class="form-hint">رقم الجوال سيظهر للمشترين المهتمين</small>
            </div>
            
            <div class="form-group">
                <label for="user-product-location">
                    <i class="fas fa-map-marker-alt"></i> الموقع
                </label>
                <select id="user-product-location">
                    <option value="">اختر المحافظة (اختياري)</option>
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
                <label class="checkbox-label">
                    <input type="checkbox" id="user-product-negotiable">
                    <span>السعر قابل للتفاوض</span>
                </label>
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
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--primary-color)';
                uploadArea.style.background = 'rgba(219, 31, 42, 0.05)';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '';
                uploadArea.style.background = '';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '';
                uploadArea.style.background = '';
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
                    handleImageUpload(file);
                } else {
                    showAlert('يرجى اختيار صورة بحجم أقل من 5MB', 'error');
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    if (file.size > 5 * 1024 * 1024) {
                        showAlert('حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'error');
                        fileInput.value = '';
                        return;
                    }
                    handleImageUpload(file);
                }
            });
            
            function handleImageUpload(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImage = {
                        url: e.target.result,
                        file: file,
                        name: file.name
                    };
                    updateImagePreview();
                };
                reader.readAsDataURL(file);
            }
            
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
        
        // التركيز على أول حقل
        setTimeout(() => {
            const nameInput = document.getElementById('user-product-name');
            if (nameInput) nameInput.focus();
        }, 300);
        
        // إرسال النموذج
        formContainer.onsubmit = async (e) => {
            e.preventDefault();
            
            const productData = {
                productName: document.getElementById('user-product-name').value.trim(),
                description: document.getElementById('user-product-desc').value.trim(),
                price: document.getElementById('user-product-price').value,
                phone: '+968' + document.getElementById('user-product-phone').value.trim(),
                category: document.getElementById('user-product-category').value,
                location: document.getElementById('user-product-location').value,
                postedBy: currentUser.email,
                postedByName: currentUser.name,
                imageUrl: uploadedImage ? uploadedImage.url : '',
                isFeatured: 'false',
                negotiable: document.getElementById('user-product-negotiable').checked
            };
            
            // التحقق من البيانات
            if (!validateProductData(productData)) return;
            
            const submitBtn = formContainer.querySelector('button[type="submit"]');
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
                    showAlert(data.message || 'حدث خطأ أثناء النشر', 'error');
                }
            } catch (error) {
                console.error('❌ Error adding user product:', error);
                showAlert('حدث خطأ أثناء نشر المنتج. تحقق من اتصال الإنترنت.', 'error');
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
        
        // إغلاق بالزر Escape
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.classList.add('hidden');
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
        
        modal.classList.remove('hidden');
    }
    
    // ===== لوحة التحكم المحسنة =====
    async function setupAdminPanel() {
        try {
            showLoading(elements.adminProductsContainer);
            
            // تحميل البيانات بالتزامن
            const [usersData, productsData] = await Promise.all([
                makeRequest('getAllUsers'),
                makeRequest('getAllProducts')
            ]);
            
            if (usersData.status === 'success') {
                allUsers = usersData.users || [];
                displayAdminUsers(allUsers);
                updateAdminStats(allUsers, productsData.products || []);
            } else {
                showAlert('خطأ في تحميل المستخدمين: ' + usersData.message, 'error');
            }
            
            if (productsData.status === 'success') {
                displayAdminProducts(productsData.products || []);
            } else {
                showAlert('خطأ في تحميل المنتجات: ' + productsData.message, 'error');
            }
            
            // إعداد علامات التبويب
            setupAdminTabs();
            
            // إعداد البحث
            const searchUser = document.getElementById('search-user');
            if (searchUser) {
                searchUser.addEventListener('input', debounce(searchAdminUsers, 300));
            }
            
            const searchMerchant = document.getElementById('search-merchant');
            if (searchMerchant) {
                searchMerchant.addEventListener('input', debounce(searchAdminMerchants, 300));
            }
            
            // إعداد نموذج إضافة منتج
            if (elements.adminProductForm) {
                setupAdminProductForm();
            }
            
        } catch (error) {
            console.error('❌ Error setting up admin panel:', error);
            showAlert('حدث خطأ في تحميل بيانات لوحة التحكم: ' + error.message, 'error');
        }
    }
    
    // ... (باقي دوال لوحة التحكم كما هي مع تحسينات طفيفة)
    // سأختصر هنا للتركيز على الحلول الأساسية
    
    // ===== دوال المساعدة المحسنة =====
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validateRegistration(name, email, password, confirmPassword, agreeTerms) {
        if (name.length < 2) {
            showAlert('الاسم يجب أن يكون حرفين على الأقل', 'error');
            shakeElement(document.getElementById('register-name-modal'));
            return false;
        }
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            shakeElement(document.getElementById('register-email-modal'));
            return false;
        }
        
        if (password.length < 6) {
            showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            shakeElement(document.getElementById('register-password-modal'));
            return false;
        }
        
        if (password !== confirmPassword) {
            showAlert('كلمتا المرور غير متطابقتين', 'error');
            shakeElement(document.getElementById('register-confirm-password-modal'));
            return false;
        }
        
        if (!agreeTerms) {
            showAlert('يجب الموافقة على الشروط والأحكام', 'error');
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
        const formatted = parseFloat(price).toLocaleString('ar-OM', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return `${formatted} ر.ع`;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'غير معروف';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHours < 1) return 'منذ قليل';
            if (diffHours < 24) return `منذ ${diffHours} ساعة`;
            if (diffDays === 1) return 'أمس';
            if (diffDays < 7) return `منذ ${diffDays} أيام`;
            if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
            
            return date.toLocaleDateString('ar-OM', {
                year: 'numeric',
                month: 'short',
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
            <div class="loading">
                <div class="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }
    
    function showError(message) {
        if (!elements.productsContainer) return;
        
        elements.productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
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
        if (confirm('هل تريد تسجيل الخروج؟')) {
            currentUser = null;
            isAdmin = false;
            
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isAdmin');
            
            updateNavbar();
            showView('products-view');
            fetchAndDisplayProducts();
            
            showAlert('تم تسجيل الخروج بنجاح', 'success');
        }
    }
    
    // ===== دوال مساعدة جديدة =====
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function shakeElement(element) {
        if (!element) return;
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
    
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.classList.add('hidden'));
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
    
    // ===== تهيئة التطبيق المحسنة =====
    function initializeApp() {
        console.log('🚀 بدء تشغيل WebAidea عُمان...');
        
        // تحميل بيانات المستخدم من localStorage
        const savedUser = localStorage.getItem('currentUser');
        const savedAdmin = localStorage.getItem('isAdmin');
        
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                isAdmin = savedAdmin === 'true' && currentUser.email === ADMIN_EMAIL;
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.clear();
            }
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
        
        // عرض/إخفاء تنبيه Business حسب localStorage
        if (localStorage.getItem('businessAlertClosed') === 'true') {
            elements.businessAlert?.classList.add('hidden');
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
                window.open(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`, '_blank');
            });
        }
        
        // منع إرسال النموذج عند الضغط على Enter في حقول البحث
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && 
                (e.target.id === 'product-search' || 
                 e.target.id === 'search-user' || 
                 e.target.id === 'search-merchant')) {
                e.preventDefault();
            }
        });
    }
    
    async function testConnection() {
        try {
            const data = await makeRequest('ping');
            console.log('✅ اتصال السكربت:', data);
            
            // تحديث حالة الاتصال في الفوتر
            const connectionStatus = document.createElement('div');
            connectionStatus.className = 'connection-status';
            connectionStatus.innerHTML = `<i class="fas fa-wifi"></i> متصل`;
            connectionStatus.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                background: #2A9D8F;
                color: white;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            
            setTimeout(() => {
                if (connectionStatus.parentNode) {
                    connectionStatus.remove();
                }
            }, 3000);
            
            document.body.appendChild(connectionStatus);
        } catch (error) {
            console.warn('⚠️ تحذير: مشكلة في الاتصال', error.message);
            showAlert('تحذير: اتصال الإنترنت ضعيف', 'error');
        }
    }
    
    // جعل الدوال متاحة بشكل عام
    window.fetchAndDisplayProducts = fetchAndDisplayProducts;
    window.showUserProductForm = showUserProductForm;
    window.showContactAdminModal = showContactAdminModal;
    window.showRegisterModal = showRegisterModal;
    window.showLoginModal = showLoginModal;
    window.testRegistration = testRegistration;
    
    // دالة اختبار التسجيل
    function testRegistration() {
        showRegisterModal();
    }
    
    // بدء التطبيق
    initializeApp();
});