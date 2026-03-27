const API_URL = 'https://pnpk-automation.onrender.com/api';
let currentView = 'home';
let isLoginMode = true;

// --- Helper Functions ---
const setToken = (token) => localStorage.setItem('misty_token', token);
const getToken = () => localStorage.getItem('misty_token');
const removeToken = () => localStorage.removeItem('misty_token');

// 🚩 เพิ่มฟังก์ชันจัดการ Role (ยศ)
const setRole = (role) => localStorage.setItem('misty_role', role);
const getRole = () => localStorage.getItem('misty_role');
const removeRole = () => localStorage.removeItem('misty_role');

const showToast = (icon, title) => {
    Swal.fire({
        toast: true, position: 'top-end', icon: icon, title: title,
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
        background: '#1e293b', color: '#fff'
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

// --- Navigation & Auth ---
function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');
    currentView = viewId;
    
    if (viewId === 'shop') loadProducts();
    if (viewId === 'profile') loadProfileData();
}

function checkAuthState() {
    const token = getToken();
    const role = getRole(); // 🚩 ดึงยศมาเช็ค
    const btnLogin = document.getElementById('nav-auth-btn');
    const btnProfile = document.getElementById('nav-profile-btn');
    const btnLogout = document.getElementById('nav-logout-btn');
    const btnAdmin = document.getElementById('nav-admin-btn'); // 🚩 ต้องไปเติม ID นี้ใน HTML ด้วยนะ

    if (token) {
        btnLogin?.classList.add('hidden');
        btnProfile?.classList.remove('hidden');
        btnLogout?.classList.remove('hidden');
        
        // 🚩 ถ้าเป็น admin ให้โชว์ปุ่ม ถ้าไม่ใช่ให้ซ่อนทิ้งไป!
        if (role === 'admin') {
            btnAdmin?.classList.remove('hidden');
        } else {
            btnAdmin?.classList.add('hidden');
        }
    } else {
        btnLogin?.classList.remove('hidden');
        btnProfile?.classList.add('hidden');
        btnLogout?.classList.add('hidden');
        btnAdmin?.classList.add('hidden'); // ล็อกเอาท์ปุ๊บ ซ่อนปุ่มแอดมินด้วย
        if (currentView === 'profile' || currentView === 'admin') navigate('home');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
}

document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
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
            setRole(res.user.role); // 🚩 เก็บยศลงกระเป๋าทันทีที่ล็อกอินผ่าน!
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
        title: 'จะออกแล้วหรอ?', icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#3b82f6', confirmButtonText: 'ออกระบบ'
    }).then((result) => {
        if (result.isConfirmed) {
            removeToken();
            removeRole(); // 🚩 โยนยศทิ้งตอนล็อกเอาท์
            checkAuthState();
            navigate('home');
            showToast('info', 'Logged out');
        }
    });
}

// --- Product Logic (Shop) ---
async function loadProducts() {
    const container = document.getElementById('product-list');
    const role = getRole(); // 🚩 เช็คยศก่อนสร้างปุ่มลบ
    
    // โชว์กล่องโหลดหลอกๆ ไปก่อน
    container.innerHTML = Array(3).fill(`
        <div class="glass-panel rounded-3xl overflow-hidden h-96 flex flex-col p-2">
            <div class="skeleton h-48 w-full rounded-2xl"></div>
            <div class="p-4 mt-2"><div class="skeleton h-6 w-3/4 mb-3 rounded"></div><div class="skeleton h-4 w-full rounded"></div></div>
        </div>
    `).join('');

    try {
        // ดึงข้อมูลสินค้าจาก Backend
        const products = await apiCall('/products');
        
        // เอาข้อมูลมาสร้างการ์ดของจริง
        setTimeout(() => {
            container.innerHTML = products.map(p => `
                <div class="glass-panel product-card rounded-3xl overflow-hidden flex flex-col transition border border-white/5 hover:border-blue-500/50">
                    <div class="p-2">
                        <img src="${p.image_url}" alt="${p.name}" class="h-48 w-full object-cover rounded-2xl">
                    </div>
                    <div class="p-6 pt-2 flex-1 flex flex-col">
                        <h3 class="text-xl font-bold text-white mb-2">${p.name}</h3>
                        <p class="text-gray-400 text-sm flex-1 leading-relaxed">${p.description}</p>
                        <div class="mt-6 flex justify-between items-end border-t border-gray-700/50 pt-4 mb-4">
                            <div>
                                <p class="text-xs text-gray-500 mb-1">Price / Service</p>
                                ${parseFloat(p.price) === 0 
                                    ? `<span class="text-emerald-400 font-bold text-lg">⚙️ ประเมินหน้างาน</span>`
                                    : `<span class="text-blue-400 font-mono text-2xl font-bold">${parseFloat(p.price).toLocaleString()} ฿</span>`
                                }
                            </div>
                            <span class="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400">Stock: ${parseFloat(p.price) === 0 ? '-' : p.stock}</span>
                        </div>
                        <div class="flex flex-col gap-2">
                            ${parseFloat(p.price) === 0
                                ? `<button onclick="requestQuote('${p.name}')" class="pulse-green w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl transition font-bold text-white">📞 ขอใบเสนอราคา</button>`
                                : `<button onclick="buyProduct(${p.id}, '${p.name}', ${p.price})" class="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl transition font-bold text-white">🛒 Buy Now</button>`
                            }
                            
                            ${role === 'admin' ? `
                            <button onclick="deleteProduct(${p.id})" class="w-full bg-red-500/10 hover:bg-red-600 py-2 rounded-xl transition font-bold border border-red-500/20 text-red-400 hover:text-white text-xs">Delete (Admin)</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }, 500);
    } catch (err) {
        container.innerHTML = `<p class="text-red-500 text-center w-full col-span-3">Failed to load: ${err.message}</p>`;
    }
}

async function buyProduct(id, name, price) {
    if (!getToken()) return Swal.fire({ icon: 'warning', title: 'Hey!', text: 'ล็อกอินก่อนครับ/ค่ะ' });
    const confirm = await Swal.fire({
        title: `ซื้อ ${name}?`, text: `ราคา ${parseFloat(price).toLocaleString()} ฿`,
        icon: 'question', showCancelButton: true, confirmButtonText: 'จัดไป!'
    });
    if (!confirm.isConfirmed) return;
    try {
        await apiCall('/tx/buy', 'POST', { productId: id });
        Swal.fire({ icon: 'success', title: 'Success!', text: 'ซื้อของเรียบร้อย', background: '#1e293b', color: '#fff' });
        loadProducts();
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err.message });
    }
}

async function deleteProduct(id) {
    const confirm = await Swal.fire({
        title: 'ลบจริงดิ?', text: "ลบแล้วกู้คืนไม่ได้นะ!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบเลย!'
    });
    if (confirm.isConfirmed) {
        try {
            await apiCall(`/products/${id}`, 'DELETE');
            showToast('success', 'ลบสินค้าเรียบร้อย');
            loadProducts();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        }
    }
}

// --- Profile & Topup ---
async function loadProfileData() {
    if (!getToken()) return;
    try {
        const user = await apiCall('/auth/profile');
        document.getElementById('prof-username').innerText = `@${user.username}`;
        document.getElementById('prof-balance').innerText = parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 });
        
        // 🚩 อัปเดตยศเผื่อไว้
        if (user.role) setRole(user.role);

        const history = await apiCall('/tx/history');
        const tbody = document.getElementById('history-list');
        tbody.innerHTML = history.length ? history.map(h => `
            <tr class="border-b border-gray-700/30 hover:bg-white/5 transition">
                <td class="py-4 px-2 text-gray-500 font-mono text-sm">#${h.id}</td>
                <td class="py-4 px-2 font-medium">${h.name}</td>
                <td class="py-4 px-2 text-blue-400 font-mono">${parseFloat(h.price_at_purchase).toLocaleString()} ฿</td>
                <td class="py-4 px-2 text-sm text-gray-500">${new Date(h.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('') : '<tr><td colspan="4" class="p-6 text-center text-gray-600">No recent orders.</td></tr>';
    } catch (err) {
        if(err.message.includes('Unauthorized')) logout();
    }
}

// --- Profile & Topup (อัปเกรดระบบพร้อมเพย์) ---
async function topup() {
    // 1. ถามลูกค้าว่าจะเติมเท่าไหร่
    const { value: amount } = await Swal.fire({
        title: 'ระบบเติมเงิน PNPK.AUTO',
        input: 'number',
        inputLabel: 'ระบุจำนวนเงินที่ต้องการเติม (บาท)',
        inputPlaceholder: 'เช่น 500, 1500',
        background: '#050b14', 
        color: '#fff',
        showCancelButton: true,
        confirmButtonText: 'สร้าง QR Code',
        confirmButtonColor: '#06b6d4',
        inputValidator: (value) => {
            if (!value || value <= 0) return 'ใส่ตัวเลขดีๆ ดิเพ่!'
        }
    });

    if (amount) {
        // 🚩 [จุดที่พี่ต้องแก้!] ใส่เบอร์โทร หรือ เลขบัตรปชช. ที่ผูกพร้อมเพย์ของพี่ตรงนี้ (ไม่ต้องมีขีด)
        const PROMPTPAY_ID = "0812345678"; 
        
        // ใช้บริการ API ฟรี สร้างภาพ QR Code พร้อมเพย์
        const qrUrl = `https://promptpay.io/${PROMPTPAY_ID}/${amount}.png`;

        // 2. โชว์ QR Code ให้ลูกค้าสแกน
        const confirm = await Swal.fire({
            title: `สแกนจ่าย ${amount} บาท`,
            html: `
                <div class="flex flex-col items-center justify-center p-4">
                    <div class="bg-white p-4 rounded-2xl mb-4 shadow-lg shadow-cyan-500/50">
                        <img src="${qrUrl}" alt="PromptPay QR" class="w-48 h-48 object-contain">
                    </div>
                    <p class="text-sm text-cyan-400 font-bold">พร้อมเพย์: ${PROMPTPAY_ID}</p>
                    <p class="text-xs text-gray-400 mt-1">ชื่อบัญชี: [ใส่ชื่อพี่ตรงนี้]</p>
                </div>
                <p class="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    ⚠️ โอนเสร็จแล้ว ค่อยกดปุ่ม "โอนเงินเรียบร้อย" ด้านล่าง
                </p>
            `,
            background: '#050b14', 
            color: '#fff',
            showCancelButton: true,
            confirmButtonText: '✅ โอนเงินเรียบร้อย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#10b981'
        });

        // 3. ถ้าลูกค้ากดว่าโอนแล้ว ให้ยิงไปบอก Backend ให้เพิ่มเงิน
        if (confirm.isConfirmed) {
            Swal.fire({ title: 'กำลังอัปเดตยอดเงิน...', didOpen: () => Swal.showLoading(), background: '#050b14', color: '#fff' });
            try {
                // ส่งคำสั่งไปเติมเงินใน Database
                await apiCall('/tx/topup', 'POST', { amount: parseFloat(amount) });
                
                // ดีเลย์นิดนึงให้ดูเนียนๆ ว่ากำลังประมวลผล
                setTimeout(() => {
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'ยอดเงินเข้าแล้ว!', 
                        text: `เพิ่มยอด ${parseFloat(amount).toLocaleString()} ฿ เรียบร้อย`, 
                        background: '#050b14', color: '#fff' 
                    });
                    loadProfileData(); // โหลดข้อมูล Profile ใหม่เพื่อโชว์ยอดเงินล่าสุด
                }, 1500);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'พังซะงั้น', text: err.message, background: '#050b14', color: '#fff' });
            }
        }
    }
}

// --- Admin Logic ---
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
        Swal.fire({ icon: 'success', title: 'เสร็จสิ้น!', text: 'เสกสินค้าสำเร็จ' });
        e.target.reset();
        navigate('shop');
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: err.message });
    }
});

// Initialize
checkAuthState();

// --- ฟังก์ชันสำหรับงานประเมินราคา ---
function requestQuote(projectName) {
    Swal.fire({
        title: `สนใจระบบ ${projectName}?`,
        text: 'งาน Automation & IoT ตัวนี้ต้องให้ทีมวิศวกรประเมินหน้างานครับ ทักไลน์มาคุยรายละเอียดเบื้องต้นกันได้เลย!',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '💬 ทัก Line คุยงาน',
        cancelButtonText: 'ปิด',
        confirmButtonColor: '#00B900', // สีเขียว Line
        background: '#1e293b',
        color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            // 🚩 ใส่ลิงก์ Line ของบริษัทพี่ตรงนี้ได้เลย (ถ้ายังไม่มีปล่อยว่างงี้ไปก่อน มันจะเปิดหน้าเปล่า)
            window.open('https://line.me/ti/p/XyfNDCz4T2'); 
        }
    });
}