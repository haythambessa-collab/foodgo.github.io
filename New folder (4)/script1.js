let cart = [];
let discountPercent = 0; 
let activeCoupon = "";  

// الرقم الخاص بك بالصيغة الدولية المعتمدة للإرسال الفوري
const WHATSAPP_NUMBER = "201148080053"; 

// الأكواد المعتمدة للخصم
const AVAILABLE_COUPONS = {
    "CHEF20": 20,  
    "AZIZ10": 10   
};

// دالة إضافة العناصر إلى السلة
function addToCart(name, price, size) {
    const existingItem = cart.find(item => item.name === name && item.size === size);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ name, price, size, qty: 1 });
    }
    updateCartUI();
    animateBadge();
}

// دالة زيادة الكمية (+) داخل السلة
function increaseQty(index) {
    cart[index].qty++;
    updateCartUI();
}

// دالة تقليل الكمية (-) داخل السلة
function decreaseQty(index) {
    cart[index].qty--;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1); 
    }
    updateCartUI();
}

// دالة حذف صنف بالكامل من السلة
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// دالة فحص وتطبيق كوبون الخصم
function applyCoupon() {
    const couponInput = document.getElementById('couponCode');
    if (!couponInput) return;
    
    const code = couponInput.value.trim().toUpperCase();
    const couponMessage = document.getElementById('couponMsg');

    if (cart.length === 0) {
        alert("برجاء إضافة وجبات للسلة أولاً قبل تفعيل الكوبون!");
        return;
    }

    if (AVAILABLE_COUPONS.hasOwnProperty(code)) {
        discountPercent = AVAILABLE_COUPONS[code];
        activeCoupon = code;
        if (couponMessage) {
            couponMessage.innerText = `✅ تم تطبيق خصم ${discountPercent}% بنجاح!`;
            couponMessage.style.color = "#25D366";
        }
    } else {
        discountPercent = 0;
        activeCoupon = "";
        if (couponMessage) {
            couponMessage.innerText = "❌ هذا الكوبون غير صحيح أو منتهي الصلاحية!";
            couponMessage.style.color = "#ff595e";
        }
    }
    updateCartUI();
}

// دالة تحديث السلة وحساب التوصيل مع الإجمالي (تمت مراجعة المتغيرات بدقة)
function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.innerText = cartCount;

    const listContainer = document.getElementById('cartItemsList');
    const formContainer = document.getElementById('customerForm');
    const subtotalContainer = document.getElementById('itemsSubtotal');
    const discountContainer = document.getElementById('discountAmount');
    const deliveryContainer = document.getElementById('deliveryCost');
    const totalContainer = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        if (listContainer) listContainer.innerHTML = '<p class="empty-msg">السلة فارغة حالياً</p>';
        if (formContainer) formContainer.style.display = 'none';
        if (subtotalContainer) subtotalContainer.innerText = 0;
        if (discountContainer) discountContainer.innerText = 0;
        if (deliveryContainer) deliveryContainer.innerText = 0;
        if (totalContainer) totalContainer.innerText = 0;
        discountPercent = 0;
        activeCoupon = "";
        const couponInput = document.getElementById('couponCode');
        const couponMessage = document.getElementById('couponMsg');
        if (couponInput) couponInput.value = "";
        if (couponMessage) couponMessage.innerText = "";
        return;
    }

    if (formContainer) formContainer.style.display = 'block';

    let html = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        html += `
            <div class="cart-item-row">
                <div class="cart-item-details">
                    <strong>${item.name}</strong> <small class="size-tag">(${item.size})</small><br>
                    <span class="item-cost">${item.price} ج × ${item.qty} = ${itemTotal} ج</span>
                </div>
                <div class="cart-item-controls">
                    <button onclick="decreaseQty(${index})" class="control-btn minus-btn"><i class="fas fa-minus"></i></button>
                    <span class="qty-number">${item.qty}</span>
                    <button onclick="increaseQty(${index})" class="control-btn plus-btn"><i class="fas fa-plus"></i></button>
                    <button onclick="removeFromCart(${index})" class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });

    if (listContainer) listContainer.innerHTML = html;
    
    let discountAmount = Math.round(subtotal * (discountPercent / 100));
    let itemsAfterDiscount = subtotal - discountAmount;
    
    // حساب التوصيل المختار وإضافته حياً للإجمالي الكلي
    const regionSelect = document.getElementById('custRegion');
    let deliveryFee = 0;
    if (regionSelect && regionSelect.options[regionSelect.selectedIndex]) {
        deliveryFee = parseInt(regionSelect.options[regionSelect.selectedIndex].getAttribute('data-delivery')) || 0;
    }
    
    let finalTotal = itemsAfterDiscount + deliveryFee;
    
    if (subtotalContainer) subtotalContainer.innerText = subtotal;
    if (discountContainer) discountContainer.innerText = discountAmount;
    if (deliveryContainer) deliveryContainer.innerText = deliveryFee;
    if (totalContainer) totalContainer.innerText = finalTotal;
}

// دالة إرسال الفاتورة وتصفير السلة تلقائياً
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("سلتك فارغة! أضف بعض الوجبات أولاً.");
        return;
    }

    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    const addressInput = document.getElementById('custAddress');
    const regionSelect = document.getElementById('custRegion');

    if (!nameInput || !phoneInput || !addressInput || !regionSelect) {
        alert("حدث خطأ في النظام الداخلي للصفحة، يرجى مراجعة الكود!");
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const regionText = regionSelect.options[regionSelect.selectedIndex].text;
    const deliveryFee = parseInt(regionSelect.options[regionSelect.selectedIndex].getAttribute('data-delivery')) || 0;

    if (!name || !phone || !address) {
        alert("برجاء تعبئة الاسم، رقم التليفون، والعنوان بالتفصيل لإرسال الطلب!");
        return;
    }
    // 2. التحقق من أن رقم التليفون يحتوي على أرقام فقط (يمنع الحروف والرموز)
const phoneRegex = /^[0-9]+$/;
if (phone.length !== 11) {
    alert("برجاء إدخال 11 أرقام فقط في حقل رقم التليفون!");
    return;
}

// يمكنك أيضاً تحديد عدد الأرقام بدقة (مثلاً 11 رقماً لشبكات مصر) إذا أردت:
/*
if (phone.length !== 11) {
    alert("برجاء إدخال رقم تليفون صحيح مكون من 11 رقماً!");
    return;
}
*/

    let message = `*طلب دليفرى جديد - food go الشيف عزيز* 👨‍🍳\n\n`;
    message += `*👤 بيانات العميل:*\n`;
    message += `• الاسم: ${name}\n`;
    message += `• التليفون: ${phone}\n`;
    message += `• المنطقة: ${regionText}\n`;
    message += `• العنوان: ${address}\n\n`;
    
    message += `*🛒 الأصناف والطلبات:*\n`;
    let subtotal = 0;

    cart.forEach(item => {
        const cost = item.price * item.qty;
        subtotal += cost;
        message += `• ${item.name} (${item.size}) [العدد: ${item.qty}] -> ${cost} ج\n`;
    });

    let discountAmount = Math.round(subtotal * (discountPercent / 100));
    let itemsAfterDiscount = subtotal - discountAmount;
    let totalFinal = itemsAfterDiscount + deliveryFee;

    message += `\n-------------------------\n`;
    message += `• حساب الوجبات: ${subtotal} ج\n`;
    if (discountPercent > 0) {
        message += `• كوبون الخصم: ${activeCoupon} (${discountPercent}%-)\n`;
        message += `• قيمة الخصم: ${discountAmount} ج\n`;
    }
    message += `• مصاريف التوصيل: ${deliveryFee} ج\n`;
    message += `*💰 الإجمالي الكلي الفعلي:* ${totalFinal} ج.م\n`;
    message += `-------------------------\n`;
    message += `_برجاء مراجعة وتأكيد الطلب في أسرع وقت_شكرا لاستخدامكم موقع Food go ✨`;

    const encodedMessage = encodeURIComponent(message);
    
    // تفريغ السلة فوراً لحمايتها من التكرار
    cart = [];
    updateCartUI();
    closeAllModals();

    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodedMessage, '_blank');
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
}

function closeAllModals() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.style.display = 'none';
}

function animateBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
}
