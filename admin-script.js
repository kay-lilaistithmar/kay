/* =========================================
   Admin Panel - Glass Style Logic (Updated Support & Withdrawals & Refund)
   ========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, query, orderBy, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    pass: "1998b" // كلمة المرور الافتراضية
};

let currentUser = null; 
let notes = JSON.parse(localStorage.getItem('adminNotes')) || []; 

/* === دوال النظام الأساسية === */
window.adminLogin = function() {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;

    // تعديل: التحقق من كلمة المرور المخزنة في الذاكرة أو استخدام الافتراضية
    const storedPass = localStorage.getItem('admin_password') || ADMIN_AUTH.pass;

    if (email === ADMIN_AUTH.email && pass === storedPass) {
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('bottomNav').style.display = 'flex'; // إظهار الشريط السفلي
        renderPlans(); 
        renderNotes();
        listenToWithdrawals(); 
        listenToSupport(); // تفعيل الاستماع للرسائل
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

/* === وظيفة تغيير كلمة المرور (جديد) === */
window.changeAdminPassword = function() {
    const currentInput = document.getElementById('currentAdminPass').value;
    const newInput = document.getElementById('newAdminPass').value;
    
    // جلب كلمة السر الحالية للتأكد
    const savedPass = localStorage.getItem('admin_password') || ADMIN_AUTH.pass;

    if (currentInput !== savedPass) {
        alert("❌ كلمة المرور الحالية غير صحيحة!");
        return;
    }

    if (newInput.length < 4) {
        alert("⚠️ كلمة المرور الجديدة قصيرة جداً (يجب أن تكون 4 أحرف على الأقل).");
        return;
    }

    // حفظ كلمة السر الجديدة
    localStorage.setItem('admin_password', newInput);
    alert("✅ تم تغيير كلمة المرور بنجاح! سيتم اعتمادها في المرة القادمة.");
    
    // تفريغ الخانات
    document.getElementById('currentAdminPass').value = "";
    document.getElementById('newAdminPass').value = "";
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
    const days = document.getElementById('pDays').value;

    if (!name || !price || !stock || !days) return alert('يرجى ملء كافة الحقول بما فيها مدة العداد');

    const newPlan = {
        name: name,
        price: Number(price),
        profit: Number(profit),
        stock: Number(stock),
        days: Number(days),
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
        document.getElementById('pDays').value = '';
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
                        <small>سعر: ${plan.price} | ربح: ${plan.profit} | مدة: ${plan.days || 30} يوم | <span style="color:#2980b9">${plan.sold}/${plan.stock}</span></small>
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

// دالة ربط المستخدم بفريق يدوياً
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

/* === استماع للطلبات مع خيارات الموافقة/الرفض === */
function listenToWithdrawals() {
    const list = document.getElementById('withdrawalsList');
    // الترتيب حسب التاريخ الأحدث
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

            // تحديد لون الحالة
            let statusBadge = '';
            let buttons = '';
            
            if(req.status === 'pending') {
                statusBadge = '<span style="background:orange; padding:2px 8px; border-radius:10px; font-size:0.7rem;">جديد</span>';
                buttons = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="btn-done" style="background:green; border-radius:10px;" onclick="updateWithdrawStatus('${doc.id}', 'approved')">موافقة</button>
                        <button class="btn-done" style="background:red; border-radius:10px;" onclick="updateWithdrawStatus('${doc.id}', 'rejected')">رفض</button>
                    </div>
                `;
            } else if(req.status === 'approved') {
                statusBadge = '<span style="background:green; color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem;">تمت الموافقة</span>';
            } else if(req.status === 'rejected') {
                statusBadge = '<span style="background:red; color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem;">مرفوض</span>';
            }

            list.innerHTML += `
            <div class="req-card">
                <div class="req-header">
                    <span>${icon} ${req.userName}</span>
                    <div>${statusBadge} <span style="font-size:0.8rem; opacity:0.9">${dateStr}</span></div>
                </div>
                <div class="req-body">
                    <div class="req-row">
                        <span style="color:#888;">الاسم الحقيقي</span>
                        <span style="font-weight:bold;">${req.realName || 'غير متوفر'}</span>
                    </div>
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
                    <small>ID: ${req.userId}</small>
                    ${buttons}
                </div>
            </div>
            `;
        });
    });
}

// دالة تحديث الحالة + استرجاع الرصيد عند الرفض
window.updateWithdrawStatus = async function(docId, newStatus) {
    if(confirm(newStatus === 'approved' ? 'تأكيد الموافقة على السحب؟' : 'تأكيد رفض السحب؟')) {
        try {
            // جلب تفاصيل الطلب أولاً لمعرفة المبلغ والمستخدم
            const reqRef = doc(db, "withdrawals", docId);
            const reqSnap = await getDoc(reqRef);

            if (!reqSnap.exists()) return alert("الطلب غير موجود");
            const reqData = reqSnap.data();

            // إذا كانت الحالة "رفض"، نقوم بإرجاع المبلغ للمستخدم
            if (newStatus === 'rejected') {
                 const userRef = doc(db, "users", reqData.userId);
                 await updateDoc(userRef, {
                     balance: increment(reqData.amount) // إعادة الرصيد
                 });
            }

            // تحديث حالة الطلب
            await updateDoc(reqRef, {
                status: newStatus
            });
            
            alert("تم تحديث الحالة" + (newStatus === 'rejected' ? " وتم استرجاع الرصيد للمستخدم." : "."));

        } catch(e) {
            console.error(e);
            alert("حدث خطأ أثناء التحديث.");
        }
    }
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text);
    alert('تم النسخ: ' + text);
}

/* === استماع لرسائل الدعم === */
function listenToSupport() {
    const list = document.getElementById('supportList');
    const q = query(collection(db, "support_tickets"), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        if(snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:white;">لا توجد رسائل.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const msg = doc.data();
            const dateObj = new Date(msg.date);
            const dateStr = dateObj.toLocaleDateString();

            list.innerHTML += `
            <div class="glass-card" style="text-align:right;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${msg.userName}</strong>
                    <span style="font-size:0.8rem; color:#777;">${dateStr}</span>
                </div>
                <div style="background:rgba(255,255,255,0.8); padding:10px; border-radius:10px; margin-bottom:10px;">
                    <p style="margin:0;">${msg.lastMessage}</p>
                </div>
                <div style="font-size:0.85rem; color:#555; margin-bottom:10px;">
                    الرصيد الحالي: <b>${msg.userBalance ? msg.userBalance.toLocaleString() : '---'} IQD</b> <br>
                    ID: ${msg.userId}
                </div>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="reply_${doc.id}" placeholder="اكتب الرد هنا..." style="flex:1; padding:8px; border-radius:5px; border:none;">
                    <button onclick="replyToSupport('${doc.id}')" class="btn-glass-primary">رد</button>
                </div>
                ${msg.adminReply ? `<p style="color:green; font-size:0.8rem; margin-top:5px;">تم الرد: ${msg.adminReply}</p>` : ''}
            </div>
            `;
        });
    });
}

window.replyToSupport = async function(userId) {
    const replyText = document.getElementById('reply_' + userId).value;
    if(!replyText) return;

    try {
        await setDoc(doc(db, "support_tickets", userId), {
            adminReply: replyText,
            hasUnreadReply: true // تفعيل الإشعار للمستخدم
        }, {merge: true});
        alert("تم إرسال الرد");
    } catch(e) {
        alert("فشل الإرسال");
    }
}
