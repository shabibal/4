// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AKfycbxFuMZK64X-7aI6Ivt2Wv-QKzO1IuQKbRiEW2HK2qLm9RBzlcIgNopO3cmuaXyKeoyGvQ",
    authDomain: "https://docs.google.com/spreadsheets/d/1eNwXAmrzbNUfgt7gUCpgPW-vZ-BeLmTyedcNP-iTpb8/edit?usp=sharing",
    projectId: "webaidea",
    storageBucket: "webaidea.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:123456789"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// متغيرات عامة
let currentUser = null;
let isAdmin = false;
let products = [];
let merchants = [];
let users = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 6;

// عناصر DOM
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const addProductModal = document.getElementById('addProductModal');
const adminPanel = document.getElementById('adminPanel');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const productsGrid = document.getElementById('productsGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const logoutBtn = document.getElementById('logoutBtn');
const scrollToTopBtn = document.createElement('div');
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(scrollToTopBtn);

// أحداث DOM
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من تسجيل الدخول
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkIfAdmin(user.email);
            
            // تغيير زر تسجيل الدخول
            loginBtn.textContent = 'حسابي';
            loginBtn.addEventListener('click', () => {
                if (isAdmin) {
                    showAdminPanel();
                } else {
                    showAddProductModal();
                }
            });
        } else {
            loginBtn.textContent = 'تسجيل الدخول';
            loginBtn.addEventListener('click', showLoginModal);
        }
    });

    // تحميل المنتجات
    loadProducts();
    
    // إعداد أحداث الأزرار
    setupEventListeners();
    
    // إعداد تأثيرات التمرير
    setupScrollEffects();
});

// إعداد أحداث الأزرار
function setupEventListeners() {
    // زر الهامبرجر
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // أزرار إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    // النقر خارج النافذة المنبثقة لإغلاقها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // نموذج تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // التحقق إذا كان حساب الإدارة
        if (email === 'msdfrrt@gmail.com' && password === 'Shabib95873061@99') {
            isAdmin = true;
            showAdminPanel();
            loginModal.style.display = 'none';
            showNotification('تم تسجيل الدخول بنجاح', 'success');
        } else {
            // تسجيل الدخول العادي عبر Firebase
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    loginModal.style.display = 'none';
                    showNotification('تم تسجيل الدخول بنجاح', 'success');
                })
                .catch(error => {
                    showNotification(error.message, 'error');
                });
        }
    });
    
    // نموذج التسجيل
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('كلمات المرور غير متطابقة', 'error');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // حفظ بيانات المستخدم في Firestore
                db.collection('users').doc(userCredential.user.uid).set({
                    name,
                    email,
                    isMerchant: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                registerModal.style.display = 'none';
                showNotification('تم إنشاء الحساب بنجاح', 'success');
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    });
    
    // التبديل بين نموذجي تسجيل الدخول والتسجيل
    document.getElementById('showRegisterForm').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });
    
    document.getElementById('showLoginForm').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
    });
    
    // نموذج إضافة منتج (للتجار)
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addProduct('merchant');
    });
    
    // نموذج إضافة منتج (للإدارة)
    document.getElementById('adminAddProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addProduct('admin');
    });
    
    // أزرار التصفية
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            filterProducts(filter);
        });
    });
    
    // زر عرض المزيد
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        displayProducts();
    });
    
    // معاينة الصورة
    document.getElementById('productImage').addEventListener('change', (e) => {
        previewImage(e.target, 'imagePreview');
    });
    
    document.getElementById('adminProductImage').addEventListener('change', (e) => {
        previewImage(e.target, 'adminImagePreview');
    });
    
    // نموذج التواصل
    document.getElementById('contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // حفظ الرسالة في Firestore
        db.collection('messages').add({
            name,
            email,
            message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('تم إرسال رسالتك بنجاح', 'success');
        document.getElementById('contactForm').reset();
    });
    
    // تبويبات لوحة التحكم
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // تحميل البيانات حسب التبويب
            if (tabId === 'merchants') {
                loadMerchants();
            } else if (tabId === 'accounts') {
                loadUsers();
            } else if (tabId === 'ads') {
                loadProductsForAdmin();
            }
        });
    });
    
    // البحث في التجار
    document.getElementById('merchantSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('merchantsTable', searchTerm);
    });
    
    // البحث في الحسابات
    document.getElementById('accountSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('accountsTable', searchTerm);
    });
    
    // البحث في الإعلانات
    document.getElementById('adSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterTable('adsTable', searchTerm);
    });
    
    // زر تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            isAdmin = false;
            adminPanel.style.display = 'none';
            document.querySelector('main').style.display = 'block';
            showNotification('تم تسجيل الخروج بنجاح', 'success');
        });
    });
    
    // زر التمرير للأعلى
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// إعداد تأثيرات التمرير
function setupScrollEffects() {
    window.addEventListener('scroll', () => {
        // إظهار/إخفاء زر التمرير للأعلى
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
        
        // تأثير التلاشي للعناصر
        document.querySelectorAll('.fade-in').forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            
            if (elementTop < window.innerHeight && elementBottom > 0) {
                element.classList.add('visible');
            }
        });
    });
}

// عرض نافذة تسجيل الدخول
function showLoginModal() {
    loginModal.style.display = 'block';
}

// عرض نافذة إضافة منتج
function showAddProductModal() {
    // التحقق إذا كان المستخدم تاجرًا
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).get()
            .then(doc => {
                if (doc.exists && doc.data().isMerchant) {
                    addProductModal.style.display = 'block';
                } else {
                    showNotification('يجب أن تكون تاجرًا معتمدًا لنشر إعلان', 'warning');
                }
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
}

// عرض لوحة التحكم
function showAdminPanel() {
    adminPanel.style.display = 'block';
    document.querySelector('main').style.display = 'none';
    
    // تحميل البيانات الأولية
    loadMerchants();
}

// التحقق إذا كان المستخدم إدارة
function checkIfAdmin(email) {
    if (email === 'msdfrrt@gmail.com') {
        isAdmin = true;
    }
}

// تحميل المنتجات
function loadProducts() {
    db.collection('products').orderBy('createdAt', 'desc').get()
        .then(snapshot => {
            products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            filteredProducts = [...products];
            displayProducts();
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

// عرض المنتجات
function displayProducts() {
    productsGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(0, endIndex);
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // إخفاء زر عرض المزيد إذا تم عرض كل المنتجات
    if (productsToShow.length >= filteredProducts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// إنشاء بطاقة منتج
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    
    const badge = product.isFeatured ? '<div class="product-badge">مميز</div>' : '';
    
    card.innerHTML = `
        ${badge}
        <div class="product-image">
            <img src="${product.image || 'https://picsum.photos/seed/' + product.id + '/400/300.jpg'}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-price">${product.price} ريال</div>
            <p class="product-description">${product.description}</p>
            <div class="product-contact">
                <span>${product.contact}</span>
                <a href="tel:${product.contact}"><i class="fas fa-phone"></i> اتصل</a>
            </div>
        </div>
    `;
    
    return card;
}

// تصفية المنتجات
function filterProducts(filter) {
    if (filter === 'all') {
        filteredProducts = [...products];
    } else if (filter === 'featured') {
        filteredProducts = products.filter(product => product.isFeatured);
    } else if (filter === 'normal') {
        filteredProducts = products.filter(product => !product.isFeatured);
    }
    
    currentPage = 1;
    displayProducts();
}

// إضافة منتج
function addProduct(userType) {
    const type = userType === 'admin' ? 'admin' : 'merchant';
    const productType = document.getElementById(`${type}ProductType`).value;
    const name = document.getElementById(`${type}ProductName`).value;
    const price = document.getElementById(`${type}ProductPrice`).value;
    const contact = document.getElementById(`${type}ProductContact`).value;
    const description = document.getElementById(`${type}ProductDescription`).value;
    const imageInput = document.getElementById(`${type}ProductImage`);
    
    // التحقق من الحقول
    if (!name || !price || !contact || !description) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // رفع الصورة إذا تم تحديدها
    if (imageInput.files && imageInput.files[0]) {
        const imageFile = imageInput.files[0];
        const storageRef = storage.ref(`products/${Date.now()}_${imageFile.name}`);
        
        storageRef.put(imageFile)
            .then(snapshot => {
                return snapshot.ref.getDownloadURL();
            })
            .then(imageUrl => {
                saveProductToDatabase(productType, name, price, contact, description, imageUrl);
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    } else {
        saveProductToDatabase(productType, name, price, contact, description, null);
    }
}

// حفظ المنتج في قاعدة البيانات
function saveProductToDatabase(type, name, price, contact, description, imageUrl) {
    const isFeatured = type === 'featured';
    const userId = currentUser ? currentUser.uid : null;
    
    db.collection('products').add({
        name,
        price,
        contact,
        description,
        image: imageUrl,
        isFeatured,
        userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // إغلاق النافذة المنبثقة
        if (isAdmin) {
            document.getElementById('adminAddProductForm').reset();
            document.getElementById('adminImagePreview').innerHTML = '';
            loadProductsForAdmin();
        } else {
            addProductModal.style.display = 'none';
            document.getElementById('addProductForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            loadProducts();
        }
        
        showNotification('تم نشر الإعلان بنجاح', 'success');
    })
    .catch(error => {
        showNotification(error.message, 'error');
    });
}

// تحميل التجار
function loadMerchants() {
    db.collection('users').where('isMerchant', '==', true).get()
        .then(snapshot => {
            merchants = [];
            const merchantsTable = document.getElementById('merchantsTable');
            merchantsTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const merchant = {
                    id: doc.id,
                    ...doc.data()
                };
                merchants.push(merchant);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${merchant.name}</td>
                    <td>${merchant.email}</td>
                    <td>${formatDate(merchant.createdAt)}</td>
                    <td>
                        <button class="action-btn delete" onclick="removeMerchant('${merchant.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                merchantsTable.appendChild(row);
            });
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

// تحميل المستخدمين
function loadUsers() {
    db.collection('users').get()
        .then(snapshot => {
            users = [];
            const accountsTable = document.getElementById('accountsTable');
            accountsTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const user = {
                    id: doc.id,
                    ...doc.data()
                };
                users.push(user);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>
                        ${!user.isMerchant ? `
                            <button class="action-btn" onclick="makeMerchant('${user.id}')">
                                <i class="fas fa-user-check"></i>
                            </button>
                        ` : `
                            <button class="action-btn delete" onclick="removeMerchant('${user.id}')">
                                <i class="fas fa-user-times"></i>
                            </button>
                        `}
                    </td>
                `;
                accountsTable.appendChild(row);
            });
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

// تحميل المنتجات للإدارة
function loadProductsForAdmin() {
    db.collection('products').orderBy('createdAt', 'desc').get()
        .then(snapshot => {
            const adsTable = document.getElementById('adsTable');
            adsTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const product = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // البحث عن اسم صاحب الإعلان
                let userName = 'غير معروف';
                if (product.userId) {
                    const user = users.find(u => u.id === product.userId);
                    if (user) {
                        userName = user.name;
                    }
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.price} ريال</td>
                    <td>${userName}</td>
                    <td>${formatDate(product.createdAt)}</td>
                    <td>${product.isFeatured ? 'مميز' : 'عادي'}</td>
                    <td>
                        <button class="action-btn delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                adsTable.appendChild(row);
            });
        })
        .catch(error => {
            showNotification(error.message, 'error');
        });
}

// جعل المستخدم تاجرًا
function makeMerchant(userId) {
    db.collection('users').doc(userId).update({
        isMerchant: true
    })
    .then(() => {
        showNotification('تمت ترقية المستخدم إلى تاجر', 'success');
        loadUsers();
        loadMerchants();
    })
    .catch(error => {
        showNotification(error.message, 'error');
    });
}

// إزالة صلاحية التاجر
function removeMerchant(userId) {
    db.collection('users').doc(userId).update({
        isMerchant: false
    })
    .then(() => {
        showNotification('تمت إزالة صلاحية التاجر', 'success');
        loadUsers();
        loadMerchants();
    })
    .catch(error => {
        showNotification(error.message, 'error');
    });
}

// حذف منتج
function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        db.collection('products').doc(productId).delete()
            .then(() => {
                showNotification('تم حذف الإعلان بنجاح', 'success');
                loadProductsForAdmin();
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
}

// تصفية الجدول
function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const textContent = row.textContent.toLowerCase();
        
        if (textContent.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// معاينة الصورة
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// عرض رسالة تنبيه
function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// تنسيق التاريخ
function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate();
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return date.toLocaleDateString('ar-OM', options);
}

// الاتصال بجوجل شيتس لحفظ البيانات
function saveToGoogleSheet(data) {
    // هذه وظيفة افتراضية للاتصال بجوجل شيتس
    // في الواقع، ستحتاج إلى استخدام Google Sheets API أو خدمة مثل Zapier
    // أو استخدام Google Apps Script لإنشاء واجهة برمجة تطبيقات بسيطة
    
    // مثال على كيفية إرسال البيانات إلى Google Apps Script
    fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        console.log('تم حفظ البيانات في جوجل شيتس:', result);
    })
    .catch(error => {
        console.error('خطأ في حفظ البيانات في جوجل شيتس:', error);
    });
}

// حفظ بيانات المنتج في جوجل شيتس
function saveProductToGoogleSheet(product) {
    const data = {
        sheetName: 'مشروعي',
        data: {
            'اسم المنتج': product.name,
            'السعر': product.price,
            'رقم التواصل': product.contact,
            'الوصف': product.description,
            'النوع': product.isFeatured ? 'مميز' : 'عادي',
            'صورة المنتج': product.image,
            'التاريخ': new Date().toLocaleDateString('ar-OM')
        }
    };
    
    saveToGoogleSheet(data);
}

// حفظ بيانات المستخدم في جوجل شيتس
function saveUserToGoogleSheet(user) {
    const data = {
        sheetName: 'مشروعي',
        data: {
            'الاسم': user.name,
            'البريد الإلكتروني': user.email,
            'نوع الحساب': user.isMerchant ? 'تاجر' : 'مستخدم عادي',
            'التاريخ': new Date().toLocaleDateString('ar-OM')
        }
    };
    
    saveToGoogleSheet(data);
}