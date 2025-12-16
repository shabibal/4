// Webaidea Platform - JavaScript with Google Sheets Integration
const API_URL = 'https://script.google.com/macros/s/AKfycbwmuYZ0DhFYL9DwgK-MqI8IisyV6IZX7VjOGcXyIHIvSO3EoF92Pz2kGrujRoAZp31-EQ/exec';

// بيانات محلية للكاش
let users = JSON.parse(localStorage.getItem('webaidea_users')) || [];
let products = JSON.parse(localStorage.getItem('webaidea_products')) || [];
let currentUser = JSON.parse(localStorage.getItem('webaidea_currentUser')) || null;
let isAdminLoggedIn = JSON.parse(localStorage.getItem('webaidea_adminLoggedIn')) || false;

// تهيئة الموقع عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    await checkAdminStatus();
    await loadInitialData();
    
    if (currentUser) {
        document.getElementById('adminLoginTrigger').style.display = 'flex';
    }
    
    // إعداد حدث لزر دخول الإدارة
    document.getElementById('adminLoginTrigger').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentUser || confirm('يجب تسجيل الدخول أولاً. هل تريد فتح نافذة التسجيل؟')) {
            openAuthModal();
        }
    });
});

// التحقق من حالة دخول المدير
async function checkAdminStatus() {
    const adminPanel = document.getElementById('adminPanel');
    if (isAdminLoggedIn) {
        adminPanel.style.display = 'block';
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('.products-section').style.display = 'none';
        document.querySelector('.how-section').style.display = 'none';
        document.querySelector('.footer').style.display = 'none';
        document.querySelector('.navbar').style.display = 'none';
    } else {
        adminPanel.style.display = 'none';
        document.querySelector('.hero').style.display = 'flex';
        document.querySelector('.products-section').style.display = 'block';
        document.querySelector('.how-section').style.display = 'block';
        document.querySelector('.footer').style.display = 'block';
        document.querySelector('.navbar').style.display = 'block';
    }
}

// تحميل البيانات الأولية
async function loadInitialData() {
    try {
        const [productsResponse, usersResponse] = await Promise.all([
            fetchData('getProducts'),
            fetchData('getUsers')
        ]);
        
        if (productsResponse.status === 200) {
            products = productsResponse.data || [];
            localStorage.setItem('webaidea_products', JSON.stringify(products));
        }
        
        if (usersResponse.status === 200) {
            users = usersResponse.data || [];
            localStorage.setItem('webaidea_users', JSON.stringify(users));
        }
        
        renderProducts();
        renderMerchantsTable();
        renderAccountsTable();
        renderAdsTable();
        populateMerchantSelect();
    } catch (error) {
        console.error('Error loading data:', error);
        // استخدام البيانات المخزنة محلياً إذا فشل الاتصال
        renderProducts();
        renderMerchantsTable();
        renderAccountsTable();
        renderAdsTable();
        populateMerchantSelect();
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
        const response = await fetch(url.toString());
        const data = await response.json();
        console.log(`${action} response:`, data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// دالة مساعدة للاتصال بالAPI (POST)
async function postData(action, params = {}) {
    const formData = new FormData();
    formData.append('action', action);
    
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            formData.append(key, params[key]);
        }
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log(`${action} response:`, data);
        return data;
    } catch (error) {
        console.error('Post error:', error);
        throw error;
    }
}

// رفع صورة إلى Drive
async function uploadImageToDrive(imageData) {
    try {
        const response = await postData('uploadImage', {
            imageData: imageData,
            fileName: 'product_' + Date.now() + '.jpg'
        });
        
        if (response.status === 200) {
            return response.data.directUrl;
        }
        return null;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

// معاينة الصورة
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            preview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// عرض المنتجات
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
            </div>
        `;
        return;
    }
    
    const featuredProducts = products.filter(p => p.featured);
    const regularProducts = products.filter(p => !p.featured);
    const allProducts = [...featuredProducts, ...regularProducts];
    
    allProducts.forEach(product => {
        const merchant = users.find(u => u.id == product.merchantId);
        const card = document.createElement('div');
        card.className = 'product-card';
        
        if (product.featured) {
            card.style.border = '2px solid #ffb300';
            card.style.position = 'relative';
            card.innerHTML += `<div class="special-badge"><i class="fas fa-crown"></i> مميز</div>`;
        }
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.title || 'منتج'}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+Loading'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title || 'بدون عنوان'}</h3>
                <p class="product-description">${(product.description || '').substring(0, 80)}${product.description && product.description.length > 80 ? '...' : ''}</p>
                <div class="product-meta">
                    <div>
                        <div class="product-price">${product.price || 0} ريال</div>
                        <div class="product-merchant">
                            <i class="fas fa-user"></i> ${merchant ? merchant.name : 'تاجر'}
                        </div>
                    </div>
                </div>
                <a href="javascript:void(0);" class="view-btn" onclick="showProductDetail(${product.id})">
                    عرض التفاصيل
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// عرض جداول الإدارة
function renderMerchantsTable() {
    const tbody = document.querySelector('#merchantsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
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
    
    merchants.forEach(user => {
        const userAds = products.filter(p => p.merchantId == user.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name || 'غير معروف'}</td>
            <td>${user.email || 'غير معروف'}</td>
            <td>${user.joinDate || 'غير معروف'}</td>
            <td>${userAds.length}</td>
            <td>
                ${user.type !== 'admin' ? `
                    <button class="action-btn btn-remove" onclick="removeMerchant('${user.id}')" title="إلغاء صلاحية التاجر">
                        <i class="fas fa-user-times"></i>
                    </button>
                ` : ''}
                <button class="action-btn btn-view" onclick="viewUserAds('${user.id}')" title="عرض إعلانات التاجر">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAccountsTable() {
    const tbody = document.querySelector('#accountsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
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
                ${user.type === 'user' ? `
                    <button class="action-btn btn-approve" onclick="makeMerchant('${user.id}')" title="ترقية إلى تاجر">
                        <i class="fas fa-user-check"></i> جعله تاجر
                    </button>
                ` : user.type === 'merchant' ? 
                    '<span style="color:#2e7d32;">تاجر بالفعل</span>' :
                    '<span style="color:#d32f2f;">مدير النظام</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAdsTable() {
    const tbody = document.querySelector('#adsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
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
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ملء قائمة التجار في النموذج
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
    if (!table) return;
    
    const rows = table.getElementsByTagName('tr');
    
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
    }
}

// ترقية مستخدم إلى تاجر
async function makeMerchant(userId) {
    if (confirm('هل تريد حقًا ترقية هذا المستخدم إلى تاجر؟')) {
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
                    
                    renderMerchantsTable();
                    renderAccountsTable();
                    populateMerchantSelect();
                    alert('تم ترقية المستخدم إلى تاجر بنجاح.');
                }
            } else {
                alert(response.message || 'فشلت العملية');
            }
        } catch (error) {
            alert('حدث خطأ أثناء ترقية المستخدم');
            console.error(error);
        }
    }
}

// إلغاء صلاحية التاجر
async function removeMerchant(userId) {
    if (confirm('هل تريد إلغاء صلاحية التاجر عن هذا المستخدم؟')) {
        try {
            // في هذا الإصجار، نقوم فقط بتحديث البيانات المحلية
            // في تطبيق حقيقي، ستقوم هنا باستدعاء API
            const user = users.find(u => u.id == userId);
            if (user && user.type === 'merchant') {
                user.type = 'user';
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                
                renderMerchantsTable();
                renderAccountsTable();
                populateMerchantSelect();
                alert('تم إلغاء صلاحية التاجر.');
            }
        } catch (error) {
            alert('حدث خطأ أثناء العملية');
            console.error(error);
        }
    }
}

// إضافة منتج جديد
async function postAdminAd(event) {
    event.preventDefault();
    
    const title = document.getElementById('adTitle').value;
    const price = document.getElementById('adPrice').value;
    const description = document.getElementById('adDescription').value;
    const contact = document.getElementById('adContact').value;
    const merchantId = document.getElementById('adMerchant').value;
    const imagePreview = document.getElementById('imagePreview');
    const imageData = imagePreview.dataset.imageData;
    
    if (!merchantId) {
        alert('يرجى اختيار تاجر لنشر الإعلان.');
        return;
    }
    
    if (!imageData) {
        alert('يرجى اختيار صورة للمنتج.');
        return;
    }
    
    try {
        // رفع الصورة أولاً
        const imageUrl = await uploadImageToDrive(imageData);
        
        if (!imageUrl) {
            alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
            return;
        }
        
        // إضافة المنتج
        const response = await postData('addProduct', {
            isAdmin: 'true',
            userId: merchantId,
            title: title,
            price: price,
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
            imagePreview.innerHTML = `
                <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
                <p style="color: #999; margin-top: 10px;">لم يتم اختيار صورة</p>
            `;
            imagePreview.dataset.imageData = '';
            
            // تحديث العروض
            renderAdsTable();
            renderProducts();
            alert('تم نشر الإعلان المميز بنجاح!');
        } else {
            alert(response.message || 'فشل نشر الإعلان');
        }
    } catch (error) {
        alert('حدث خطأ أثناء نشر الإعلان');
        console.error(error);
    }
}

// حذف إعلان
async function removeAd(productId) {
    if (confirm('هل تريد حذف هذا الإعلان؟')) {
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
                
                renderAdsTable();
                renderProducts();
                alert('تم حذف الإعلان بنجاح.');
            } else {
                alert(response.message || 'فشلت العملية');
            }
        } catch (error) {
            alert('حدث خطأ أثناء حذف الإعلان');
            console.error(error);
        }
    }
}

// جعل الإعلان مميزاً
function makeFeatured(productId) {
    if (confirm('هل تريد جعل هذا الإعلان مميزاً؟')) {
        const product = products.find(p => p.id == productId);
        if (product) {
            product.featured = true;
            localStorage.setItem('webaidea_products', JSON.stringify(products));
            
            renderAdsTable();
            renderProducts();
            alert('تم جعل الإعلان مميزاً.');
        }
    }
}

// عرض إعلانات تاجر معين
function viewUserAds(userId) {
    const userAds = products.filter(p => p.merchantId == userId);
    const user = users.find(u => u.id == userId);
    
    if (userAds.length > 0) {
        let message = `إعلانات ${user.name}:\n\n`;
        userAds.forEach(ad => {
            message += `- ${ad.title} (${ad.price} ريال)\n`;
        });
        alert(message);
    } else {
        alert(`ليس لدى ${user.name} أي إعلانات منشورة.`);
    }
}

// معالجة تسجيل الدخول
async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const isLoginMode = document.getElementById('submitBtn').textContent === 'دخول';
    
    try {
        if (isLoginMode) {
            // تسجيل الدخول
            if (email === 'msdfrrt@gmail.com' && password === 'Shabib95873061@99') {
                // دخول كمدير
                isAdminLoggedIn = true;
                localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(true));
                currentUser = {
                    id: 0,
                    name: 'Administrator',
                    email: email,
                    type: 'admin'
                };
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                
                await checkAdminStatus();
                closeModal();
                alert('مرحباً بك في لوحة تحكم الإدارة!');
                return;
            }
            
            // تسجيل الدخول كمستخدم عادي
            const response = await postData('login', { email, password });
            
            if (response.status === 200) {
                currentUser = response.data;
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                document.getElementById('adminLoginTrigger').style.display = 'flex';
                closeModal();
                alert(`مرحباً بعودتك ${currentUser.name}!`);
                
                // تحديث البيانات المحلية
                await loadInitialData();
            } else {
                alert(response.message || 'فشل تسجيل الدخول');
            }
        } else {
            // إنشاء حساب جديد
            const response = await postData('register', { name, email, password });
            
            if (response.status === 201) {
                currentUser = response.data;
                localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
                document.getElementById('adminLoginTrigger').style.display = 'flex';
                closeModal();
                alert(`تم إنشاء حسابك بنجاح ${name}!`);
                
                // تحديث قائمة المستخدمين
                users.push(response.data);
                localStorage.setItem('webaidea_users', JSON.stringify(users));
                renderAccountsTable();
            } else {
                alert(response.message || 'فشل إنشاء الحساب');
            }
        }
    } catch (error) {
        alert('حدث خطأ في الاتصال بالخادم. تأكد من نشر Apps Script بشكل صحيح.');
        console.error('Auth error:', error);
    }
}

// عرض تفاصيل المنتج
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    const merchant = users.find(u => u.id == product.merchantId);
    
    if (!product) {
        alert('المنتج غير موجود');
        return;
    }
    
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
                ${product.featured ? '<div class="featured-badge"><i class="fas fa-crown"></i> إعلان مميز</div>' : ''}
                <div class="detail-merchant"><i class="fas fa-user-tie"></i> <strong>التاجر:</strong> ${merchant ? merchant.name : 'غير معروف'}</div>
                <div class="detail-contact"><i class="fas fa-phone"></i> <strong>رقم التواصل:</strong> ${product.contact || 'غير متوفر'}</div>
                <div class="detail-date"><i class="fas fa-calendar"></i> <strong>تاريخ النشر:</strong> ${product.date || 'غير معروف'}</div>
            </div>
        </div>
        <div class="detail-description">
            <h3><i class="fas fa-align-right"></i> وصف المنتج</h3>
            <p>${product.description || 'لا يوجد وصف'}</p>
        </div>
        <div class="detail-actions">
            <button class="btn btn-primary" onclick="closeDetailModal()">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

// وظائف مساعدة أخرى
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

function openAdminTab(evt, tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    const tabLinks = document.getElementsByClassName('tab-link');
    
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active-tab');
    }
    
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active-tab');
    evt.currentTarget.classList.add('active');
}

function redirectToInstagram() {
    window.open('https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr', '_blank');
}

function switchAuthMode() {
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const nameField = document.getElementById('nameField');
    
    if (submitBtn.textContent === 'دخول') {
        title.textContent = 'انشاء حساب جديد';
        submitBtn.textContent = 'تسجيل';
        switchText.textContent = 'لديك حساب بالفعل؟';
        switchLink.textContent = 'تسجيل الدخول';
        nameField.style.display = 'block';
    } else {
        title.textContent = 'تسجيل الدخول';
        submitBtn.textContent = 'دخول';
        switchText.textContent = 'ليس لديك حساب؟';
        switchLink.textContent = 'انشاء حساب جديد';
        nameField.style.display = 'none';
    }
}

function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authForm').reset();
    
    if (document.getElementById('submitBtn').textContent !== 'دخول') {
        switchAuthMode();
    }
}

function closeDetailModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
        isAdminLoggedIn = false;
        localStorage.setItem('webaidea_adminLoggedIn', JSON.stringify(false));
        checkAdminStatus();
        alert('تم تسجيل الخروج من لوحة الإدارة.');
    }
}

// إغلاق النوافذ المنبثقة بالنقر خارجها
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const detailModal = document.getElementById('productDetailModal');
    
    if (event.target === authModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
};