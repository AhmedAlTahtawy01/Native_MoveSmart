document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "PatrolsSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }

  // جلب ID الدورية من الرابط
  function getPatrolIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  // جلب بيانات الدورية من الـ API
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

  // جلب بيانات الباص المرتبط بالدورية
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

  // جلب بيانات السائق المرتبط بالباص
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

  // جلب الموظفين المشتركين في الباص (الدورية)
  async function fetchEmployeesByBus(busID) {
    try {
      const res = await fetch(`https://movesmartapi.runasp.net/api/Employees/WhoAreUsingBus/${busID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("فشل في جلب الموظفين المشتركين");
      const data = await res.json();
      return data.$values || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  // دالة مساعدة لحالة السيارة
  function getVehicleStatusText(status) {
    switch (status) {
      case 0: return "متاحة";
      case 1: return "مشغولة";
      case 2: return "صيانة";
      default: return "غير معروف";
    }
  }

  // عرض بيانات الدورية في الصفحة
  async function displayPatrolDetails() {
    const patrolId = getPatrolIdFromUrl();
    if (!patrolId) return;

    const patrol = await fetchPatrolById(patrolId);
    if (!patrol) return;

    // تعبئة بيانات الدورية الأساسية
    document.getElementById("patrol-id").value = patrol.patrolID || "";
    document.getElementById("patrol-desc").value = patrol.description || "";
    document.getElementById("patrol-moving").value = patrol.movingAt || "";
    document.getElementById("patrol-duration").value = patrol.approximatedTime || "";

    // جلب بيانات الباص
    let bus = null, vehicle = null, driver = null;
    if (patrol.busID) {
      bus = await fetchBusById(patrol.busID);
      vehicle = bus?.vehicle || null;
    }

    // جلب بيانات السائق
    if (vehicle) {
      // إذا كان السائق موجود ككائن داخل السيارة
      if (vehicle.driver) {
        driver = vehicle.driver;
      }
      // إذا كان هناك driverID فقط
      else if (vehicle.driverID) {
        driver = await fetchDriverById(vehicle.driverID);
      }
    }

    // تعبئة بيانات السيارة
    document.getElementById("vehicle-plate").value = vehicle?.plateNumbers || "";
    document.getElementById("vehicle-brand").value = vehicle?.brandName || "";
    document.getElementById("vehicle-model").value = vehicle?.modelName || "";
    document.getElementById("vehicle-status").value = getVehicleStatusText(vehicle?.status);

    // تعبئة بيانات السائق
    document.getElementById("driver-name").value = driver?.name || vehicle?.driverName || "";
    document.getElementById("driver-phone").value = driver?.phone || vehicle?.driverPhone || "";

    // بيانات الباص
    document.getElementById("bus-available").value = bus?.availableSpace ?? "";
    document.getElementById("bus-seats").value = bus?.totalSeats ?? "";

    // جلب وعرض الموظفين المشتركين في الدورية (الباص)
    let employees = [];
    if (bus?.busID) {
      employees = await fetchEmployeesByBus(bus.busID);
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

  // نفذ عند التحميل
  await displayPatrolDetails();
});

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

function printPage() {
  window.print();
}

function generateReport() {
  alert("يتم توليد التقرير الآن...");
}

function goBack() {
  history.back();
}
