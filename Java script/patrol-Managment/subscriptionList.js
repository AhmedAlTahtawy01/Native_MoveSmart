console.log(window.token, window.userRole, window.userName, window.role);

if (typeof window.allSubscribers === "undefined") {
  window.allSubscribers = [];
}
if (typeof window.allEmployeesMap === "undefined") {
  window.allEmployeesMap = new Map();
}
document.getElementById("refreshBtn").onclick = fetchSubscribers;

document.getElementById("addSubscriber").onclick = () => {
  document.getElementById("popup").classList.remove("hidden");
  loadEmployeesAndPatrols();
};

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

document.getElementById("filterBtn").onclick = () => {
  document.getElementById("filterMenu").classList.toggle("hidden");
};

function toggleNameFilter() {
  document.getElementById("nameFilter").classList.toggle("hidden");
  document.getElementById("statusFilter").classList.add("hidden");
}

function toggleStatusFilter() {
  document.getElementById("statusFilter").classList.toggle("hidden");
  document.getElementById("nameFilter").classList.add("hidden");
}

function filterByName() {
  const name = document.getElementById("nameInput").value.trim();
  const filtered = allSubscribers.filter((s) => s.name?.includes(name));
  renderSubscribers(filtered);
  document.getElementById("filterMenu").classList.add("hidden");
  document.getElementById("nameFilter").classList.add("hidden");
}

function filterByStatus(statusText) {
  const status = statusText === "متاحة" ? 0 : 1;
  const filtered = allSubscribers.filter(
    (s) => s.transportationSubscriptionStatus === status
  );
  renderSubscribers(filtered);
  document.getElementById("filterMenu").classList.add("hidden");
  document.getElementById("statusFilter").classList.add("hidden");
}

function showNotification(message) {
  const note = document.getElementById("notification");
  note.textContent = message;
  note.classList.remove("hidden");
  setTimeout(() => {
    note.classList.add("hidden");
  }, 3000);
}

async function fetchSubscribers() {
  try {
    // 1. تحميل الموظفين
    const empRes = await fetch(
      "https://movesmartapi.runasp.net/api/Employees/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const empData = await empRes.json();
    const employees = empData.$values || [];

    // تخزين الموظفين في Map
    allEmployeesMap.clear();
    employees.forEach((emp) => {
      allEmployeesMap.set(emp.employeeID, emp);
    });

    // 2. تحميل الاشتراكات
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/PatrolsSubscriptions/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) throw new Error("فشل في جلب البيانات");

    const data = await response.json();
    const rawList = data.$values || [];

    // إزالة التكرارات حسب employeeID ودمج بيانات الموظف
    const uniqueMap = new Map();
    rawList.forEach((sub) => {
      if (!uniqueMap.has(sub.employeeID)) {
        const emp = allEmployeesMap.get(sub.employeeID);
        if (emp) {
          sub.name = emp.name;
          sub.phone = emp.phone;
        } else {
          sub.name = "غير معروف";
          sub.phone = "غير معروف";
        }
        uniqueMap.set(sub.employeeID, sub);
      }
    });

    allSubscribers = Array.from(uniqueMap.values());
    renderSubscribers(allSubscribers);
  } catch (error) {
    console.error(error);
    showNotification("حدث خطأ أثناء تحميل المشتركين");
  }
}

function renderSubscribers(list) {
  const tbody = document.getElementById("subscriberList");
  tbody.innerHTML = "";

  list.forEach((sub) => {
    const statusText =
      sub.transportationSubscriptionStatus === 0 ? "متاحة" : "منتهية";
    const statusClass =
      sub.transportationSubscriptionStatus === 0
        ? "status-0"
        : "status-1";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>≡</td>
      <td>${sub.phone || "—"}</td>
      <td><span class="${statusClass}">${statusText}</span></td>
      <td>${sub.name || "—"}</td>
    `;
    tr.style.cursor = "pointer";
    tr.onclick = (event) => {
      event.stopPropagation();
      console.log("Row clicked:", sub);
      openEditPopup(sub);
    };
    tbody.appendChild(tr);
  });

  document.getElementById("totalCount").textContent = list.length;
}

async function loadEmployeesAndPatrols() {
  try {
    // جلب الموظفين
    const empRes = await fetch(
      "https://movesmartapi.runasp.net/api/Employees/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const empData = await empRes.json();
    const employees = empData.$values || [];

    const empSelect = document.getElementById("employeeSelect");
    empSelect.innerHTML =
      '<option disabled selected value="">اختر موظفًا</option>';
    employees.forEach((emp) => {
      const option = document.createElement("option");
      option.value = emp.employeeID;
      option.textContent = emp.name;
      empSelect.appendChild(option);
    });

    // جلب الدوريات
    const patrolRes = await fetch(
      "https://movesmartapi.runasp.net/api/Patrols/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const patrolData = await patrolRes.json();
    const patrols = patrolData.$values || [];

    const patrolSelect = document.getElementById("patrolSelect");
    patrolSelect.innerHTML =
      '<option disabled selected value="">اختر الدورية</option>';
    patrols.forEach((patrol) => {
      const option = document.createElement("option");
      option.value = patrol.patrolID;
      option.textContent = `دورية ${patrol.patrolID} - ${
        (patrol.movingAt || "").split("T")[0]
      }`;
      patrolSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    showNotification("خطأ في تحميل الموظفين أو الدوريات");
  }
}

async function saveNewSubscriber() {
  const empID = document.getElementById("employeeSelect").value;
  const patrolID = document.getElementById("patrolSelect").value;

  if (!empID || !patrolID) {
    showNotification("يجب اختيار الموظف والدورية");
    return;
  }

  const newSubscription = {
    subscriptionID: 0,
    patrolID: parseInt(patrolID),
    employeeID: parseInt(empID),
    transportationSubscriptionStatus: 0,
  };

  try {
    console.log("🚀 الاشتراك الجديد:", newSubscription);
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/PatrolsSubscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSubscription),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("تفاصيل الخطأ:", errorText);
      throw new Error("فشل في حفظ الاشتراك");
    }

    showNotification("تمت إضافة الاشتراك بنجاح");
    closePopup();
    await fetchSubscribers();
  } catch (error) {
    console.error(error);
    showNotification("حدث خطأ أثناء حفظ الاشتراك");
  }
}

// Edit functionality
if (typeof window.currentEditingSubscription === "undefined") {
  window.currentEditingSubscription = null;
}

function openEditPopup(subscription) {
  window.currentEditingSubscription = subscription;
  document.getElementById("editPopup").classList.remove("hidden");
  loadEditFormData(subscription);
}

function closeEditPopup() {
  document.getElementById("editPopup").classList.add("hidden");
  window.currentEditingSubscription = null;
  document.getElementById("editNotification").classList.add("hidden");
}

async function loadEditFormData(subscription) {
  try {
    // Load employees for edit form
    const empRes = await fetch(
      "https://movesmartapi.runasp.net/api/Employees/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const empData = await empRes.json();
    const employees = empData.$values || [];

    const editEmpSelect = document.getElementById("editEmployeeSelect");
    editEmpSelect.innerHTML = '<option disabled value="">اختر موظفًا</option>';
    employees.forEach((emp) => {
      const option = document.createElement("option");
      option.value = emp.employeeID;
      option.textContent = emp.name;
      if (emp.employeeID === subscription.employeeID) {
        option.selected = true;
      }
      editEmpSelect.appendChild(option);
    });

    // Load patrols for edit form
    const patrolRes = await fetch(
      "https://movesmartapi.runasp.net/api/Patrols/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const patrolData = await patrolRes.json();
    const patrols = patrolData.$values || [];

    const editPatrolSelect = document.getElementById("editPatrolSelect");
    editPatrolSelect.innerHTML = '<option disabled value="">اختر الدورية</option>';
    patrols.forEach((patrol) => {
      const option = document.createElement("option");
      option.value = patrol.patrolID;
      option.textContent = `دورية ${patrol.patrolID} - ${
        (patrol.movingAt || "").split("T")[0]
      }`;
      if (patrol.patrolID === subscription.patrolID) {
        option.selected = true;
      }
      editPatrolSelect.appendChild(option);
    });

    // Set status
    document.getElementById("editStatusSelect").value = subscription.transportationSubscriptionStatus;
  } catch (err) {
    console.error(err);
    showEditNotification("خطأ في تحميل بيانات التعديل");
  }
}

function showEditNotification(message) {
  const note = document.getElementById("editNotification");
  note.textContent = message;
  note.classList.remove("hidden");
  setTimeout(() => {
    note.classList.add("hidden");
  }, 3000);
}

async function saveEditedSubscriber() {
  if (!window.currentEditingSubscription) {
    showEditNotification("لا يوجد اشتراك للتعديل");
    return;
  }

  const empID = document.getElementById("editEmployeeSelect").value;
  const patrolID = document.getElementById("editPatrolSelect").value;
  const status = document.getElementById("editStatusSelect").value;

  if (!empID || !patrolID) {
    showEditNotification("يجب اختيار الموظف والدورية");
    return;
  }

  const updatedSubscription = {
    subscriptionID: window.currentEditingSubscription.subscriptionID,
    patrolID: parseInt(patrolID),
    employeeID: parseInt(empID),
    transportationSubscriptionStatus: parseInt(status),
  };

  try {
    console.log("🔄 تحديث الاشتراك:", updatedSubscription);
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/PatrolsSubscriptions",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedSubscription),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("تفاصيل الخطأ:", errorText);
      throw new Error("فشل في تحديث الاشتراك");
    }

    showEditNotification("تم تحديث الاشتراك بنجاح");
    closeEditPopup();
    await fetchSubscribers();
  } catch (error) {
    console.error(error);
    showEditNotification("حدث خطأ أثناء تحديث الاشتراك");
  }
}

// Add click outside to close functionality
document.addEventListener('click', function(event) {
  const popup = document.getElementById("popup");
  const editPopup = document.getElementById("editPopup");
  
  // Close add popup when clicking outside
  if (!popup.classList.contains("hidden") && 
      !popup.querySelector('.subscription-popup-content').contains(event.target) &&
      !event.target.closest('#addSubscriber')) {
    closePopup();
  }
  
  // Close edit popup when clicking outside
  if (!editPopup.classList.contains("hidden") && 
      !editPopup.querySelector('.subscription-popup-content').contains(event.target) &&
      !event.target.closest('#subscriberList')) {
    closeEditPopup();
  }
});

// ✅ Main init
(async function init() {
  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "PatrolsSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }

  await fetchSubscribers();
})();
