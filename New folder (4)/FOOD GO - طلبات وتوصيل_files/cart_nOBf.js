const CART_KEY = "foodgo_cart_v2";

const DELIVERY_ZONES = {
  "شبرا": 20,
  "شبرا الخيمة": 35, "المظلات": 25, "العباسية": 30, "المرج": 40, "المنيرة": 25, "المنيل": 30,
};

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function addItem(name, price, restaurant = "الحراق") {
  const cart = getCart();
  const item = cart.find(x => x.name === name && x.restaurant === restaurant);

  if (item) item.qty += 1;
  else cart.push({name, price:Number(price), qty:1, restaurant});

  saveCart(cart);
  openCart();
  showToast("تمت إضافة " + name + " إلى السلة 🛒");
}

function changeQty(index, amount) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty += amount;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCart();
  updateCartBadge();
}

function formatMoney(n) {
  return Math.round(Number(n) || 0) + " ج.م";
}

function cartSubtotal() {
  return getCart().reduce((s, x) => s + x.price * x.qty, 0);
}

function updateCartBadge() {
  const count = getCart().reduce((s,x) => s + x.qty, 0);
  document.querySelectorAll("#cartCount,#cartCountFloating").forEach(el => el.textContent = count);
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  if (!drawer) return;
  drawer.classList.add("open");
  renderCart();
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  if (drawer) drawer.classList.remove("open");
}

function renderCart() {
  const list = document.getElementById("cartItems");
  if (!list) return;

  const cart = getCart();

  if (!cart.length) {
    list.innerHTML = '<div class="empty-cart">السلة فارغة حالياً 🛒<br><small>اضغط "إضافة للسلة" من أي صنف.</small></div>';
  } else {
    list.innerHTML = cart.map((item,index) => `
      <div class="cart-row">
        <div class="cart-row-info">
          <strong>${safe(item.name)}</strong>
          <small>${formatMoney(item.price)} × ${item.qty}</small>
        </div>
        <div class="qty-controls">
          <button type="button" onclick="changeQty(${index},1)">+</button>
          <b>${item.qty}</b>
          <button type="button" onclick="changeQty(${index},-1)">−</button>
        </div>
        <strong>${formatMoney(item.price * item.qty)}</strong>
      </div>
    `).join("");
  }

  const zone = document.getElementById("checkoutZone");
  const delivery = zone ? (DELIVERY_ZONES[zone.value] || 0) : 0;
  const subtotal = cartSubtotal();

  const s = document.getElementById("checkoutSubtotal");
  const d = document.getElementById("checkoutDelivery");
  const t = document.getElementById("checkoutTotal");

  if(s) s.textContent = formatMoney(subtotal);
  if(d) d.textContent = formatMoney(delivery);
  if(t) t.textContent = formatMoney(subtotal + delivery);
}

function submitOrder() {
  const cart = getCart();
  if (!cart.length) return alert("السلة فارغة. أضف صنفاً أولاً.");

  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const zone = document.getElementById("checkoutZone")?.value;
  const address = document.getElementById("customerAddress")?.value.trim();

  if (!name) return alert("اكتب اسم العميل.");
  if (!phone) return alert("اكتب رقم التليفون.");
  if (!zone) return alert("اختار منطقة التوصيل.");
  if (!address) return alert("اكتب العنوان بالتفصيل.");

  const subtotal = cartSubtotal();
  const delivery = DELIVERY_ZONES[zone] || 0;
  const total = subtotal + delivery;

  let msg = "طلب جديد من FOOD GO %0A%0A";
  msg += "الاسم: " + encodeURIComponent(name) + "%0A";
  msg += "التليفون: " + encodeURIComponent(phone) + "%0A";
  msg += "المنطقة: " + encodeURIComponent(zone) + "%0A";
  msg += "العنوان: " + encodeURIComponent(address) + "%0A%0A";
  msg += "الأصناف:%0A";

  cart.forEach(x => {
    msg += "- " + encodeURIComponent(x.name) + " × " + x.qty +
           " = " + (x.price*x.qty) + " ج.م%0A";
  });

  msg += "%0Aإجمالي الطلب: " + subtotal + " ج.م%0A";
  msg += "التوصيل: " + delivery + " ج.م%0A";
  msg += "الإجمالي النهائي: " + total + " ج.م";

  // ضع رقم واتساب هنا بدون + أو مسافات
  const WHATSAPP_NUMBER = "201029729029";

  if (WHATSAPP_NUMBER.includes("X")) {
    alert("لازم تضع رقم واتساب استقبال الطلبات داخل cart.js أولاً.");
    return;
  }

  window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + msg, "_blank");
}

function safe(v) {
  return String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function showToast(text) {
  const x = document.createElement("div");
  x.className = "foodgo-toast";
  x.textContent = text;
  document.body.appendChild(x);
  setTimeout(() => x.remove(), 1800);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCart();

  const zone = document.getElementById("checkoutZone");
  if (zone) zone.addEventListener("change", renderCart);

  const drawer = document.getElementById("cartDrawer");
  if (drawer) {
    drawer.addEventListener("click", e => {
      if (e.target === drawer) closeCart();
    });
  }
});
