// بيانات المنتجات (قاعدة بيانات مؤقتة)
let products = [
    {
        id: 1,
        name: "ساعة ذكية",
        description: "ساعة ذكية متطورة مع شاشة لمس ومقاومة للماء",
        price: 299.99,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "ساعات ذكية",
        featured: true
    },
    {
        id: 2,
        name: "سماعات لاسلكية",
        description: "سماعات بلوتوث عالية الجودة مع عزل للضوضاء",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w-800&q=80",
        category: "سماعات",
        featured: true
    },
    {
        id: 3,
        name: "هاتف ذكي",
        description: "هاتف ذكي بشاشة كبيرة وذاكرة 128 جيجابايت",
        price: 699.99,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "هواتف",
        featured: true
    },
    {
        id: 4,
        name: "لابتوب",
        description: "لابتوب قوي بمعالج i7 وذاكرة 16 جيجابايت",
        price: 999.99,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "حواسيب",
        featured: false
    },
    {
        id: 5,
        name: "كاميرا احترافية",
        description: "كاميرا DSLR مع عدستين وذاكرة 64 جيجابايت",
        price: 799.99,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "كاميرات",
        featured: false
    },
    {
        id: 6,
        name: "تابلت",
        description: "تابلت بشاشة 10 بوصة وذاكرة 64 جيجابايت",
        price: 399.99,
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "أجهزة لوحية",
        featured: true
    }
];

// سلة التسوق
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// الطلبات (للوحة الإدارة)
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تحميل سلة التسوق
    updateCartCount();
    
    // تهيئة القائمة المتحركة للجوال
    initMobileMenu();
    
    // عرض المنتجات المميزة في الصفحة الرئيسية
    if (document.getElementById('featured-products')) {
        displayFeaturedProducts();
    }
    
    // عرض جميع المنتجات في صفحة المنتجات
    if (document.getElementById('all-products')) {
        displayAllProducts();
    }
    
    // عرض تفاصيل المنتج
    if (document.getElementById('product-details')) {
        displayProductDetails();
    }
    
    // عرض سلة التسوق
    if (document.getElementById('cart-items')) {
        displayCartItems();
    }
    
    // تهيئة صفحة الدفع
    if (document.getElementById('checkout-form')) {
        initCheckout();
    }
    
    // تهيئة لوحة الإدارة
    if (document.getElementById('admin-dashboard')) {
        initAdminDashboard();
    }
    
    // تهيئة نظام إدارة المنتجات
    if (document.getElementById('product-management')) {
        initProductManagement();
    }
});

// دالة لعرض المنتجات المميزة
function displayFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    const featuredProducts = products.filter(product => product.featured);
    
    container.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price.toFixed(2)} ر.ع</div>
                <div class="product-actions">
                    <button class="btn add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> إضافة للسلة
                    </button>
                    <a href="product-details.html?id=${product.id}" class="btn view-details">
                        <i class="fas fa-eye"></i> التفاصيل
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// دالة لعرض جميع المنتجات
function displayAllProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price.toFixed(2)} ر.ع</div>
                <div class="product-category">${product.category}</div>
                <div class="product-actions">
                    <button class="btn add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> إضافة للسلة
                    </button>
                    <a href="product-details.html?id=${product.id}" class="btn view-details">
                        <i class="fas fa-eye"></i> التفاصيل
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// دالة لعرض تفاصيل المنتج
function displayProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    const product = products.find(p => p.id === productId);
    const container = document.getElementById('product-details');
    
    if (product && container) {
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <div class="product-price">${product.price.toFixed(2)} ر.ع</div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-category">الفئة: ${product.category}</div>
                    <div class="product-actions">
                        <button class="btn add-to-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> إضافة للسلة
                        </button>
                        <a href="products.html" class="btn view-details">
                            <i class="fas fa-arrow-left"></i> العودة للمنتجات
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// دالة لإضافة منتج إلى السلة
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    // حفظ السلة في localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // تحديث عداد السلة
    updateCartCount();
    
    // عرض رسالة تأكيد
    showNotification('تمت إضافة المنتج إلى سلة التسوق بنجاح!', 'success');
}

// دالة تحديث عداد السلة
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// دالة عرض محتويات السلة
function displayCartItems() {
    const container = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-3x"></i>
                <h3>سلة التسوق فارغة</h3>
                <p>لم تقم بإضافة أي منتجات إلى سلة التسوق بعد</p>
                <a href="products.html" class="btn">تصفح المنتجات</a>
            </div>
        `;
        
        if (cartTotalElement) cartTotalElement.textContent = '$0.00';
        if (cartSubtotalElement) cartSubtotalElement.textContent = '$0.00';
        return;
    }
    
    let subtotal = 0;
    
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                </div>
                <div class="cart-item-price">${item.price.toFixed(2)} ر.ع</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">${itemTotal.toFixed(2)} ر.ع</div>
                <div class="cart-item-actions">
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shipping;
    
    if (cartSubtotalElement) cartSubtotalElement.textContent = `${subtotal.toFixed(2)} ر.ع`;
    if (cartTotalElement) cartTotalElement.textContent = `${total.toFixed(2)} ر.ع`;
    
    // تحديث عناصر الملخص إذا كانت موجودة
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryTotal = document.getElementById('summary-total');
    
    if (summarySubtotal) summarySubtotal.textContent = `${subtotal.toFixed(2)} ر.ع`;
    if (summaryShipping) summaryShipping.textContent = shipping === 0 ? 'مجاني' : `${shipping.toFixed(2)} ر.ع`;
    if (summaryTotal) summaryTotal.textContent = `${total.toFixed(2)} ر.ع`;
}

// دالة تحديث كمية المنتج في السلة
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
        
        // حفظ السلة في localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // تحديث العرض
        displayCartItems();
        updateCartCount();
    }
}

// دالة إزالة منتج من السلة
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    
    // حفظ السلة في localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // تحديث العرض
    displayCartItems();
    updateCartCount();
    
    // عرض رسالة تأكيد
    showNotification('تمت إزالة المنتج من سلة التسوق', 'info');
}

// دالة تهيئة صفحة الدفع
function initCheckout() {
    const checkoutForm = document.getElementById('checkout-form');
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // إنشاء طلب جديد
            const order = {
                id: Date.now(),
                date: new Date().toLocaleString(),
                items: [...cart],
                customer: {
                    name: document.getElementById('customer-name').value,
                    email: document.getElementById('customer-email').value,
                    phone: document.getElementById('customer-phone').value,
                    address: document.getElementById('customer-address').value
                },
                paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
                status: 'جديد',
                total: calculateCartTotal()
            };
            
            // إضافة الطلب إلى القائمة
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // تفريغ سلة التسوق
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            // عرض رسالة نجاح
            alert('تم تقديم طلبك بنجاح! رقم الطلب: ' + order.id);
            
            // إعادة توجيه إلى الصفحة الرئيسية
            window.location.href = 'index.html';
        });
    }
    
    // إدارة طرق الدفع
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
    
    // ملء ملخص الطلب
    displayOrderSummary();
}

// دالة حساب إجمالي السلة
function calculateCartTotal() {
    let subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    let shipping = subtotal > 100 ? 0 : 9.99;
    return subtotal + shipping;
}

// دالة عرض ملخص الطلب
function displayOrderSummary() {
    const container = document.getElementById('order-summary-items');
    
    if (!container) return;
    
    let subtotal = 0;
    
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="order-summary-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shipping;
    
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = shipping === 0 ? 'مجاني' : `$${shipping.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
}

// دالة تهيئة القائمة المتحركة للجوال
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
        
        // إغلاق القائمة عند النقر على رابط
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
            });
        });
    }
}

// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <p>${message}</p>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // إضافة الإشعار إلى الصفحة
    document.body.appendChild(notification);
    
    // إضافة أنيميشن للإظهار
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // إعداد زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // إزالة الإشعار تلقائياً بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// إضافة تنسيقات الإشعارات إلى CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transform: translateY(-100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 9999;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .notification-success {
        border-right: 4px solid #27ae60;
    }
    
    .notification-info {
        border-right: 4px solid #3498db;
    }
    
    .notification-warning {
        border-right: 4px solid #f39c12;
    }
    
    .notification-error {
        border-right: 4px solid #e74c3c;
    }
    
    .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #7f8c8d;
        font-size: 1.2rem;
    }
    
    @media (min-width: 768px) {
        .notification {
            left: auto;
        }
    }
`;

document.head.appendChild(notificationStyles);

// ===== دوال لوحة الإدارة =====

// دالة تهيئة لوحة الإدارة
function initAdminDashboard() {
    updateDashboardStats();
    displayProductsTable();
    displayOrdersList();
}

// دالة تحديث إحصائيات لوحة الإدارة
function updateDashboardStats() {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'جديد' || order.status === 'قيد المعالجة').length;
    
    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = `${totalRevenue.toFixed(2)} ر.ع`;
    document.getElementById('pending-orders').textContent = pendingOrders;
}

// دالة عرض جدول المنتجات
function displayProductsTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="product-thumb"></td>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.category}</td>
            <td>${product.featured ? '<i class="fas fa-star" style="color: gold;"></i>' : '-'}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editProduct(${product.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// دالة عرض قائمة الطلبات
function displayOrdersList() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-shopping-bag fa-3x"></i>
                <p>لا توجد طلبات حتى الآن</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h3>طلب #${order.id}</h3>
                <span class="order-status status-${order.status.replace(/\s/g, '-')}">${order.status}</span>
            </div>
            <div class="order-details">
                <p><strong>التاريخ:</strong> ${order.date}</p>
                <p><strong>العميل:</strong> ${order.customer.name}</p>
                <p><strong>البريد الإلكتروني:</strong> ${order.customer.email}</p>
                <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
                <p><strong>العنوان:</strong> ${order.customer.address}</p>
                <p><strong>الإجمالي:</strong> ${order.total.toFixed(2)} ر.ع</p>
            </div>
            <div class="order-items">
                <h4>المنتجات:</h4>
                <ul>
                    ${order.items.map(item => `<li>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toFixed(2)} ر.ع</li>`).join('')}
                </ul>
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus(${order.id}, this.value)" class="order-status-select">
                    <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                    <option value="قيد المعالجة" ${order.status === 'قيد المعالجة' ? 'selected' : ''}>قيد المعالجة</option>
                    <option value="تم الشحن" ${order.status === 'تم الشحن' ? 'selected' : ''}>تم الشحن</option>
                    <option value="تم التسليم" ${order.status === 'تم التسليم' ? 'selected' : ''}>تم التسليم</option>
                    <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                </select>
                <button class="btn btn-danger" onclick="deleteOrder(${order.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// دالة عرض نموذج إضافة منتج
function showAddProductForm() {
    document.getElementById('modal-title').textContent = 'إضافة منتج جديد';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'flex';
}

// دالة إغلاق نافذة المنتج
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// دالة حفظ المنتج (إضافة أو تعديل)
function saveProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const productData = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        image: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value,
        featured: document.getElementById('product-featured').checked
    };
    
    if (id) {
        // تعديل منتج موجود
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = productData;
            showNotification('تم تحديث المنتج بنجاح!', 'success');
        }
    } else {
        // إضافة منتج جديد
        products.push(productData);
        showNotification('تمت إضافة المنتج بنجاح!', 'success');
    }
    
    // حفظ المنتجات في localStorage
    localStorage.setItem('products', JSON.stringify(products));
    
    // تحديث العرض
    displayProductsTable();
    updateDashboardStats();
    closeProductModal();
}

// دالة تعديل منتج
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modal-title').textContent = 'تعديل المنتج';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-image').value = product.image;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-featured').checked = product.featured;
    
    document.getElementById('product-modal').style.display = 'flex';
}

// دالة حذف منتج
function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        
        displayProductsTable();
        updateDashboardStats();
        showNotification('تم حذف المنتج بنجاح!', 'success');
    }
}

// دالة تحديث حالة الطلب
function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        displayOrdersList();
        updateDashboardStats();
        showNotification('تم تحديث حالة الطلب!', 'success');
    }
}

// دالة حذف طلب
function deleteOrder(orderId) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        displayOrdersList();
        updateDashboardStats();
        showNotification('تم حذف الطلب بنجاح!', 'success');
    }
}

// دالة تهيئة إدارة المنتجات
function initProductManagement() {
    displayProductsTable();
}

// دالة الانتقال إلى صفحة الدفع
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('سلة التسوق فارغة!', 'warning');
        return `
            <div class="order-summary-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>${itemTotal.toFixed(2)} ر.ع</span>
            </div>
        `;
function placeOrder(event) {
    event.preventDefault();
    
    const order = {
        id: Date.now(),
        date: new Date().toLocaleString('ar-SA'),
        items: [...cart],
        customer: {
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value + ', ' + 
                     document.getElementById('city').value + ', ' + 
                     document.getElementById('postal-code').value
        },
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        status: 'جديد',
        total: calculateCartTotal()
    };
    
    // إضافة الطلب إلى القائمة
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // تفريغ سلة التسوق
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // عرض رسالة نجاح
    alert('تم تقديم طلبك بنجاح! رقم الطلب: ' + order.id);
    
    // إعادة توجيه إلى الصفحة الرئيسية
    window.location.href = 'index.html';
}

// تحميل المنتجات من localStorage إذا كانت موجودة
const savedProducts = localStorage.getItem('products');
if (savedProducts) {
    products = JSON.parse(savedProducts);
}

// إنشاء جزيئات متحركة في الخلفية
function createFloatingParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'floating-particles';
    document.body.appendChild(particlesContainer);
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 10 + 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        
        particlesContainer.appendChild(particle);
    }
}

// تأثير التموج عند النقر
function createRippleEffect(e) {
    const ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 1s ease-out';
    ripple.style.zIndex = '9999';
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 1000);
}

// تفعيل التأثيرات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    createFloatingParticles();
    
    // إضافة تأثير التموج عند النقر
    document.addEventListener('click', createRippleEffect);
    
    // تأثير التلاشي عند الظهور للعناصر
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideInFromBottom 0.8s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // مراقبة بطاقات المنتجات
    document.querySelectorAll('.product-card').forEach(card => {
        observer.observe(card);
    });
});