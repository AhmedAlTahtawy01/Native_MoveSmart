document.addEventListener("DOMContentLoaded", function () {
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
});

let allPatrols = [];
let busesMap = {};
let driversMap = {}; // خريطة السائقين حسب vehicleID

async function fetchPatrols() {
  try {
    const patrolsRes = await fetch(
      "https://movesmartapi.runasp.net/api/Patrols/All",
      { headers }
    );
    if (!patrolsRes.ok) throw new Error("فشل تحميل الدوريات");
    const patrolsData = await patrolsRes.json();
    const patrols = patrolsData.$values || [];
    allPatrols = patrols;

    await fetchBusesMap();
    await fetchDriversMap(); // جلب السائقين

    renderPatrols(allPatrols);
  } catch (err) {
    console.error("فشل في تحميل الدوريات:", err);
  }
}

async function fetchDriversMap() {
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Drivers/All", {
      headers,
    });
    if (!res.ok) throw new Error("فشل تحميل السائقين");
    const driversData = await res.json();
    const drivers = driversData.$values || [];
    driversMap = {};
    drivers.forEach((driver) => {
      if (driver.vehicleID) {
        driversMap[driver.vehicleID] = driver;
      }
    });
  } catch (err) {
    console.error("فشل تحميل قائمة السائقين:", err);
  }
}

async function fetchBusesMap() {
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Buses/All", {
      headers,
    });
    if (!res.ok) throw new Error("فشل تحميل الباصات");

    const busesData = await res.json();
    const buses = busesData.$values || [];
    console.log("Loaded buses:", buses);

    buses.forEach((bus) => {
      busesMap[bus.busID] = bus;
    });
  } catch (err) {
    console.error("فشل تحميل قائمة الباصات:", err);
  }
}

function renderPatrols(patrols) {
  const container = document.getElementById("patrols-container");
  container.innerHTML = "";
  document.getElementById("total-count").textContent = patrols.length;

  patrols.forEach((patrol) => {
    const bus = busesMap[patrol.busID];
    const vehicle = bus?.vehicle;

    const vehicleStatus = vehicle?.status;
    const statusText = getVehicleStatusText(vehicleStatus);

    // جلب السائق المرتبط بالسيارة
    let driverName = "غير متوفر";
    let driverStatus = "غير متوفر";
    if (vehicle && driversMap[vehicle.vehicleID]) {
      driverName = driversMap[vehicle.vehicleID].name || "غير متوفر";
      driverStatus = getDriverStatusText(driversMap[vehicle.vehicleID].status);
    }

    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => {
      window.location.href = `../patrol-Managment/patrolDetails.html?id=${patrol.patrolID}`;
    };

    card.innerHTML = `
      <span> ${patrol.patrolID}</span>
      <span> ${patrol.movingAt}</span>
      <span> ${vehicle?.plateNumbers || "غير متوفر"}</span>
      <span> ${bus?.availableSpace ?? "؟"}</span>
      <span> ${statusText}</span>
      <span> ${driverName} (${driverStatus})</span>
    `;
    container.appendChild(card);
  });
}

function getVehicleStatusText(status) {
  switch (status) {
    case 0:
      return "متاحة";
    case 1:
      return "مشغولة";
    case 2:
      return "صيانة";
    default:
      return "غير معروف";
  }
}

function getDriverStatusText(status) {
  switch (status) {
    case 0:
      return "متاح";
    case 1:
      return "مشغول";
    case 2:
      return "موقوف";
    default:
      return "غير معروف";
  }
}

function getPatrolStatus(patrol) {
  const start = patrol.movingAt;
  const duration = patrol.approximatedTime;
  if (!start || !duration) return "غير محدد";

  const now = new Date();
  const [hours, minutes] = start.split(":").map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  return now < endTime ? "قيد التنفيذ" : "منتهية";
}

document.getElementById("search").addEventListener("input", () => {
  const query = document.getElementById("search").value.toLowerCase();
  const filtered = allPatrols.filter(
    (p) =>
      p.description?.toLowerCase().includes(query) ||
      String(p.patrolID).includes(query)
  );
  renderPatrols(filtered);
});

document.getElementById("filter-select").addEventListener("change", () => {
  const value = document.getElementById("filter-select").value;
  let filtered = allPatrols;

  if (value === "active") {
    filtered = allPatrols.filter((p) => getPatrolStatus(p) === "قيد التنفيذ");
  } else if (value === "finished") {
    filtered = allPatrols.filter((p) => getPatrolStatus(p) === "منتهية");
  }

  renderPatrols(filtered);
});

function openAddPatrolPop() {
  document.getElementById("add-pop").classList.remove("hidden");
}
function closeAddPatrolPop() {
  document.getElementById("add-pop").classList.add("hidden");
}

async function fetchBusesForSelect() {
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Buses/all", {
      headers,
    });
    const busesData = await res.json();
    const buses = busesData.$values || [];

    const select = document.getElementById("bus-select");
    buses.forEach((bus) => {
      const option = document.createElement("option");
      option.value = bus.busID;
       option.textContent = `${bus.vehicle.brandName} ${bus.vehicle.modelName} - ${bus.vehicle.plateNumbers}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("فشل تحميل الباصات للاختيار:", err);
  }
}

async function submitNewPatrol() {
  const desc = document.getElementById("patrol-description").value;
  const time = document.getElementById("patrol-moving-time").value;
  const duration = parseInt(document.getElementById("patrol-approx-time").value);
  const busID = parseInt(document.getElementById("bus-select").value);

  if (!desc || !time || isNaN(duration) || isNaN(busID)) {
    alert("يرجى ملء جميع الحقول");
    return;
  }

  const body = JSON.stringify({
    description: desc,
    movingAt: time,
    approximatedTime: duration,
    busID,
  });

  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Patrols", {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) throw new Error("فشل إضافة الدورية");

    alert("تمت إضافة الدورية بنجاح");
    closeAddPatrolPop();
    fetchPatrols();
  } catch (err) {
    alert("حدث خطأ أثناء إضافة الدورية");
    console.error(err);
  }
}

fetchPatrols();
fetchBusesForSelect();
