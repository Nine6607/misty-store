// ก๊อปอันนี้ไปแปะแทนที่บรรทัดแรกเลย (ต้องมี /api ต่อท้ายด้วยนะ!)
const API_URL = 'https://pnpk-automation.onrender.com/api';
let currentView = 'home';
let isLoginMode = true;

const setToken = (token) => localStorage.setItem('misty_token', token);
const getToken = () => localStorage.getItem('misty_token');
const removeToken = () => localStorage.removeItem('misty_token');

// ฟังก์ชันโชว์แจ้งเตือนแบบตัวตึง
const showToast = (icon, title) => {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1e293b',
        color: '#fff'
    });
};

async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    currentView = viewId;
    
    if (viewId === 'shop') loadProducts();
    if (viewId === 'profile') loadProfileData();
}

function checkAuthState() {
    const token = getToken();
    const btnLogin = document.getElementById('nav-auth-btn');
    const btnProfile = document.getElementById('nav-profile-btn');
    const btnLogout = document.getElementById('nav-logout-btn');

    if (token) {
        btnLogin.classList.add('hidden');
        btnProfile.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
    } else {
        btnLogin.classList.remove('hidden');
        btnProfile.classList.add('hidden');
        btnLogout.classList.add('hidden');
        if (currentView === 'profile') navigate('home');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

    try {
        const res = await apiCall(endpoint, 'POST', { username, password });
        if (!isLoginMode) {
            Swal.fire({ icon: 'success', title: 'Nice!', text: 'สมัครสมาชิกสำเร็จ! ล็อกอินได้เลย' });
            toggleAuthMode();
        } else {
            setToken(res.token);
            checkAuthState();
            showToast('success', 'Logged in successfully');
            navigate('profile');
        }
        e.target.reset();
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: err.message });
    }
});

function logout() {
    Swal.fire({
        title: 'จะออกแล้วหรอ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3b82f6',
        confirmButtonText: 'ใช่, ออกระบบ!'
    }).then((result) => {
        if (result.isConfirmed) {
            removeToken();
            checkAuthState();
            navigate('home');
            showToast('info', 'Logged out');
        }
    });
}

async function loadProducts() {
    const container = document.getElementById('product-list');
    
    // โชว์ Skeleton รอโหลดไปก่อน 3 กล่อง
    container.innerHTML = Array(3).fill(`
        <div class="glass-panel rounded-3xl overflow-hidden h-96 flex flex-col p-2">
            <div class="skeleton h-48 w-full rounded-2xl"></div>
            <div class="p-4 mt-2">
                <div class="skeleton h-6 w-3/4 mb-3 rounded"></div>
                <div class="skeleton h-4 w-full mb-2 rounded"></div>
                <div class="skeleton h-4 w-5/6 rounded"></div>
            </div>
        </div>
    `).join('');

    try {
        const products = await apiCall('/products');
        
        // หน่วงเวลาจำลอง 0.5 วิ ให้เห็นความเนียนของ Skeleton (ในชีวิตจริงเอา setTimeout ออกได้)
        setTimeout(() => {
            container.innerHTML = products.map(p => `
                <div class="glass-panel product-card rounded-3xl overflow-hidden flex flex-col transition cursor-pointer">
                    <div class="p-2">
                        <img src="${p.image_url}" alt="${p.name}" class="h-48 w-full object-cover rounded-2xl">
                    </div>
                    <div class="p-6 pt-2 flex-1 flex flex-col">
                        <h3 class="text-xl font-bold text-white mb-2">${p.name}</h3>
                        <p class="text-gray-400 text-sm flex-1 leading-relaxed">${p.description}</p>
                        <div class="mt-6 flex justify-between items-end border-t border-gray-700/50 pt-4">
                            <div>
                                <p class="text-xs text-gray-500 mb-1">Price</p>
                                <span class="text-blue-400 font-mono text-2xl font-bold">${parseFloat(p.price).toLocaleString()} ฿</span>
                            </div>
                            <span class="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400">Stock: ${p.stock}</span>
                        </div>
                        <button onclick="buyProduct(${p.id}, '${p.name}', ${p.price})" class="mt-5 w-full bg-white/5 hover:bg-blue-600 py-3 rounded-xl transition font-bold border border-white/10 hover:border-transparent text-white group">
                            Buy Now
                        </button>
                    </div>
                </div>
            `).join('');
        }, 500);
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="text-red-500 text-center w-full col-span-3">Failed to load products.</p>`;
    }
}

async function buyProduct(id, name, price) {
    if (!getToken()) return Swal.fire({ icon: 'warning', title: 'Hey!', text: 'ล็อกอินก่อนสิวัยรุ่น' });
    
    // Popup ยืนยันหล่อๆ
    const confirm = await Swal.fire({
        title: `ซื้อ ${name}?`,
        text: `ราคา ${parseFloat(price).toLocaleString()} ฿ หักเงินจากบัญชีนะ`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#1e293b',
        confirmButtonText: 'จัดไป!'
    });

    if (!confirm.isConfirmed) return;
    
    try {
        const res = await apiCall('/tx/buy', 'POST', { productId: id });
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'ซื้อของเข้าคลังเรียบร้อย',
            background: '#1e293b',
        });
        loadProducts(); // รีเฟรชสต็อก
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err.message });
    }
}

async function loadProfileData() {
    if (!getToken()) return;
    try {
        const user = await apiCall('/auth/profile');
        document.getElementById('prof-username').innerText = `@${user.username}`;
        // อัปเดตตัวเลขแบบรันขึ้นมาเนียนๆ (Counter animation effect)
        document.getElementById('prof-balance').innerText = parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 });

        const history = await apiCall('/tx/history');
        const tbody = document.getElementById('history-list');
        tbody.innerHTML = history.length ? history.map(h => `
            <tr class="border-b border-gray-700/30 hover:bg-white/5 transition">
                <td class="py-4 px-2 text-gray-500 font-mono text-sm">#${h.id}</td>
                <td class="py-4 px-2 font-medium">${h.name}</td>
                <td class="py-4 px-2 text-blue-400 font-mono">${parseFloat(h.price_at_purchase).toLocaleString()} ฿</td>
                <td class="py-4 px-2 text-sm text-gray-500">${new Date(h.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('') : '<tr><td colspan="4" class="p-6 text-center text-gray-600">No recent orders. ไปช็อปด่วน!</td></tr>';
    } catch (err) {
        console.error(err);
        if(err.message.includes('Unauthorized')) logout();
    }
}

async function topup() {
    // 1. เปิดหน้าต่างจำลอง Payment Gateway สุดหรู
    const { value: formValues } = await Swal.fire({
        title: 'Payment Gateway',
        html: `
            <div class="text-left mt-2">
                <label class="text-sm text-gray-400 mb-1 block">Amount to Topup (THB)</label>
                <input id="swal-amount" type="number" class="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none mb-5" placeholder="1000">
                
                <div class="p-5 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl relative overflow-hidden shadow-inner">
                    <div class="absolute -right-10 -top-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                    <p class="text-xs text-blue-400 font-bold mb-4 uppercase tracking-wider flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        Credit Card Details
                    </p>
                    <input id="swal-card" type="text" class="w-full bg-black/60 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm mb-3 outline-none focus:border-blue-500 placeholder-gray-500 transition" placeholder="4242 4242 4242 4242" maxlength="19">
                    <div class="flex space-x-3">
                        <input type="text" class="w-1/2 bg-black/60 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-blue-500 placeholder-gray-500 transition" placeholder="MM/YY" maxlength="5">
                        <input type="text" class="w-1/2 bg-black/60 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-blue-500 placeholder-gray-500 transition" placeholder="CVC" maxlength="3">
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Pay Securely',
        confirmButtonColor: '#2563eb', 
        cancelButtonColor: '#475569',
        background: '#1e293b',
        color: '#fff',
        preConfirm: () => {
            const amount = document.getElementById('swal-amount').value;
            const card = document.getElementById('swal-card').value;
            if (!amount || amount <= 0) {
                Swal.showValidationMessage('ใส่ยอดเงินก่อนดิเพ่!');
                return false;
            }
            if (!card || card.length < 15) {
                Swal.showValidationMessage('กรุณาใส่เลขบัตร (พิมพ์มั่วๆ มาให้ยาวๆ ก็ผ่านละ)');
                return false;
            }
            return amount;
        }
    });

    // 2. ถ้ากดยืนยันจ่ายเงิน
    if (formValues) {
        // โชว์ Loading หมุนๆ จำลองการเชื่อมต่อ API ของธนาคาร
        Swal.fire({
            title: 'Processing...',
            html: '<span class="text-sm text-gray-400">กำลังยืนยันยอดเงินกับธนาคารทิพย์</span>',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            background: '#1e293b',
            color: '#fff'
        });

        try {
            // เรียก API หยอดเหรียญลง Database เราจริงๆ
            await apiCall('/tx/topup', 'POST', { amount: parseFloat(formValues) });
            
            // หน่วงเวลา 1.5 วินาที ให้ดูเหมือนประมวลผลเซิร์ฟเวอร์จริง
            setTimeout(() => {
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Payment Successful!', 
                    text: `เงินเข้ากระเป๋า ${parseFloat(formValues).toLocaleString()} ฿ เรียบร้อย`,
                    background: '#1e293b',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
                loadProfileData(); // ดึงตัวเลขยอดเงินมาอัปเดตหน้าเว็บ
            }, 1500);

        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Payment Failed', text: err.message, background: '#1e293b', color: '#fff' });
        }
    }
}

document.getElementById('admin-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('admin-p-name').value,
        price: document.getElementById('admin-p-price').value,
        stock: document.getElementById('admin-p-stock').value,
        image_url: document.getElementById('admin-p-img').value,
        description: document.getElementById('admin-p-desc').value
    };

    try {
        await apiCall('/products', 'POST', productData);
        Swal.fire({ icon: 'success', title: 'เสร็จสิ้น!', text: 'สินค้าถูกเสกเข้าระบบแล้ว', background: '#1e293b', color: '#fff' });
        e.target.reset();
        navigate('shop'); // ส่งกลับไปหน้า Shop เพื่อดูผลงาน
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: err.message });
    }
});