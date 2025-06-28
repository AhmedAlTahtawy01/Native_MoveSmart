document.addEventListener("DOMContentLoaded", async function () {
    // العناصر الأساسية
    const saveButton = document.querySelector(".save-btn");
    const deleteButton = document.querySelector(".delete-btn");
    const printButton = document.querySelector(".print-btn");
    const backButton = document.querySelector(".back-btn");
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    const addSubscriptionBtn = document.querySelector(".add-subscription-btn");
    const subscriptionModal = document.getElementById("subscription-modal");
    const closeModal = document.querySelector(".close-modal");
    const saveSubscriptionBtn = document.getElementById("save-subscription-btn");
    const subscriptionItems = document.querySelector(".subscription-items");

    // بيانات الموظف واشتراكاته
    let employeeData = {
        name: "",
        phone: "",
        nationalId: "",
        jobTitle: "",
        subscriptions: []
    };

    // جلب ID من الرابط
    function getEmployeeIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    }

    // جلب بيانات الموظف من الـ API
    async function fetchEmployeeById(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`https://movesmartapi.runasp.net/api/Employees/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("فشل في جلب بيانات الموظف");
            const data = await res.json();
            return data;
        } catch (err) {
            alert("حدث خطأ أثناء تحميل بيانات الموظف");
            return null;
        }
    }

    // تحميل البيانات المحفوظة أو من الـ API
    async function loadSavedData() {
        const employeeId = getEmployeeIdFromUrl();
        if (employeeId) {
            const apiData = await fetchEmployeeById(employeeId);
            if (apiData) {
                employeeData = {
                    name: apiData.name,
                    phone: apiData.phone,
                    nationalId: apiData.nationalNo,
                    jobTitle: apiData.jobTitle,
                    department: apiData.department || "",
                    subscriptions: apiData.subscriptions || [],
                };
            }
        } else {
            const savedData = JSON.parse(localStorage.getItem("employeeData")) || employeeData;
            employeeData = savedData;
        }
        updateEmployeeInfo();
        renderSubscriptions();
    }

    // تحديث معلومات الموظف المعروضة
    function updateEmployeeInfo() {
        document.getElementById("employee-name").textContent = employeeData.name || "غير محدد";
        document.getElementById("employee-phone").textContent = `رقم الهاتف: ${employeeData.phone || "غير متوفر"}`;
        
        // تحديث حقول الإدخال
        document.querySelector('input[name="employeeName"]').value = employeeData.name || "";
        document.querySelector('input[name="employeePhone"]').value = employeeData.phone || "";
        document.querySelector('input[name="employeeNationalId"]').value = employeeData.nationalId || "";
        document.querySelector('input[name="employeeJobTitle"]').value = employeeData.jobTitle || "";
    }

    // عرض اشتراكات الموظف
    function renderSubscriptions() {
        subscriptionItems.innerHTML = "";
        
        if (employeeData.subscriptions.length === 0) {
            subscriptionItems.innerHTML = '<div class="no-subscriptions">لا يوجد اشتراكات مسجلة</div>';
            return;
        }
        
        employeeData.subscriptions.forEach((sub, index) => {
            const subscriptionItem = document.createElement("div");
            subscriptionItem.className = "subscription-item";
            subscriptionItem.innerHTML = `
                <div>${sub.courseNumber || '-'}</div>
                <div>${formatDateTime(sub.startTime) || '-'}</div>
                <div>${sub.duration || '-'}</div>
                <div>${sub.carNumber || '-'}</div>
                <div class="status-cell ${sub.status === 'مشترك' ? 'subscribed' : 'not-subscribed'}">
                    ${sub.status || 'غير مشترك'}
                </div>
            `;
            subscriptionItems.appendChild(subscriptionItem);
        });
    }

    // دالة المساعدة: تنسيق التاريخ والوقت
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return "غير محدد";
        const date = new Date(dateTimeString);
        return date.toLocaleString('ar-EG');
    }

    // حفظ بيانات الموظف
    function saveEmployeeData() {
        employeeData.name = document.querySelector('input[name="employeeName"]').value;
        employeeData.phone = document.querySelector('input[name="employeePhone"]').value;
        employeeData.nationalId = document.querySelector('input[name="employeeNationalId"]').value;
        employeeData.jobTitle = document.querySelector('input[name="employeeJobTitle"]').value;
        employeeData.department = document.querySelector('input[name="employeeDepartment"]').value;
        
        localStorage.setItem("employeeData", JSON.stringify(employeeData));
        alert("✅ تم حفظ البيانات بنجاح");
        updateEmployeeInfo();
    }

    // إضافة اشتراك جديد
    function addNewSubscription() {
        const courseNumber = document.querySelector('input[name="courseNumber"]').value;
        const startTime = document.querySelector('input[name="startTime"]').value;
        const duration = document.querySelector('input[name="duration"]').value;
        const carNumber = document.querySelector('input[name="carNumber"]').value;
        const status = document.querySelector('select[name="subscriptionStatus"]').value;
        
        if (!courseNumber || !startTime || !duration || !carNumber) {
            alert("⚠ يرجى ملء جميع الحقول");
            return;
        }
        
        const newSubscription = {
            courseNumber,
            startTime,
            duration,
            carNumber,
            status
        };
        
        employeeData.subscriptions.push(newSubscription);
        localStorage.setItem("employeeData", JSON.stringify(employeeData));
        
        // إغلاق النافذة وإعادة العرض
        subscriptionModal.style.display = "none";
        renderSubscriptions();
    }

    // معالجات الأحداث
    saveButton.addEventListener("click", saveEmployeeData);
    
    deleteButton.addEventListener("click", function() {
        if (confirm("⚠ هل أنت متأكد من حذف بيانات الموظف؟")) {
            localStorage.removeItem("employeeData");
            employeeData = {
                name: "",
                phone: "",
                nationalId: "",
                jobTitle: "",
                department: "",
                subscriptions: []
            };
            updateEmployeeInfo();
            renderSubscriptions();
            alert("✅ تم حذف البيانات بنجاح");
        }
    });

    printButton.addEventListener("click", function() {
        window.print();
    });

    backButton.addEventListener("click", function() {
        window.history.back();
    });

    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            tabContents.forEach(content => content.style.display = "none");
            document.getElementById(this.dataset.tab).style.display = "block";
        });
    });

    addSubscriptionBtn.addEventListener("click", function() {
        // تعيين الوقت الحالي كوقت افتراضي
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        document.querySelector('input[name="startTime"]').value = localISOTime;
        
        // مسح الحقول الأخرى
        document.querySelector('input[name="courseNumber"]').value = "";
        document.querySelector('input[name="duration"]').value = "";
        document.querySelector('input[name="carNumber"]').value = "";
        document.querySelector('select[name="subscriptionStatus"]').value = "مشترك";
        
        subscriptionModal.style.display = "flex";
    });

    closeModal.addEventListener("click", function() {
        subscriptionModal.style.display = "none";
    });

    saveSubscriptionBtn.addEventListener("click", addNewSubscription);

    // التهيئة الأولية
    document.querySelector("[data-tab='employee-info']").click();
    await loadSavedData();
});