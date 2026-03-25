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
        confirmButtonColor: '#ef4444', cancelButtonColor: '#3b82f6', confirmButtonText: 'ใช่, ออกระบบ!'
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
                                ? `<button onclick="requestQuote('${p.name}')" class="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl transition font-bold text-white">📞 ขอใบเสนอราคา</button>`
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
    if (!getToken()) return Swal.fire({ icon: 'warning', title: 'Hey!', text: 'ล็อกอินก่อนสิวัยรุ่น' });
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

async function topup() {
    const { value: amount } = await Swal.fire({
        title: 'Payment Gateway',
        html: `
            <input id="swal-amount" type="number" class="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white mb-4" placeholder="Amount (THB)">
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
                <input type="text" class="w-full bg-black/60 p-2 text-white mb-2" placeholder="4242 4242 4242 4242">
                <div class="flex gap-2"><input type="text" class="w-1/2 bg-black/60 p-2" placeholder="MM/YY"><input type="text" class="w-1/2 bg-black/60 p-2" placeholder="CVC"></div>
            </div>
        `,
        preConfirm: () => document.getElementById('swal-amount').value
    });

    if (amount) {
        Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
        try {
            await apiCall('/tx/topup', 'POST', { amount: parseFloat(amount) });
            setTimeout(() => {
                Swal.fire({ icon: 'success', title: 'Topup Successful!' });
                loadProfileData();
            }, 1000);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed', text: err.message });
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