/* =========================================
   Admin Panel - Glass Style Logic (Updated)
   ========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFzCkQI0jedUl8W9xO1Bwzdg2Rhnxsh-s",
    authDomain: "kj1i-c1d4d.firebaseapp.com",
    projectId: "kj1i-c1d4d",
    storageBucket: "kj1i-c1d4d.firebasestorage.app",
    messagingSenderId: "674856242986",
    appId: "1:674856242986:web:77642057ca6ec2036c5853",
    measurementId: "G-J9QPH9Z1K1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_AUTH = {
    email: "saraameer1022@gmail.com",
    pass: "1998b"
};

let currentUser = null; 
let notes = JSON.parse(localStorage.getItem('adminNotes')) || []; 

/* === دوال النظام الأساسية === */
window.adminLogin = function() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;

    if (email === ADMIN_AUTH.email && pass === ADMIN_AUTH.pass) {
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('bottomNav').style.display = 'flex'; // إظهار الشريط السفلي
        renderPlans(); 
        renderNotes();
        listenToWithdrawals(); 
        loadSettings(); // تحميل الإعدادات
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

window.adminLogout = function() {
    location.reload();
}

window.showTab = function(tabId, el) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(el) el.classList.add('active');
}

/* === 1. إدارة العدادات === */
window.toggleAddForm = function() {
    const form = document.getElementById('addPlanForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

window.addNewPlan = async function() {
    const name = document.getElementById('pName').value;
    const price = document.getElementById('pPrice').value;
    const profit = document.getElementById('pProfit').value;
    const stock = document.getElementById('pStock').value;

    if (!name || !price || !stock) return alert('يرجى ملء كافة الحقول');

    const newPlan = {
        name: name,
        price: Number(price),
        profit: Number(profit),
        stock: Number(stock),
        sold: 0,
        createdAt: Date.now() 
    };

    try {
        const planId = "PLAN_" + Date.now();
        await setDoc(doc(db, "plans", planId), newPlan);
        alert('تم نشر العداد ✅');
        renderPlans();
        toggleAddForm();
        
        document.getElementById('pName').value = '';
        document.getElementById('pPrice').value = '';
    } catch (e) {
        console.error("Error adding plan: ", e);
        alert("حدث خطأ");
    }
}

window.renderPlans = async function() {
    const list = document.getElementById('adminPlansList');
    list.innerHTML = '<p style="text-align:center">جاري جلب البيانات...</p>';
    
    try {
        const q = query(collection(db, "plans")); 
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = '';
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:white;">لا توجد عدادات.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const plan = docSnap.data();
            const planId = docSnap.id;
            
            list.innerHTML += `
                <div class="plan-item">
                    <div>
                        <strong style="color:var(--primary-pink);">${plan.name}</strong> <br>
                        <small>سعر: ${plan.price} | ربح: ${plan.profit} | <span style="color:#2980b9">${plan.sold}/${plan.stock}</span></small>
                    </div>
                    <button onclick="deletePlan('${planId}')" class="btn-glass" style="background:#ff758c; color:white;">حذف</button>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p>فشل التحميل.</p>';
    }
}

window.deletePlan = async function(planId) {
    if(confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, "plans", planId));
            renderPlans(); 
        } catch (e) {
            alert("حدث خطأ");
        }
    }
}

/* === 2. إدارة المستثمرين والفريق === */
window.searchUser = async function() {
    const id = document.getElementById('searchId').value.trim();
    if(!id) return alert("أدخل ID");

    try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentUser = docSnap.data();
            currentUser.dbId = docSnap.id;

            document.getElementById('userResult').style.display = 'block';
            document.getElementById('uName').innerText = currentUser.name;
            document.getElementById('uID').innerText = currentUser.id;
            document.getElementById('uBalance').value = currentUser.balance;
            
            // عرض معلومات القائد
            const refText = currentUser.referredBy ? `(تابع للقائد: ${currentUser.referredBy})` : 'ليس لديه قائد';
            document.getElementById('uReferralInfo').innerText = refText;
            document.getElementById('uLeaderID').value = currentUser.referredBy || '';

        } else {
            alert('المستخدم غير موجود');
            document.getElementById('userResult').style.display = 'none';
        }
    } catch (e) {
        console.error(e);
        alert("خطأ");
    }
}

window.updateBalance = function(direction) {
    let val = parseInt(document.getElementById('uBalance').value) || 0;
    if(direction === 1) val += 1000;
    else val -= 1000;
    document.getElementById('uBalance').value = val;
}

window.saveUserChanges = async function() {
    if(currentUser && currentUser.dbId) {
        const newBalance = parseInt(document.getElementById('uBalance').value);
        try {
            const userRef = doc(db, "users", currentUser.dbId);
            await updateDoc(userRef, {
                balance: newBalance
            });
            alert(`تم الحفظ ✅`);
        } catch (e) {
            alert("فشل الحفظ");
        }
    }
}

// دالة جديدة: ربط المستخدم بفريق يدوياً
window.linkUserToLeader = async function() {
    if(!currentUser || !currentUser.dbId) return;
    const leaderId = document.getElementById('uLeaderID').value.trim();
    
    if(!leaderId) return alert('يرجى إدخال ID القائد');
    if(leaderId === currentUser.id) return alert('لا يمكن ربط المستخدم بنفسه');

    try {
        // التحقق من وجود القائد
        const leaderRef = doc(db, "users", leaderId);
        const leaderSnap = await getDoc(leaderRef);
        
        if(!leaderSnap.exists()) return alert('القائد غير موجود');

        const userRef = doc(db, "users", currentUser.dbId);
        await updateDoc(userRef, {
            referredBy: leaderId
        });
        alert('تم ربط المستخدم بالقائد بنجاح ✅');
    } catch(e) {
        console.error(e);
        alert("حدث خطأ أثناء الربط");
    }
}

window.banUser = async function() {
    if(currentUser && currentUser.dbId) {
        if(confirm("حظر هذا المستخدم؟")) {
            try {
                const userRef = doc(db, "users", currentUser.dbId);
                await updateDoc(userRef, { status: 'banned' });
                alert('تم الحظر');
            } catch(e) {
                alert("فشل");
            }
        }
    }
}

/* === 3. إعدادات السحب === */
window.loadSettings = async function() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if(docSnap.exists()) {
            const data = docSnap.data().methods || {};
            document.getElementById('chkZain').checked = data.zaincash !== false;
            document.getElementById('chkMaster').checked = data.mastercard !== false;
            document.getElementById('chkFIB').checked = data.fib !== false;
            document.getElementById('chkUSDT').checked = data.usdt !== false;
        }
    } catch(e) { console.log("No settings yet"); }
}

window.saveWithdrawSettings = async function() {
    const settings = {
        methods: {
            zaincash: document.getElementById('chkZain').checked,
            mastercard: document.getElementById('chkMaster').checked,
            fib: document.getElementById('chkFIB').checked,
            usdt: document.getElementById('chkUSDT').checked
        }
    };
    try {
        await setDoc(doc(db, "settings", "general"), settings);
        alert('تم حفظ إعدادات السحب ✅');
    } catch(e) {
        alert("فشل الحفظ");
    }
}

/* === 4. الملاحظات والطلبات === */
window.addNote = function() {
    const name = document.getElementById('noteName').value;
    const date = document.getElementById('noteDate').value;
    if(!name) return;

    notes.push({name, date});
    localStorage.setItem('adminNotes', JSON.stringify(notes));
    renderNotes();
}

window.renderNotes = function() {
    const tbody = document.getElementById('notesList');
    tbody.innerHTML = '';
    notes.forEach((n, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${n.name}</td>
                <td>${n.date}</td>
                <td><button onclick="deleteNote(${i})" style="color:red; background:none; border:none; cursor:pointer;">X</button></td>
            </tr>
        `;
    });
}

window.deleteNote = function(i) {
    notes.splice(i, 1);
    localStorage.setItem('adminNotes', JSON.stringify(notes));
    renderNotes();
}

function listenToWithdrawals() {
    const list = document.getElementById('withdrawalsList');
    const q = query(collection(db, "withdrawals"), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        if(snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; width:100%; color:white;">لا توجد طلبات جديدة.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const req = doc.data();
            const dateObj = new Date(req.date);
            const dateStr = dateObj.toLocaleTimeString('ar-EG');
            
            // تحديد الأيقونة
            let icon = '💳';
            if(req.method === 'zaincash') icon = '📱';
            else if(req.method === 'usdt') icon = '💲';
            else if(req.method === 'fib') icon = '🏦';

            list.innerHTML += `
            <div class="req-card">
                <div class="req-header">
                    <span>${icon} ${req.userName}</span>
                    <span style="font-size:0.8rem; opacity:0.9">${dateStr}</span>
                </div>
                <div class="req-body">
                    <div class="req-row">
                        <span style="color:#888;">المبلغ</span>
                        <span class="req-val amount">${Number(req.amount).toLocaleString()} IQD</span>
                    </div>
                    <div class="req-row">
                        <span style="color:#888;">الطريقة</span>
                        <span>${req.method}</span>
                    </div>
                    <div class="req-account-box" onclick="copyText('${req.accountNumber}')">
                        ${req.accountNumber} <i class="fas fa-copy"></i>
                    </div>
                    <button class="btn-done" onclick="deleteReq('${doc.id}')">✔️ تم التحويل</button>
                </div>
            </div>
            `;
        });
    });
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text);
    alert('تم النسخ: ' + text);
}

window.deleteReq = async function(docId) {
    if(confirm('هل تريد أرشفة هذا الطلب؟')) {
        try {
            await deleteDoc(doc(db, "withdrawals", docId));
        } catch(e) {
            console.error(e);
        }
    }
}
