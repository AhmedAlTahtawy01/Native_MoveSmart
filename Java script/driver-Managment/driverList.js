// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    window.location.href = '../../Login.html';
    return;
  }

  // Add click event listener to the page title for navigation
  const pageTitle = document.querySelector('h2');
  pageTitle.style.cursor = 'pointer';
  pageTitle.addEventListener('click', function () {
    window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
  });
});

// let drivers = [];

function openPop() {
  document.getElementById("add-pop").classList.remove("hidden");
}

function closePop() {
  document.getElementById("add-pop").classList.add("hidden");
}

async function submitDriver() {
  const saveButton = document.querySelector(".pop-actions button:first-child");
  saveButton.disabled = true;

  const name = document.getElementById("driver-name").value.trim();
  const nationalNo = document.getElementById("nationalNum").value.trim();
  const phone = document.getElementById("driver-phone").value.trim();
  const vehicleID = parseInt(document.getElementById("vehicleID").value);

  const statusText = document.getElementById("driver-status").value;
  const statusMap = {
    "متاح": 1,
    "غائب": 2,
    "قيد العمل": 3,
  };
  const status = statusMap[statusText];

  if (!validate()) {
    saveButton.disabled = false;
    return;
  }

  const newDriver = {
    driverID: 0,
    name,
    nationalNo,
    status,
    phone,
    vehicleID,
  };

  try {
    await addDriver(newDriver); // 🚀 المحاولة

    // 🧼 تنظيف الحقول
    document.getElementById("driver-name").value = "";
    document.getElementById("nationalNum").value = "";
    document.getElementById("driver-status").value = "";
    document.getElementById("driver-phone").value = "";
    document.getElementById("vehicleID").value = "";

    // ✅ عرض رسالة نجاح
    const successBox = document.getElementById("success-message");
    if (successBox) {
      successBox.classList.remove("hidden");
      setTimeout(() => {
        successBox.classList.add("hidden");
      }, 3000);
    }

    closePop();

  } catch (error) {
    console.error("فشل في إضافة السائق:", error);

    // ❌ رسالة تنبيه بالفشل
    alert("حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.");
  } finally {
    saveButton.disabled = false; // ✅ إعادة التمكين
  }
}



async function loadDriver() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Drivers/All",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    const driversList = Array.isArray(data.$values) ? data.$values : [];

    drivers = driversList;
    displayDriver(driversList);
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  }
}

function searchDriver() {
  const searchTerm = document.getElementById("search").value.toLowerCase();

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm) ||
      driver.phone.includes(searchTerm) ||
      String(driver.vehicleID).includes(searchTerm) ||
      String(driver.status).includes(searchTerm)
  );

  displayDriver(filteredDrivers);
}

function filterDriver() {
  const selectedStatus = document.getElementById("filter-select").value;

  if (selectedStatus === "all") {
    displayDriver(drivers);
    return;
  }

  const filteredDrivers = drivers.filter(
    (driver) => String(driver.status) === selectedStatus
  );

  displayDriver(filteredDrivers);
}

function displayDriver(list) {
  const container = document.getElementById("driver-container");
  container.innerHTML = "";

  const driverStatusMap = {
    1: "متاح",     // Available
    2: "غائب",     // Absent
    3: "قيد العمل"  // Working
  };

  list.forEach((driver) => {
    const driverCard = document.createElement("div");
    driverCard.classList.add("card");

    driverCard.innerHTML = `
  <p><strong></strong> ${driver.name}</p>
  <p class="status ${driver.status === 1 ? "active" : driver.status === 2 ? "absent" : "working"}">
    <strong></strong> ${driverStatusMap[driver.status] || "غير معروف"}
  </p>
  <p><strong></strong> ${driver.phone}</p>
  <p><strong></strong> ${driver.vehicleID}</p>
`;

    driverCard.style.cursor = "pointer";
    driverCard.addEventListener("click", () => {
      window.location.href = `../../Pages/driver-Managment/driverDetails.html?id=${driver.driverID}`;
    });

    container.appendChild(driverCard);
  });

  document.getElementById("total-count").innerText = list.length;
}

function showFieldError(id, message) {
  const fieldError = document.getElementById(`error-${id}`);
  if (fieldError) {
    fieldError.innerText = message || "";
  }
}

function validate() {
  const name = document.getElementById("driver-name").value.trim();
  const nationalNo = document.getElementById("nationalNum").value.trim();
  const status = document.getElementById("driver-status").value.trim();
  const phone = document.getElementById("driver-phone").value.trim();
  const vehicleID = document.getElementById("vehicleID").value.trim();

  let isValid = true;

  // Clear previous errors
  ["driver-name", "nationalNum", "driver-status", "driver-phone", "vehicleID"].forEach(id => {
    showFieldError(id, "");
  });

  if (!name || name.length < 2) {
    isValid = false;
    showFieldError("driver-name", "الاسم يجب أن يكون على الأقل حرفين.");
  }

  if (!/^\d{14}$/.test(nationalNo)) {
    isValid = false;
    showFieldError("nationalNum", "الرقم القومي يجب أن يكون 14 رقمًا.");
  }

  if (!status) {
    isValid = false;
    showFieldError("driver-status", "يرجى اختيار حالة السائق.");
  }

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    isValid = false;
    showFieldError("driver-phone", "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقم.");
  }

  if (!vehicleID) {
    isValid = false;
    showFieldError("vehicleID", "يرجى اختيار رقم السيارة.");
  }

  return isValid;
}


async function loadCars() {

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Vehicles/All",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();

    console.log("البيانات المستلمة:", data);

    const cars = Array.isArray(data.$values) ? data.$values : [];

    displayCars(cars);
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  }
}

function displayCars(cars) {
  const select = document.getElementById("vehicleID");
  select.innerHTML = '<option value="">-- اختر السيارة --</option>';

  cars.forEach((car) => {
    const option = document.createElement("option");
    option.value = car.vehicleID;
    option.textContent = car.plateNumbers; // غيّرها حسب اسم الخاصية الفعلي من الـ API
    select.appendChild(option);
  });
}

async function addDriver(newDriver) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/drivers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newDriver),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error Text:", errorText);
      throw new Error("⚠️ خطأ في إضافة السائق");
    }

    loadDriver(); // تحديث القائمة
  } catch (error) {
    console.error("❌ خطأ أثناء الإضافة:", error);

    // مثال: عرض رسالة تحت الرقم القومي
    const errTarget = document.getElementById("error-nationalNum");
    if (errTarget) {
      errTarget.innerText = "⚠️ لم يتم حفظ البيانات، حاول مرة أخرى.";
    }
  }
}

function refreshData() {
  loadDriver();
}

loadCars();
loadDriver();
