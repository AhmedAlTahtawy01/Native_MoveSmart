if (typeof token === 'undefined') {
  var token = localStorage.getItem('token');
}
if (typeof userRole === 'undefined') {
  var userRole = localStorage.getItem('userRole');
}
if (typeof userName === 'undefined') {
  var userName = localStorage.getItem('userName');
}

document.addEventListener("DOMContentLoaded", async function () {
  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "PatrolsSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }

  // ✅ دالة مساعدة لاستخراج ID الدورية من الرابط
  function getPatrolIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  // ✅ جلب بيانات الدورية
  async function fetchPatrolById(id) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/Patrols/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات الدورية");
      return await res.json();
    } catch {
      alert("حدث خطأ أثناء تحميل بيانات الدورية");
      return null;
    }
  }

  // ✅ جلب بيانات الباص
  async function fetchBusById(busID) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/Buses/ByID/${busID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات الباص");
      return await res.json();
    } catch {
      return null;
    }
  }

  // ✅ جلب بيانات السائق
  async function fetchDriverById(driverID) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/Drivers/ByID/${driverID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات السائق");
      return await res.json();
    } catch {
      return null;
    }
  }

  // ✅ جلب اشتراكات الدورية
  async function fetchSubscriptionsByPatrol(patrolID) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/PatrolsSubscriptions/AllForPatrol/${patrolID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب الاشتراكات");
      const data = await res.json();
      return data.$values || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  // ✅ جلب موظف حسب ID
  async function fetchEmployeeById(employeeId) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/Employees/ByID/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات الموظف");
      return await res.json();
    } catch (err) {
      console.error(`خطأ في الموظف ID ${employeeId}`, err);
      return null;
    }
  }

  // ✅ ترجمة حالة السيارة
  function getVehicleStatusText(status) {
    switch (status) {
      case 0: return "متاحة";
      case 1: return "مشغولة";
      case 2: return "صيانة";
      default: return "غير معروف";
    }
  }

  // ✅ عرض كل تفاصيل الدورية في الصفحة
  async function displayPatrolDetails() {
    const patrolId = getPatrolIdFromUrl();
    if (!patrolId) return;

    const patrol = await fetchPatrolById(patrolId);
    if (!patrol) return;

    // تعبئة بيانات الدورية
    document.getElementById("patrol-id").value = patrol.patrolID || "";
    document.getElementById("patrol-desc").value = patrol.description || "";
    document.getElementById("patrol-moving").value = patrol.movingAt || "";
    document.getElementById("patrol-duration").value = patrol.approximatedTime || "";

    // تعبئة بيانات الباص
    let bus = null, vehicle = null, driver = null;
    if (patrol.busID) {
      bus = await fetchBusById(patrol.busID);
      vehicle = bus?.vehicle || null;
    }

    // تعبئة بيانات السائق
    if (vehicle) {
      if (vehicle.driver) {
        driver = vehicle.driver;
      } else if (vehicle.driverID) {
        driver = await fetchDriverById(vehicle.driverID);
      }
    }

    document.getElementById("vehicle-plate").value = vehicle?.plateNumbers || "";
    document.getElementById("vehicle-brand").value = vehicle?.brandName || "";
    document.getElementById("vehicle-model").value = vehicle?.modelName || "";
    document.getElementById("vehicle-status").value = getVehicleStatusText(vehicle?.status);

    document.getElementById("driver-name").value = driver?.name || vehicle?.driverName || "";
    document.getElementById("driver-phone").value = driver?.phone || vehicle?.driverPhone || "";

    document.getElementById("bus-available").value = bus?.availableSpace ?? "";
    document.getElementById("bus-seats").value = bus?.totalSeats ?? "";

    // ✅ جلب و عرض المشتركين في الدورية
    const subscriptions = await fetchSubscriptionsByPatrol(patrol.patrolID);
    const employees = [];

    for (const sub of subscriptions) {
      const emp = await fetchEmployeeById(sub.employeeID);
      if (emp) employees.push(emp);
    }

    const tbody = document.querySelector("#subscribers tbody");
    if (tbody) {
      tbody.innerHTML = "";
      employees.forEach(emp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${emp.name}</td>
          <td>${emp.jobTitle}</td>
          <td>${emp.phone}</td>
          <td><button onclick="window.location.href='../../Pages/patrol-Managment/subscriptionDetail.html?id=${emp.employeeID}'">عرض التفاصيل</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // تنفيذ عند التحميل
  await displayPatrolDetails();
});

// ✅ التحكم في التابات
function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("show");
  });

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("show");
  event.target.classList.add("active");
}

// ✅ طباعة الصفحة
function printPage() {
  window.print();
}

// ✅ الرجوع للخلف
function goBack() {
  history.back();
}
