// Get authentication data from localStorage (only if not already declared)
if (typeof token === 'undefined') {
  var token = localStorage.getItem('token');
}
if (typeof userRole === 'undefined') {
  var userRole = localStorage.getItem('userRole');
}
if (typeof userName === 'undefined') {
  var userName = localStorage.getItem('userName');
}

console.log('=== CarList.js Authentication Debug ===');
console.log('Token exists:', !!token);
console.log('User Role:', userRole);
console.log('User Name:', userName);
console.log('=====================================');

// Navigation functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log('DOM Content Loaded - Checking authentication...');

  if (!token) {
    console.error('No token found - redirecting to login');
    window.location.href = "../../Pages/Login.html";
    return;
  }

  console.log('Authentication successful - loading cars...');

  // Add click event listener to the page title for navigation
  const pageTitle = document.querySelector("h2");
  if (pageTitle) {
    pageTitle.style.cursor = "pointer";
    pageTitle.addEventListener("click", function () {
      window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
    });
  }
});

// Cleanup function to clear global variables when script is reloaded
window.clearScriptVariables = function() {
  if (typeof allCars !== 'undefined') {
    delete window.allCars;
  }
  if (typeof allowedRoles !== 'undefined') {
    delete window.allowedRoles;
  }
};

// Check if variables already exist to prevent redeclaration
if (typeof allCars === 'undefined') {
  var allCars = []; // كل العربيات (فيكيلز وباصات)
}

// الرولز المسموح لها تشوف الكل
if (typeof allowedRoles === 'undefined') {
  var allowedRoles = [
    "SuperUser",
    "HospitalManager",
    "GeneralManager",
    "GeneralSupervisor",
    "AdminstrativeSupervisor",
    "PatrolsSupervisor",
    "WorkshopSupervisor",
  ];
}

// تحميل السيارات والباصات معًا
async function loadCars() {

  try {
    // جلب الفيكيلز
    let vehicles = [];
    try {
      const vRes = await fetch(
        "https://movesmartapi.runasp.net/api/Vehicles/All",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (vRes.ok) {
        const vData = await vRes.json();
        vehicles = Array.isArray(vData.$values) ? vData.$values : [];
      }
    } catch (e) {
      vehicles = [];
    }

    // جلب الباصات
    let buses = [];
    try {
      const bRes = await fetch("https://movesmartapi.runasp.net/api/Buses/All", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        buses = Array.isArray(bData.$values) ? bData.$values : [];
      }
    } catch (e) {
      buses = [];
    }

    // دمج البيانات
    const busesMapped = buses.map((bus) => ({
      ...bus.vehicle,
      isBus: true,
      busID: bus.busID,
      capacity: bus.capacity,
      availableSpace: bus.availableSpace,
    }));
    const vehiclesMapped = vehicles.map((v) => ({
      ...v,
      isBus: false,
    }));

    // فقط PatrolsSupervisor يشوف الباصات فقط
    if (userRole === "PatrolsSupervisor") {
      allCars = busesMapped;
      const typeFilter = document.getElementById("type-filter");
      if (typeFilter) {
        typeFilter.value = "bus";
        typeFilter.disabled = true;
      }
    } else {
      allCars = [...vehiclesMapped, ...busesMapped];
      const typeFilter = document.getElementById("type-filter");
      if (typeFilter) {
        typeFilter.value = "all";
        typeFilter.disabled = false;
      }
    }

    displayCars(allCars);
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  }
}

// البحث والفلترة
function searchCars() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  filterCars(searchTerm);
}

function filterCars(searchTerm = "") {
  const statusVal = document.getElementById("filter-select").value;
  const typeVal = document.getElementById("type-filter").value;

  let filtered = allCars;

  // فلترة النوع
  if (typeVal === "vehicle") filtered = filtered.filter((c) => !c.isBus);
  else if (typeVal === "bus") filtered = filtered.filter((c) => c.isBus);

  // فلترة الحالة
  if (statusVal !== "all")
    filtered = filtered.filter((c) => String(c.status) === statusVal);

  // فلترة البحث
  if (searchTerm) {
    filtered = filtered.filter(
      (car) =>
        (car.vehicleID && String(car.vehicleID).includes(searchTerm)) ||
        (car.brandName && car.brandName.toLowerCase().includes(searchTerm)) ||
        (car.modelName && car.modelName.toLowerCase().includes(searchTerm)) ||
        (car.vehicleType !== undefined &&
          String(car.vehicleType).includes(searchTerm)) ||
        (car.associatedHospital &&
          car.associatedHospital.toLowerCase().includes(searchTerm)) ||
        (car.status !== undefined && String(car.status).includes(searchTerm)) ||
        (car.plateNumbers &&
          car.plateNumbers.toLowerCase().includes(searchTerm))
    );
  }

  displayCars(filtered);
}

// عرض السيارات والباصات
function displayCars(filteredList) {
  const carstatus = {
    1: "متاحة",
    2: "مشغولة",
    3: "قيد الصيانة",
  };
  const carType = {
    0: "سيدان",
    1: "واحد كبينة",
    2: "ثنائي كبينة",
    3: "شاحنة نقل",
    4: "ميكروباص",
    5: "ميني باص",
    6: "أتوبيس",
    7: "اسعاف",
  };
  const container = document.getElementById("cars-container");
  container.innerHTML = "";

  filteredList.forEach((car) => {
    const carCard = document.createElement("div");
    carCard.classList.add("card");
    carCard.style.cursor = "pointer";

    const carLink = `../../Pages/car-Managment/carDetails.html?id=${car.isBus ? car.busID : car.vehicleID}&type=${car.isBus ? "bus" : "vehicle"}`;
    
    // Debug logging
    console.log("Car debug:", {
      isBus: car.isBus,
      vehicleID: car.vehicleID,
      busID: car.busID,
      plateNumbers: car.plateNumbers,
      generatedLink: carLink
    });
    
    carCard.onclick = () => {
      window.location.href = carLink;
    };

    if (car.isBus) {
      carCard.innerHTML = `
        <p><strong></strong> ${car.plateNumbers}</p>
        <p><strong></strong> ${car.brandName}</p>
        <p><strong></strong> ${car.modelName}</p>
        <p><strong></strong> ${carType[car.vehicleType] || "غير معروف"}</p>
        <p><strong></strong> ${car.associatedHospital}</p>
        <p class="status ${car.status === 1
          ? "active"
          : car.status === 3
            ? "maintenance"
            : "inactive"
        }">
          <strong></strong> ${carstatus[car.status] || "غير معروف"}
        </p>
        <p>السعة: ${car.capacity} | المتاح: ${car.availableSpace}</p>
      `;
    } else {
      carCard.innerHTML = `
        <p><strong></strong> ${car.plateNumbers}</a></p>
        <p><strong></strong> ${car.brandName}</p>
        <p><strong></strong> ${car.modelName}</p>
        <p><strong></strong> ${carType[car.vehicleType] || "غير معروف"}</p>
        <p><strong></strong> ${car.associatedHospital}</p>
        <p class="status ${car.status === 1
          ? "active"
          : car.status === 3
            ? "maintenance"
            : "inactive"
        }">
          <strong></strong> ${carstatus[car.status] || "غير معروف"}
        </p>
      `;
    }

    container.appendChild(carCard);
  });

  document.getElementById("total-count").innerText = filteredList.length;
}

// إظهار/إخفاء حقول الباص في البوب أب
function toggleAddType() {
  const type = document.getElementById("add-type-select").value;
  document.getElementById("vehicle-fields").style.display = "block";
  document.getElementById("bus-fields").style.display =
    type === "bus" ? "block" : "none";
}

// إضافة سيارة أو باص
function submitVehicle() {
  const type = document.getElementById("add-type-select").value;
  if (!validate(type)) return;

  if (type === "vehicle") {
    // نفس الكود القديم
    const carData = {
      vehicleID: 0,
      brandName: document.getElementById("car-brand").value,
      modelName: document.getElementById("car-model").value,
      plateNumbers: document.getElementById("car-plate").value,
      vehicleType: parseInt(document.getElementById("car-type").value),
      associatedHospital: document.getElementById("car-hospital").value,
      associatedTask: document.getElementById("car-task").value,
      status: parseInt(document.getElementById("car-status").value),
      totalKilometersMoved: parseInt(
        document.getElementById("car-kilometers").value
      ),
      fuelType: parseInt(document.getElementById("fuel-type").value),
      fuelConsumptionRate: parseFloat(
        document.getElementById("fuel-consumption").value
      ),
      oilConsumptionRate: parseFloat(
        document.getElementById("oil-consumption").value
      ),
    };
    fetch("https://movesmartapi.runasp.net/api/Vehicles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(carData),
    })
      .then((response) => response.json())
      .then((data) => {
        closePop();
        refreshData();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else if (type === "bus") {
    // أضف الباص
   const vehicleData = {
      vehicleID: 0,
      brandName: document.getElementById("car-brand").value,
      modelName: document.getElementById("car-model").value,
      plateNumbers: document.getElementById("car-plate").value,
      vehicleType: parseInt(document.getElementById("car-type").value),
      associatedHospital: document.getElementById("car-hospital").value,
      associatedTask: document.getElementById("car-task").value,
      status: parseInt(document.getElementById("car-status").value),
      totalKilometersMoved: parseInt(
        document.getElementById("car-kilometers").value
      ),
      fuelType: parseInt(document.getElementById("fuel-type").value),
      fuelConsumptionRate: parseFloat(
        document.getElementById("fuel-consumption").value
      ),
      oilConsumptionRate: parseFloat(
        document.getElementById("oil-consumption").value
      ),
    };
    const busData = {
      busID: 0,
      capacity: parseInt(document.getElementById("bus-capacity").value),
      availableSpace: parseInt(
        document.getElementById("bus-available-space").value
      ),
      vehicle: vehicleData,
    };
     console.log(busData);
    fetch("https://movesmartapi.runasp.net/api/Buses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(busData),
    })
      .then((response) => response.json())
      .then((data) => {
        closePop();
        refreshData();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

// التحقق من صحة البيانات
function showError(id, message) {
  document.getElementById(`error-${id}`).innerText = message || "";
}

function validate(type = "vehicle") {
  const carBrand = document.getElementById("car-brand").value.trim();
  const carModel = document.getElementById("car-model").value.trim();
  const carNumber = document.getElementById("car-plate").value.trim();
  const hospital = document.getElementById("car-hospital").value.trim();
  const task = document.getElementById("car-task").value.trim();

  const clearAllErrors = () => {
    showError("car-brand", "");
    showError("car-model", "");
    showError("car-plate", "");
    showError("car-hospital", "");
    showError("car-task", "");
    showError("bus-capacity", "");
    showError("bus-available-space", "");
  };

  clearAllErrors();

  let isValid = true;

  if (carBrand.length < 2) {
    isValid = false;
    showError("car-brand", "البراند نيم يجب أن يكون 2 أحرف على الأقل.");
  }

  if (!carModel) {
    isValid = false;
    showError("car-model", "الموديل نيم لا يمكن أن يكون فارغًا.");
  }

  const plateRegex = /^[أ-يA-Za-z]{3}\d{4}$/; // 3 حروف + 4 أرقام
  if (!plateRegex.test(carNumber)) {
    isValid = false;
    showError("car-plate", "رقم السيارة يجب أن يتكون من 3 حروف و4 أرقام.");
  }

  if (!hospital) {
    isValid = false;
    showError("car-hospital", "يرجى تحديد المستشفى.");
  }

  if (!task) {
    isValid = false;
    showError("car-task", "يرجى تحديد المهمة المرتبطة.");
  }

  if (type === "bus") {
    const capacity = parseInt(document.getElementById("bus-capacity").value);
    const availableSpace = parseInt(document.getElementById("bus-available-space").value);

    if (isNaN(capacity) || capacity <= 0) {
      isValid = false;
      showError("bus-capacity", "السعة يجب أن تكون رقمًا موجبًا.");
    }

    if (isNaN(availableSpace) || availableSpace < 0) {
      isValid = false;
      showError("bus-available-space", "المقاعد المتاحة يجب ألا تكون سالبة.");
    }
  }

  return isValid;
}


// إظهار نافذة الإضافة
function openPop() {
  document.getElementById("add-pop").classList.remove("hidden");
  document.getElementById("add-type-select").value = "vehicle";
  toggleAddType();
}
// إغلاق نافذة الإضافة
function closePop() {
  document.getElementById("add-pop").classList.add("hidden");
}
// إغلاق نافذة الإضافة عند الضغط على زر الإغلاق
function refreshData() {
  loadCars(); // إعادة تحميل السيارات من الـ API
}

// تحميل البيانات عند بداية الصفحة
loadCars();
