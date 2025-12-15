document.addEventListener('DOMContentLoaded', () => {
    // روابط السكربت
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
    const mobileFooterBar = document.querySelector('.mobile-footer-bar');
    const mobilePostBtn = document.getElementById('mobile-post-btn');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    const mobileTabs = document.querySelectorAll('.mobile-tab');
    
    // حالة التطبيق
    let currentUser = null;
    let isAdmin = false;
    let selectedImages = [];
    let tempImages = [];
    
    // === دالة الاتصال باستخدام JSONP ===
    async function makeRequest(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2);
            
            let url = `${SCRIPT_URL}?action=${action}&callback=${callbackName}`;
            
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                }
            });
            
            console.log('🔗 إرسال طلب:', action, params);
            
            window[callbackName] = function(data) {
                delete window[callbackName];
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                
                if (data && data.status === 'success') {
                    resolve(data);
                } else {
                    reject(new Error(data?.message || 'خطأ غير معروف'));
                }
            };
            
            const script = document.createElement('script');
            script.src = url;
            
            script.onerror = function() {
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
            }, 10000);
        });
    }
    
    // === دوال العرض ===
    function showView(viewId) {
        [productsView, authView, adminPanel].forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(viewId).classList.remove('hidden');
        
        // تحديث شريط الجوال
        mobileTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === viewId) {
                tab.classList.add('active');
            }
        });
        
        // إظهار/إخفاء شريط الجوال
        if (viewId === 'products-view' || (currentUser && viewId === 'admin-panel')) {
            mobileFooterBar.classList.remove('hidden');
        } else {
            mobileFooterBar.classList.add('hidden');
        }
    }
    
    function updateNavbar() {
        mainNav.innerHTML = '';
        
        if (isAdmin && currentUser && currentUser.email === ADMIN_EMAIL) {
            mainNav.innerHTML = `
                <button id="admin-panel-btn" class="nav-btn">
                    <i class="fas fa-cog"></i> لوحة التحكم
                </button>
                <button id="logout-btn" class="nav-btn">
                    <i class="fas fa-sign-out-alt"></i> تسجيل خروج
                </button>
            `;
        } else if (currentUser) {
            mainNav.innerHTML = `
                <span class="welcome-msg">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </span>
                ${currentUser.isMerchant ? `
                    <button id="post-ad-btn" class="nav-btn">
                        <i class="fas fa-plus"></i> نشر إعلان
                    </button>
                ` : ''}
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
            
            if (adminPanelBtn) adminPanelBtn.addEventListener('click', showAdminPanel);
            if (loginBtn) loginBtn.addEventListener('click', showLogin);
            if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
            if (postAdBtn) postAdBtn.addEventListener('click', showMerchantPostAdForm);
        }, 100);
    }
    
    function showAdminPanel() {
        showView('admin-panel');
        setupAdminPanel();
    }
    
    function showLogin() {
        showView('auth-view');
        showLoginBtn.click();
    }
    
    // === دوال المنتجات ===
    async function fetchAndDisplayProducts() {
        showLoading(productsContainer);
        
        try {
            const data = await makeRequest('getAllProducts');
            
            if (data.status === 'success') {
                displayProducts(data.products);
                setupFilterButtons(data.products);
            } else {
                showError('حدث خطأ في تحميل المنتجات');
            }
        } catch (error) {
            showError('لا يمكن الاتصال بالخادم');
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
            const card = createProductCard(product);
            card.addEventListener('click', () => showProductDetails(product));
            productsContainer.appendChild(card);
        });
    }
    
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = `product-card ${product.isFeatured ? 'featured' : ''}`;
        
        const firstImage = product.images && product.images.length > 0 
            ? product.images[0] 
            : product.imageUrl || 'https://via.placeholder.com/300x200.png?text=لا+توجد+صورة';
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${firstImage}" alt="${product.name}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200.png?text=صورة+غير+متوفرة'">
                ${product.isFeatured ? '<span class="featured-badge">مميز</span>' : ''}
                ${product.price ? `<span class="price-badge">${product.price} ر.س</span>` : ''}
            </div>
            <div class="product-card-content">
                <h3>${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <div class="product-meta">
                    <span class="posted-by">
                        <i class="fas fa-user"></i> ${product.postedByName || product.postedBy}
                    </span>
                    <span class="product-date">
                        <i class="fas fa-calendar"></i> ${formatDate(product.datePosted)}
                    </span>
                </div>
            </div>
        `;
        
        return card;
    }
    
    function setupFilterButtons(products) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                const filteredProducts = filter === 'featured' 
                    ? products.filter(p => p.isFeatured)
                    : products;
                
                displayProducts(filteredProducts);
            });
        });
    }
    
    function showProductDetails(product) {
        const modal = document.getElementById('product-details-modal');
        const title = document.getElementById('product-modal-title');
        const desc = document.getElementById('product-modal-desc');
        const seller = document.getElementById('product-modal-seller');
        const phone = document.getElementById('product-modal-phone');
        const date = document.getElementById('product-modal-date');
        const price = document.getElementById('product-modal-price');
        const gallery = document.getElementById('product-gallery');
        const priceContainer = document.getElementById('price-container');
        const whatsappBtn = document.getElementById('whatsapp-contact');
        const callBtn = document.getElementById('call-contact');
        
        // تعبئة البيانات
        title.textContent = product.name;
        desc.textContent = product.description;
        seller.textContent = product.postedByName || product.postedBy;
        phone.textContent = product.phone || 'غير متوفر';
        date.textContent = formatDate(product.datePosted);
        
        // عرض السعر إن وجد
        if (product.price) {
            price.textContent = `${product.price} ريال سعودي`;
            priceContainer.classList.remove('hidden');
        } else {
            priceContainer.classList.add('hidden');
        }
        
        // عرض الصور
        gallery.innerHTML = '';
        const images = product.images || [product.imageUrl];
        images.forEach(img => {
            if (img) {
                const imgElement = document.createElement('img');
                imgElement.src = img;
                imgElement.className = 'gallery-image';
                imgElement.onerror = () => imgElement.src = 'https://via.placeholder.com/300x200.png?text=صورة+غير+متوفرة';
                gallery.appendChild(imgElement);
            }
        });
        
        // إعداد أزرار الاتصال
        if (product.phone) {
            whatsappBtn.onclick = () => {
                window.open(`https://wa.me/966${product.phone.replace(/^0/, '')}?text=مرحباً، أنا مهتم بالمنتج: ${product.name}`, '_blank');
            };
            callBtn.onclick = () => {
                window.location.href = `tel:+966${product.phone.replace(/^0/, '')}`;
            };
            whatsappBtn.classList.remove('hidden');
            callBtn.classList.remove('hidden');
        } else {
            whatsappBtn.classList.add('hidden');
            callBtn.classList.add('hidden');
        }
        
        // إظهار المودال
        modal.classList.remove('hidden');
        
        // إغلاق المودال
        modal.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        };
    }
    
    // === دوال الصور ===
    function setupImageUpload() {
        const uploadArea = document.getElementById('admin-upload-area');
        const fileInput = document.getElementById('admin-product-images');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.background = 'rgba(230, 126, 34, 0.1)';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.background = '';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.background = '';
                handleImageDrop(e.dataTransfer.files);
            });
            
            fileInput.addEventListener('change', (e) => {
                handleImageSelection(e.target.files);
            });
        }
    }
    
    function handleImageSelection(files) {
        const maxFiles = 5;
        if (files.length + tempImages.length > maxFiles) {
            showAlert(`يمكنك رفع حتى ${maxFiles} صور فقط`, 'error');
            return;
        }
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    tempImages.push(e.target.result);
                    updateImagePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    function handleImageDrop(files) {
        handleImageSelection(files);
    }
    
    function updateImagePreview() {
        const preview = document.getElementById('admin-image-preview');
        if (!preview) return;
        
        preview.innerHTML = '';
        
        tempImages.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'preview-image';
            div.innerHTML = `
                <img src="${img}" alt="Preview ${index + 1}">
                <button class="remove-image" data-index="${index}">&times;</button>
            `;
            preview.appendChild(div);
        });
        
        // إضافة مستمعي الأحداث لأزرار الحذف
        preview.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                tempImages.splice(index, 1);
                updateImagePreview();
            });
        });
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
        
        const btn = loginForm.querySelector('.btn-submit');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        btn.disabled = true;
        
        try {
            const data = await makeRequest('login', { email, password });
            
            if (data.status === 'success') {
                currentUser = data.user;
                isAdmin = data.isAdmin && currentUser.email === ADMIN_EMAIL;
                
                updateNavbar();
                showView('products-view');
                fetchAndDisplayProducts();
                
                showAlert(`مرحباً بك ${currentUser.name}!`, 'success');
                loginForm.reset();
            } else {
                showAlert(data.message, 'error');
            }
        } catch (error) {
            showAlert(error.message || 'فشل الاتصال بالخادم', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        
        if (!validateRegistration(name, email, phone, password)) return;
        
        const btn = registerForm.querySelector('.btn-submit');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        btn.disabled = true;
        
        try {
            const data = await makeRequest('register', { name, email, phone, password });
            
            if (data.status === 'success') {
                currentUser = data.user;
                isAdmin = data.isAdmin && currentUser.email === ADMIN_EMAIL;
                
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
            showAlert(error.message || 'فشل الاتصال بالخادم', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
    
    function validateRegistration(name, email, phone, password) {
        if (name.length < 2) {
            showAlert('الاسم يجب أن يكون حرفين على الأقل', 'error');
            return false;
        }
        
        if (!validateEmail(email)) {
            showAlert('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return false;
        }
        
        if (!validatePhone(phone)) {
            showAlert('يرجى إدخال رقم جوال سعودي صحيح (05xxxxxxxx)', 'error');
            return false;
        }
        
        if (password.length < 6) {
            showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return false;
        }
        
        return true;
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        const re = /^05\d{8}$/;
        return re.test(phone);
    }
    
    // === دوال المساعدة ===
    function showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }
    
    function showError(message) {
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="fetchAndDisplayProducts()">إعادة المحاولة</button>
            </div>
        `;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'غير معروف';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'غير معروف';
        }
    }
    
    function showAlert(message, type = 'info') {
        const existing = document.querySelector('.alert-message');
        if (existing) existing.remove();
        
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="close-alert">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => alert.classList.add('show'), 10);
        
        alert.querySelector('.close-alert').addEventListener('click', () => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        });
        
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
        await fetchAndDisplayUsers();
        await fetchAndDisplayAdminAds();
        setupImageUpload();
        
        // علامات التبويب
        document.querySelectorAll('.admin-nav button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-sub-view').forEach(v => v.classList.add('hidden'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.view).classList.remove('hidden');
            });
        });
        
        // البحث
        const searchInput = document.getElementById('search-user');
        if (searchInput) {
            searchInput.addEventListener('input', searchUsers);
        }
        
        // نشر إعلان إداري
        const adminForm = document.getElementById('admin-post-ad-form');
        if (adminForm) {
            adminForm.addEventListener('submit', handleAdminPost);
            document.getElementById('clear-admin-form').addEventListener('click', () => {
                adminForm.reset();
                tempImages = [];
                updateImagePreview();
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
            console.error('Error fetching users:', error);
        }
    }
    
    function displayUsers(users) {
        const accountsTable = document.getElementById('accounts-table-body');
        const merchantsTable = document.getElementById('merchants-table-body');
        
        accountsTable.innerHTML = '';
        merchantsTable.innerHTML = '';
        
        if (!users || users.length === 0) {
            accountsTable.innerHTML = '<tr><td colspan="4">لا يوجد مستخدمون مسجلون</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = createUserRow(user);
            
            if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                accountsTable.appendChild(row);
            }
            
            if (user.isMerchant && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                merchantsTable.appendChild(row.cloneNode(true));
            }
        });
        
        setupUserActionButtons();
    }
    
    function createUserRow(user) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'غير متوفر'}</td>
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
        return row;
    }
    
    function setupUserActionButtons() {
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, true));
        });
        
        document.querySelectorAll('.revoke-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleMerchantStatus(btn.dataset.email, false));
        });
    }
    
    async function toggleMerchantStatus(email, makeMerchant) {
        if (!confirm(`هل أنت متأكد من ${makeMerchant ? 'ترقية' : 'إلغاء ترقية'} المستخدم ${email}؟`)) return;
        
        try {
            const data = await makeRequest('toggleMerchantStatus', { email });
            showAlert(data.message, data.status);
            if (data.status === 'success') {
                await fetchAndDisplayUsers();
            }
        } catch (error) {
            showAlert('حدث خطأ أثناء التعديل', 'error');
        }
    }
    
    function searchUsers(e) {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#accounts-table-body tr');
        
        rows.forEach(row => {
            const email = row.cells[1].textContent.toLowerCase();
            const name = row.cells[0].textContent.toLowerCase();
            const phone = row.cells[2].textContent.toLowerCase();
            
            const isVisible = email.includes(term) || name.includes(term) || phone.includes(term);
            row.style.display = isVisible ? '' : 'none';
        });
    }
    
    async function fetchAndDisplayAdminAds() {
        try {
            const data = await makeRequest('getAllProducts');
            if (data.status === 'success') {
                displayAdminAds(data.products);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
        }
    }
    
    function displayAdminAds(products) {
        const container = document.getElementById('admin-ads-container');
        container.innerHTML = '';
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ad"></i>
                    <h3>لا توجد إعلانات منشورة</h3>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const card = createProductCard(product);
            container.appendChild(card);
        });
    }
    
    async function handleAdminPost(e) {
        e.preventDefault();
        
        const name = document.getElementById('admin-product-name').value.trim();
        const desc = document.getElementById('admin-product-desc').value.trim();
        const phone = document.getElementById('admin-product-phone').value.trim();
        const price = document.getElementById('admin-product-price').value;
        const isFeatured = document.getElementById('is-featured-ad').checked;
        
        if (!name || !desc) {
            showAlert('اسم المنتج والوصف مطلوبان', 'error');
            return;
        }
        
        if (phone && !validatePhone(phone)) {
            showAlert('رقم الجوال غير صحيح', 'error');
            return;
        }
        
        try {
            // في هذا المثال، سنرسل فقط الصورة الأولى
            const imageUrl = tempImages.length > 0 ? tempImages[0] : '';
            
            const data = await makeRequest('addProduct', {
                productName: name,
                description: desc,
                imageUrl: imageUrl,
                phone: phone,
                price: price,
                postedBy: ADMIN_EMAIL,
                isFeatured: isFeatured
            });
            
            showAlert(data.message, data.status);
            
            if (data.status === 'success') {
                e.target.reset();
                tempImages = [];
                updateImagePreview();
                await fetchAndDisplayAdminAds();
                await fetchAndDisplayProducts();
            }
        } catch (error) {
            showAlert('فشل نشر الإعلان', 'error');
        }
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
                            <label for="merchant-product-images">صور المنتج</label>
                            <div class="image-upload-container">
                                <div class="upload-area" id="merchant-upload-area">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>اسحب وأفلت الصور هنا أو انقر للاختيار</p>
                                    <span class="upload-hint">يمكنك رفع حتى 5 صور</span>
                                </div>
                                <input type="file" id="merchant-product-images" multiple accept="image/*" hidden>
                                <div class="image-preview" id="merchant-image-preview"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="merchant-product-phone">رقم التواصل</label>
                            <input type="tel" id="merchant-product-phone" placeholder="رقم الجوال (اختياري)" value="${currentUser.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label for="merchant-product-price">السعر (ريال سعودي)</label>
                            <input type="number" id="merchant-product-price" placeholder="السعر بالريال">
                        </div>
                        <div class="form-buttons">
                            <button type="submit" class="btn primary-btn">
                                <i class="fas fa-paper-plane"></i> نشر الإعلان
                            </button>
                            <button type="button" class="btn secondary-btn" id="cancel-merchant-post">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // إعداد رفع الصور للتاجر
        const uploadArea = modal.querySelector('#merchant-upload-area');
        const fileInput = modal.querySelector('#merchant-product-images');
        const preview = modal.querySelector('#merchant-image-preview');
        let merchantImages = [];
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        merchantImages.push(e.target.result);
                        updateMerchantPreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
        
        function updateMerchantPreview() {
            preview.innerHTML = '';
            merchantImages.forEach((img, index) => {
                const div = document.createElement('div');
                div.className = 'preview-image';
                div.innerHTML = `
                    <img src="${img}" alt="Preview ${index + 1}">
                    <button class="remove-image" data-index="${index}">&times;</button>
                `;
                preview.appendChild(div);
            });
            
            preview.querySelectorAll('.remove-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    merchantImages.splice(index, 1);
                    updateMerchantPreview();
                });
            });
        }
        
        // إغلاق المودال
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-merchant-post').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // إرسال النموذج
        modal.querySelector('#merchant-post-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = modal.querySelector('#merchant-product-name').value.trim();
            const desc = modal.querySelector('#merchant-product-desc').value.trim();
            const phone = modal.querySelector('#merchant-product-phone').value.trim();
            const price = modal.querySelector('#merchant-product-price').value;
            
            if (!name || !desc) {
                showAlert('اسم المنتج والوصف مطلوبان', 'error');
                return;
            }
            
            if (phone && !validatePhone(phone)) {
                showAlert('رقم الجوال غير صحيح', 'error');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
            submitBtn.disabled = true;
            
            try {
                const imageUrl = merchantImages.length > 0 ? merchantImages[0] : '';
                
                const data = await makeRequest('addProduct', {
                    productName: name,
                    description: desc,
                    imageUrl: imageUrl,
                    phone: phone,
                    price: price,
                    postedBy: currentUser.email,
                    postedByName: currentUser.name,
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
                showAlert('فشل نشر الإعلان', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // === إعدادات الجوال ===
    function setupMobileNavigation() {
        // التنقل بين التبويبات
        mobileTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const view = tab.dataset.view;
                if (view) {
                    showView(view);
                }
            });
        });
        
        // زر نشر على الجوال
        if (mobilePostBtn) {
            mobilePostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser && currentUser.isMerchant) {
                    showMerchantPostAdForm();
                } else if (currentUser) {
                    showAlert('يجب أن تكون تاجراً لنشر إعلان', 'error');
                } else {
                    showAlert('يجب تسجيل الدخول أولاً', 'error');
                    showView('auth-view');
                }
            });
        }
        
        // زر الملف الشخصي على الجوال
        if (mobileProfileBtn) {
            mobileProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    // عرض معلومات المستخدم
                    showAlert(`مرحباً ${currentUser.name}!\nالبريد: ${currentUser.email}\nرقم الجوال: ${currentUser.phone || 'غير معروف'}`, 'info');
                } else {
                    showView('auth-view');
                }
            });
        }
    }
    
    // === بدء التطبيق ===
    async function initializeApp() {
        console.log('🚀 بدء تشغيل WebAidea...');
        
        // اختبار الاتصال
        try {
            const test = await makeRequest('ping');
            console.log('✅ اتصال السكربت:', test);
        } catch (error) {
            console.warn('⚠️ تحذير: مشكلة في الاتصال', error.message);
        }
        
        // تحميل البيانات
        updateNavbar();
        fetchAndDisplayProducts();
        showLoginBtn.click();
        setupMobileNavigation();
        
        // إعداد الروابط في الفوتر
        document.getElementById('privacy-policy')?.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('سياسة الخصوصية: نحن نحترم خصوصيتك ولا نشارك بياناتك مع أي طرف ثالث.', 'info');
        });
        
        document.getElementById('terms-service')?.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('الشروط والأحكام: يرجى الالتزام بشروط الاستخدام ونشر المحتوى المناسب فقط.', 'info');
        });
        
        document.getElementById('contact-us')?.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert('للتواصل: يمكنك مراسلتنا على البريد الإلكتروني: msdfrrt@gmail.com', 'info');
        });
    }
    
    // بدء التطبيق
    initializeApp();
});

// دالة عامة لإعادة تحميل المنتجات
window.fetchAndDisplayProducts = function() {
    document.dispatchEvent(new Event('DOMContentLoaded'));
};