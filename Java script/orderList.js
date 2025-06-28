// Navigation functionality
console.log("Role from localStorage:", localStorage.getItem("userRole"));
const userRole = localStorage.getItem("userRole");
const token = localStorage.getItem("token");
// API URLs
const apiUrl = "https://movesmartapi.runasp.net/api/v1/JobOrder";
const vehicleApiUrl = "https://movesmartapi.runasp.net/api/Vehicles/All";
const driverApiUrl = "https://movesmartapi.runasp.net/api/Drivers/All";

document.addEventListener("DOMContentLoaded", function () {
  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  // Add click event listener to the page title for navigation
  const pageTitle = document.querySelector("title");
  document.title = "صفحة الطلبات";
  const header = document.createElement("h1");
  header.className = "page-title";
  header.textContent = "صفحة الطلبات";
  header.style.cursor = "pointer";
  header.addEventListener("click", function () {
    window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
  });
  document.body.insertBefore(header, document.body.firstChild);
});

// Helper function to safely hide elements
function hideElementIfExists(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = "none";
}
// Function to decode JWT token and extract user ID
function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Decode JWT token (split by '.' and decode the payload part)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub; // Extract user ID from 'sub' claim
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Function to automatically calculate status based on current time vs start/end times
function calculateStatusByTime() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const startTimeElement = document.getElementById("startTime");
  const endTimeElement = document.getElementById("endTime");

  if (!startTimeElement.value || !endTimeElement.value) {
    return 1; // Default to "قادمة" if times are not set
  }

  // Parse start and end times
  const [startHour, startMin] = startTimeElement.value.split(":").map(Number);
  const [endHour, endMin] = endTimeElement.value.split(":").map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Calculate status based on current time
  if (currentTime < startTime) {
    return 1;
  } else if (currentTime >= startTime && currentTime < endTime) {
    return 3;
  } else {
    return 2;
  }
}

// Function to update status based on time comparison
function updateStatusByTime() {
  const statusElement = document.getElementById("status");
  const calculatedStatus = calculateStatusByTime();
  statusElement.value = calculatedStatus;
}

switch (userRole) {
  case "HospitalManager":
    document.getElementById("jobOrder-Btn").style.display = "none";
    break;
  default:
    break;
}

document.getElementById("jobOrder").addEventListener("click", showJobOrders);

// Handle role-based access for application cards
document.addEventListener("DOMContentLoaded", function () {
  // Define which roles can access which applications
  const rolePermissions = {
    SuperUser: [
      "jobOrder",
      "purchaseOrder",
      "payOrder",
      "maintananceOrder",
      "missionOrder",
    ],
    AdministrativeSupervisor: [
      "jobOrder",
      "purchaseOrder",
      "payOrder",
      "maintananceOrder",
    ],
    HospitalManager: ["jobOrder", "missionOrder"],
    GeneralManager: [
      "jobOrder",
      "purchaseOrder",
      "payOrder",
      "maintananceOrder",
      "missionOrder",
    ],
    GeneralSupervisor: [
      "jobOrder",
      "purchaseOrder",
      "payOrder",
      "maintananceOrder",
      "missionOrder",
    ],
    PatrolsSupervisor: ["jobOrder", "missionOrder"],
    WorkshopSupervisor: [
      "jobOrder",
      "maintananceOrder",
      "purchaseOrder",
      "WithdrawOrder",
    ],
  };

  // Get all application cards
  const applicationCards = document.querySelectorAll(".application-card");

  applicationCards.forEach((card) => {
    const cardId = card.id;
    const userPermissions = rolePermissions[userRole] || [];

    if (!userPermissions.includes(cardId)) {
      // Disable card for unauthorized users
      card.classList.add("disabled");
      card.style.opacity = "0.6";
      card.style.cursor = "not-allowed";

      // Update badge to show restricted access
      const badge = card.querySelector(".card-badge");
      if (badge && !badge.classList.contains("active")) {
        badge.textContent = "غير مسموح";
        badge.style.background = "#dc3545";
      }

      // Remove click functionality
      card.onclick = function (e) {
        e.preventDefault();
        showAccessDeniedMessage(card.querySelector(".card-title").textContent);
      };
    } else if (cardId === "jobOrder") {
      // Job order is available - keep existing functionality
      card.onclick = showJobOrders;
    } else {
      // Other applications - show coming soon message
      card.onclick = function () {
        showComingSoonMessage(card.querySelector(".card-title").textContent);
      };
    }
  });
});

function showAccessDeniedMessage(applicationName) {
  alert(
    `عذراً، غير مسموح لك بالوصول إلى ${applicationName}. تحتاج صلاحيات أعلى للوصول لهذه الخدمة.`
  );
}

function showComingSoonMessage(applicationName) {
  alert(`${applicationName} قيد التطوير حالياً. سيتم إتاحة هذه الخدمة قريباً.`);
}

function showJobOrders() {
  document.getElementById("jobOrderPopup").classList.remove("hidden");
  fetchJobOrders();
}

function closeJobOrderPopup() {
  document.getElementById("jobOrderPopup").classList.add("hidden");
}

function openAddJobOrderForm() {
  document.getElementById("addJobOrderPopup").classList.remove("hidden");

  // Automatically set the user ID from the token
  const userId = getUserIdFromToken();
  if (userId) {
    document.getElementById("createdByUserID").value = userId;
  }

  // Set current date for start and end date fields
  const currentDate = new Date().toISOString().slice(0, 10);
  document.getElementById("startDate").value = currentDate;
  document.getElementById("endDate").value = currentDate;

  const now = new Date();
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  if (!document.getElementById("startTime").value) {
    document.getElementById("startTime").value = currentTime;
  }

  if (!document.getElementById("endTime").value) {
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    document.getElementById("endTime").value =
      endTime.getHours().toString().padStart(2, "0") +
      ":" +
      endTime.getMinutes().toString().padStart(2, "0");
  }

  setTimeout(() => {
    updateStatusByTime();

    document
      .getElementById("startTime")
      .addEventListener("change", updateStatusByTime);
    document
      .getElementById("endTime")
      .addEventListener("change", updateStatusByTime);
  }, 100);

  populateVehicleDropdown();
  populateDriverDropdown();
}

function closeAddJobOrderForm() {
  document.getElementById("addJobOrderPopup").classList.add("hidden");
}

async function fetchJobOrders() {
  try {
    const token = localStorage.getItem("token");
    const [vehicles, drivers] = await Promise.all([
      fetchVehicles(),
      fetchDrivers(),
    ]);
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      if (res.status === 403) {
        console.error("المستخدم غير مصرح له بالوصول لأوامر الشغل");
        document.getElementById("jobOrdersContainer").innerHTML =
          '<p style="text-align: center; color: red;">غير مصرح لك بعرض أوامر الشغل</p>';
        return;
      } else if (res.status === 401) {
        console.error("انتهت صلاحية الجلسة");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "../Login.html";
        return;
      } else {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    }

    const data = await res.json();
    const orders = data.$values || [];
    console.log("Fetched Job Orders:", orders);

    // ربط اسم السائق ورقم اللوحة بالطلب
    orders.forEach((order) => {
      const vehicle = vehicles.find(
        (v) => v.vehicleID === order.vehicleID || v.id === order.vehicleID
      );
      const driver = drivers.find(
        (d) => d.driverID === order.driverId || d.id === order.driverId
      );
      order.plateNumbers = vehicle ? vehicle.plateNumbers : "غير محدد";
      order.driverName = driver ? driver.name : "غير محدد";
    });

    renderJobOrderCards(orders);
  } catch (err) {
    console.error("فشل في جلب أوامر الشغل", err);
    document.getElementById("jobOrdersContainer").innerHTML =
      '<p style="text-align: center; color: red;">حدث خطأ في جلب أوامر الشغل</p>';
  }
}

function renderJobOrderCards(orders) {
  const container = document.getElementById("jobOrdersContainer");
  container.innerHTML = "";

  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style = "padding: 10px; background: #f4f4f4; cursor: pointer;";
    card.innerHTML = `
      <p><strong>رقم الأمر:</strong> ${order.orderId}</p>
      <p><strong>الحالة:</strong> ${mapjobOrderStatus(
        order.application.status
      )}</p>
      <p><strong>تاريخ البداية:</strong> ${new Date(
        order.startDate
      ).toLocaleString()}</p>
    `;
    card.onclick = () => showJobOrderDetails(order);
    container.appendChild(card);
  });
}

function showJobOrderDetails(order) {
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-content job-details-popup">
      <div class="details-header">
        <h2>تفاصيل أمر الشغل</h2>
        <button type="button" class="close-btn" onclick="closePopupDetails(this)">
          ✕
        </button>
      </div>
      
      <div class="details-content">
        <!-- Basic Information -->
        <div class="details-section">
          <h3 class="details-section-title">معلومات عامة</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">رقم الأمر:</span>
              <span class="detail-value">${order.orderId}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الحالة:</span>
              <span class="detail-value badge-status ${getStatusClass(
                order.application.status
              )}">${mapjobOrderStatus(order.application.status)}</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">الوصف:</span>
              <span class="detail-value">${
                order.application.applicationDescription
              }</span>
            </div>
          </div>
        </div>

        <!-- Vehicle & Driver Information -->
        <div class="details-section">
          <h3 class="details-section-title">معلومات السيارة والسائق</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">السيارة:</span>
              <span class="detail-value">${
                order.plateNumbers || order.vehicleId
              }</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">السائق:</span>
              <span class="detail-value">${
                order.driverName || order.driverId
              }</span>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">الوجهة:</span>
              <span class="detail-value">${order.destination}</span>
            </div>
          </div>
        </div>

        <!-- Time Information -->
        <div class="details-section">
          <h3 class="details-section-title">معلومات التوقيت</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">تاريخ البداية:</span>
              <span class="detail-value">${new Date(
                order.startDate
              ).toLocaleDateString("ar-SA")}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">وقت البداية:</span>
              <span class="detail-value">${
                order.startTime ||
                new Date(order.startDate).toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تاريخ النهاية:</span>
              <span class="detail-value">${new Date(
                order.endDate
              ).toLocaleDateString("ar-SA")}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">وقت النهاية:</span>
              <span class="detail-value">${
                order.endTime ||
                new Date(order.endDate).toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }</span>
            </div>
          </div>
        </div>

        <!-- Odometer Information -->
        <div class="details-section">
          <h3 class="details-section-title">قراءة العداد</h3>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">عداد قبل:</span>
              <span class="detail-value">${
                order.odometerBefore
                  ? order.odometerBefore.toLocaleString()
                  : "غير محدد"
              } كم</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">عداد بعد:</span>
              <span class="detail-value">${
                order.odometerAfter
                  ? order.odometerAfter.toLocaleString()
                  : "غير محدد"
              } كم</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المسافة المقطوعة:</span>
              <span class="detail-value highlight">${
                order.odometerAfter && order.odometerBefore
                  ? (
                      order.odometerAfter - order.odometerBefore
                    ).toLocaleString()
                  : "غير محسوبة"
              } كم</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="details-actions">
        ${
          userRole !== "HospitalManager"
            ? `<button class="btn btn-primary" onclick='editJobOrder(${JSON.stringify(
                order
              )})'>
                <span>✏️</span> تعديل
              </button>`
            : ""
        }
        <button class="btn btn-secondary" onclick="closePopupDetails(this)">
          <span>✕</span> إغلاق
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

function closePopupDetails(btn) {
  const popup = btn.closest(".popup");
  popup.remove();
}

function editJobOrder(order) {
  closePopupDetails(event.target);
  openAddJobOrderForm();

  document.getElementById("orderId").value = order.orderId;
  document.getElementById("applicationId").value =
    order.application.applicationId;
  document.getElementById("status").value = order.application.status;
  document.getElementById("applicationType").value =
    order.application.applicationType;
  document.getElementById("applicationDescription").value =
    order.application.applicationDescription;
  document.getElementById("createdByUserID").value =
    order.application.createdByUserID;

  // Handle vehicle selection - wait for dropdown to be populated
  setTimeout(() => {
    document.getElementById("vehicleId").value = order.vehicleID;
  }, 500);

  // Handle driver selection - wait for dropdown to be populated
  setTimeout(() => {
    document.getElementById("driverId").value = order.driverId;
  }, 500);

  // Set current date for both start and end dates (readonly fields)
  const currentDate = new Date().toISOString().slice(0, 10);
  document.getElementById("startDate").value = currentDate;
  document.getElementById("endDate").value = currentDate;

  // Handle times
  document.getElementById("startTime").value = order.startTime || "00:00";
  document.getElementById("endTime").value = order.endTime || "00:00";

  // Calculate and set status automatically based on current time vs start/end times
  setTimeout(() => {
    updateStatusByTime();

    // Add event listeners for time changes to update status automatically
    document
      .getElementById("startTime")
      .addEventListener("change", updateStatusByTime);
    document
      .getElementById("endTime")
      .addEventListener("change", updateStatusByTime);
  }, 100);

  document.getElementById("destination").value = order.destination;
  document.getElementById("odometerBefore").value = order.odometerBefore || 0;
  document.getElementById("odometerAfter").value = order.odometerAfter || 0;

  // Store ID for update
  document.getElementById("jobOrderForm").dataset.editId = order.orderId;
}

async function submitJobOrder(e) {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  const token = localStorage.getItem("token");

  // Combine date and time for start and end dates
  const startDate = document.getElementById("startDate").value;
  const startTime = document.getElementById("startTime").value;
  const endDate = document.getElementById("endDate").value;
  const endTime = document.getElementById("endTime").value;

  const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
  const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

  // Get user ID from token to ensure data integrity
  const currentUserId = getUserIdFromToken();

  // Automatically calculate status based on current time vs start/end times
  const calculatedStatus = calculateStatusByTime();

  const payload = {
    orderId: editId
      ? parseInt(editId)
      : parseInt(document.getElementById("orderId").value) || 0,
    application: {
      applicationId:
        parseInt(document.getElementById("applicationId").value) || 0,
      creationDate: new Date().toISOString(),
      status: calculatedStatus, // Use calculated status instead of form value
      applicationType: parseInt(
        document.getElementById("applicationType").value
      ),
      applicationDescription: document.getElementById("applicationDescription")
        .value,
      createdByUserID: parseInt(currentUserId),
    },
    vehicleID: parseInt(document.getElementById("vehicleId").value),
    driverId: parseInt(document.getElementById("driverId").value),
    startDate: startDateTime,
    endDate: endDateTime,
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    destination: document.getElementById("destination").value,
    odometerBefore: parseInt(document.getElementById("odometerBefore").value),
    odometerAfter: parseInt(document.getElementById("odometerAfter").value),
  };

  try {
    const method = editId ? "PUT" : "POST";
    const url = editId ? `${apiUrl}/${editId}` : apiUrl;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("تم حفظ أمر الشغل بنجاح");
      closeAddJobOrderForm();
      fetchJobOrders();
      document.getElementById("jobOrderForm").reset();
      delete document.getElementById("jobOrderForm").dataset.editId;

      // Re-populate user ID and vehicle dropdown after form reset
      const userId = getUserIdFromToken();
      if (userId) {
        document.getElementById("createdByUserID").value = userId;
      }

      // Re-populate vehicle and driver dropdowns
      populateVehicleDropdown();
      populateDriverDropdown();
    } else if (response.status === 403) {
      alert("غير مصرح لك بحفظ أوامر الشغل");
    } else if (response.status === 401) {
      alert("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      window.location.href = "../Login.html";
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error("فشل في إرسال أمر الشغل", err);
    alert("حدث خطأ في حفظ أمر الشغل");
  }
}

// Helper function to map jobOrder status
function mapjobOrderStatus(code) {
  switch (code) {
    case 1:
      return "قادمة";
    case 2:
      return "منتهي";
    case 3:
      return "قيد العمل";
    case 4:
      return "ملغي";
    default:
      return "غير معروف";
  }
}

function mapStatus(code) {
  switch (code) {
    case 1:
      return "مقبول";
    case 2:
      return "مرفوض";
    case 3:
      return "قيد الانتظار";
    case 4:
      return "ملغي";
    default:
      return "غير معروف";
  }
}

// Helper function to get CSS class for status
function getStatusClass(code) {
  switch (code) {
    case 1:
      return "badge-accepted";
    case 2:
      return "badge-rejected";
    case 3:
      return "badge-pending";
    case 4:
      return "badge-canceled";
    default:
      return "badge-unknown";
  }
}

// Function to fetch vehicles from API
async function fetchVehicles() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(vehicleApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.$values || data || [];
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

// Function to fetch drivers from API
async function fetchDrivers() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(driverApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.$values || data || [];
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return [];
  }
}

// Function to populate vehicle dropdown
async function populateVehicleDropdown() {
  const vehicleSelect = document.getElementById("vehicleId");

  vehicleSelect.innerHTML = '<option value="">اختر السيارة</option>';

  vehicleSelect.innerHTML += '<option value="">جاري التحميل...</option>';

  try {
    const vehicles = await fetchVehicles();

    vehicleSelect.innerHTML = '<option value="">اختر السيارة</option>';

    const availableVehicles = vehicles.filter(
      (vehicle) => vehicle.status === 1
    );

    if (availableVehicles.length === 0) {
      vehicleSelect.innerHTML =
        '<option value="">لا توجد سيارات متاحة</option>';
      return;
    }

    availableVehicles.forEach((vehicle) => {
      const option = document.createElement("option");
      option.value = vehicle.vehicleID || vehicle.id;

      let optionText = "";
      if (vehicle.plateNumbers) {
        optionText = vehicle.plateNumbers;
        if (vehicle.model) {
          optionText += ` (${vehicle.model})`;
        }
        if (vehicle.brand) {
          optionText += ` - ${vehicle.brand}`;
        }
      } else {
        optionText = `${vehicle.vehicleID || vehicle.id}`;
        if (vehicle.model) {
          optionText += ` (${vehicle.model})`;
        }
        if (vehicle.brand) {
          optionText += ` - ${vehicle.brand}`;
        }
      }

      option.textContent = optionText;
      vehicleSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating vehicle dropdown:", error);
    vehicleSelect.innerHTML = '<option value="">خطأ في تحميل السيارات</option>';
  }
}

// Function to populate driver dropdown
async function populateDriverDropdown() {
  const driverSelect = document.getElementById("driverId");

  driverSelect.innerHTML = '<option value="">اختر السائق</option>';

  driverSelect.innerHTML += '<option value="">جاري التحميل...</option>';

  try {
    const drivers = await fetchDrivers();

    driverSelect.innerHTML = '<option value="">اختر السائق</option>';

    const availableDrivers = drivers.filter((driver) => driver.status === 1);

    if (availableDrivers.length === 0) {
      driverSelect.innerHTML =
        '<option value="">لا يوجد سائقون متاحون</option>';
      return;
    }

    availableDrivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver.driverID || driver.id;

      let optionText = driver.name || `سائق ${driver.driverID || driver.id}`;

      option.textContent = optionText;
      driverSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating driver dropdown:", error);
    driverSelect.innerHTML = '<option value="">خطأ في تحميل السائقين</option>';
  }
}

switch (userRole) {
  case "GeneralManager":
    hideElementIfExists("addPurchaseOrderBtn");
    hideElementIfExists("addWithdrawOrderBtn");
    break;

  case "GeneralSupervisor":
    hideElementIfExists("addPurchaseOrderBtn");
    hideElementIfExists("addWithdrawOrderBtn");
    break;

  case "HospitalManager":
    hideElementIfExists("addPurchaseOrderBtn");
    hideElementIfExists("addWithdrawOrderBtn");

  default:
    break;
}

// زر فتح قائمة طلبات الشراء
document
  .getElementById("purchaseOrder")
  .addEventListener("click", showPurchaseOrders);

function showPurchaseOrders() {
  document.getElementById("purchaseOrderPopup").classList.remove("hidden");
  fetchPurchaseOrders();
}

function closePurchaseOrderPopup() {
  document.getElementById("purchaseOrderPopup").classList.add("hidden");
}

// فتح فورم إضافة/تعديل طلب شراء
function openAddPurchaseOrderForm(order = null) {
  document.getElementById("addPurchaseOrderPopup").classList.remove("hidden");
  document.getElementById("purchaseOrderForm").reset();
  document.getElementById("purchaseOrderType").value = "";
  document.getElementById("sparePartsGroup").style.display = "none";
  document.getElementById("consumableGroup").style.display = "none";
  fillSparePartsSelect();
  fillConsumablesSelect();

  // إعداد بيانات التعديل
  const form = document.getElementById("purchaseOrderForm");
  if (order) {
    // تحديد النوع وملء الحقول
    if (order.application.applicationType === 4) {
      document.getElementById("purchaseOrderType").value = "spare";
      document.getElementById("sparePartsGroup").style.display = "block";
      setTimeout(() => {
        document.getElementById("sparePartSelect").value = order.requiredItem;
      }, 300);
    } else if (order.application.applicationType === 6) {
      document.getElementById("purchaseOrderType").value = "consumable";
      document.getElementById("consumableGroup").style.display = "block";
      setTimeout(() => {
        document.getElementById("consumableSelect").value = order.requiredItem;
      }, 300);
    }
    document.getElementById("requiredQuantity").value = order.requiredQuantity;
    document.getElementById("purchaseOrderDescription").value =
      order.application.applicationDescription;

    // حفظ القيم الحقيقية في dataset
    form.dataset.editId = order.id || order.orderId;
    form.dataset.orderId = order.orderId || order.id;
    form.dataset.applicationId = order.application?.applicationId;
  } else {
    form.dataset.editId = "";
    form.dataset.orderId = "";
    form.dataset.applicationId = "";
  }
}

function togglePurchaseType() {
  const type = document.getElementById("purchaseOrderType").value;
  document.getElementById("sparePartsGroup").style.display =
    type === "spare" ? "block" : "none";
  document.getElementById("consumableGroup").style.display =
    type === "consumable" ? "block" : "none";
}

//  قطع الغيار
async function fillSparePartsSelect() {
  const select = document.getElementById("sparePartSelect");
  select.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/SparePart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const items = data.$values || data || [];
    select.innerHTML = '<option value="">اختر قطعة الغيار</option>';
    items.forEach((item) => {
      select.innerHTML += `<option value="${item.sparePartId}">${item.partName}</option>`;
    });
  } catch {
    select.innerHTML = '<option value="">تعذر التحميل</option>';
  }
}

//  المستهلكات
async function fillConsumablesSelect() {
  const select = document.getElementById("consumableSelect");
  select.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    const items = data.$values || data || [];
    select.innerHTML = '<option value="">اختر المستهلك</option>';
    items.forEach((item) => {
      select.innerHTML += `<option value="${item.consumableId}">${item.consumableName}</option>`;
    });
  } catch {
    select.innerHTML = '<option value="">تعذر التحميل</option>';
  }
}

function closeAddPurchaseOrderForm() {
  document.getElementById("addPurchaseOrderPopup").classList.add("hidden");
}

// كل طلبات الشراء
async function fetchPurchaseOrders() {
  const token = localStorage.getItem("token");
  // جلب طلبات المستهلكات
  const consumableRes = await fetch(
    "https://movesmartapi.runasp.net/api/ConsumablePurchaseOrderService",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  // جلب طلبات قطع الغيار
  const spareRes = await fetch(
    "https://movesmartapi.runasp.net/api/SparePartPurchaseOrderService",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  let consumableOrders = [];
  let spareOrders = [];

  if (consumableRes.ok) {
    const data = await consumableRes.json();
    consumableOrders = (data.$values || data || []).map((o) => ({
      ...o,
      _orderType: "consumable",
    }));
  }
  if (spareRes.ok) {
    const data = await spareRes.json();
    spareOrders = (data.$values || data || []).map((o) => ({
      ...o,
      _orderType: "spare",
    }));
  }

  // دمج الطلبات
  const orders = [...spareOrders, ...consumableOrders];
  renderPurchaseOrderCards(orders);
  console.log("Fetched Purchase Orders:", orders);
}

function renderPurchaseOrderCards(orders) {
  const container = document.getElementById("purchaseOrdersContainer");
  if (!container) return;
  container.innerHTML = "";

  orders.forEach((order) => {
    const showCard =
      userRole === "Admin" ||
      userRole === "SuperUser" ||
      userRole === "WorkshopSupervisor" ||
      (userRole === "GeneralSupervisor" &&
        order.approvedByGeneralSupervisor === 0) ||
      (userRole === "GeneralManager" &&
        order.approvedByGeneralSupervisor === 1 &&
        order.approvedByGeneralManager === 0);

    if (!showCard) return;

    const card = document.createElement("div");
    card.className = "card";
    card.style = "padding: 10px; background: #f4f4f4; cursor: pointer;";
    card.innerHTML = `
      <p><strong>رقم الطلب:</strong> ${order.orderId}</p>
      <p><strong>الوصف:</strong> ${
        order.application?.applicationDescription || ""
      }</p>
      <p><strong>الحالة:</strong> ${mapPurchaseOrderStatus(
        order.application?.status
      )}</p>
    `;
    card.onclick = () => showPurchaseOrderDetails(order);
    container.appendChild(card);
  });
}

function showPurchaseOrderDetails(order) {
  const role = localStorage.getItem("userRole");
  const status = order.application?.status;
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-content job-details-popup">
      <div class="details-header">
        <h2>تفاصيل طلب الشراء</h2>
        <button type="button" class="close-btn" onclick="closePopupDetails(this)">✕</button>
      </div>
      <div class="details-content">
        <div class="details-grid">
          <div class="detail-item"><span class="detail-label">رقم الطلب:</span><span class="detail-value">${
            order.orderId
          }</span></div>
          <div class="detail-item"><span class="detail-label">الوصف:</span><span class="detail-value">${
            order.application?.applicationDescription || ""
          }</span></div>
          <div class="detail-item"><span class="detail-label">الكمية:</span><span class="detail-value">${
            order.requiredQuantity
          }</span></div>
          <div class="detail-item"><span class="detail-label">الحالة:</span><span class="detail-value">${mapPurchaseOrderStatus(
            order.application?.status
          )}</span></div>
          <div class="detail-item"><span class="detail-label">نوع الطلب:</span><span class="detail-value">${
            order.application?.applicationType === 4 ? "قطع غيار" : "مستهلكات"
          }</span></div>
        </div>
      </div>
      <div class="details-actions">
        ${
          role === "WorkshopSupervisor" && status === 3
            ? `
          <button class="btn btn-primary" onclick='editPurchaseOrder(${JSON.stringify(
            order
          )})'>✏️ تعديل</button>
          <button class="btn btn-danger" onclick='deletePurchaseOrder(${
            order.orderId
          }, "${order._orderType}")'>🗑️ حذف</button>`
            : ""
        }
        ${
          role === "GeneralSupervisor" &&
          order.approvedByGeneralSupervisor === 0
            ? `
          <button class="btn btn-success" onclick='approvePurchaseOrder(${JSON.stringify(
            order
          )}, "supervisor")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectPurchaseOrder(${JSON.stringify(
            order
          )}, "supervisor")'>❌ رفض</button>`
            : ""
        }
        ${
          role === "GeneralManager" &&
          order.approvedByGeneralManager === 0 &&
          order.approvedByGeneralSupervisor === 1
            ? `
          <button class="btn btn-success" onclick='approvePurchaseOrder(${JSON.stringify(
            order
          )}, "manager")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectPurchaseOrder(${JSON.stringify(
            order
          )}, "manager")'>❌ رفض</button>`
            : ""
        }
        <button class="btn btn-secondary" onclick="closePopupDetails(this)">✕ إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

function editPurchaseOrder(order) {
  closePopupDetails(event.target);
  openAddPurchaseOrderForm(order);
}

// إضافة أو تعديل طلب شراء
async function submitPurchaseOrder(e) {
  e.preventDefault();
  const editId = e.target.dataset.editId;
  const applicationId = e.target.dataset.applicationId || 0;
  const userId = getUserIdFromToken();
  const type = document.getElementById("purchaseOrderType").value;
  const description = document.getElementById("purchaseOrderDescription").value;
  const requiredQuantity = parseInt(
    document.getElementById("requiredQuantity").value
  );

  let requiredItem = null;
  let applicationType = "";
  let url = "";
  let method;
  let payload = {};
  const isEdit = !!editId;

  if (type === "spare") {
    requiredItem = parseInt(document.getElementById("sparePartSelect").value);
    applicationType = 4;
    url = isEdit
      ? `https://movesmartapi.runasp.net/api/SparePartPurchaseOrderService/${editId}`
      : `https://movesmartapi.runasp.net/api/SparePartPurchaseOrderService`;

    method = isEdit ? "PUT" : "POST";

    if (!requiredItem) return alert("اختر قطعة الغيار");

    payload = {
      requiredItem,
      requiredQuantity,
      approvedByGeneralSupervisor: 0,
      approvedByGeneralManager: 0,
      application: {
        applicationId: isEdit ? parseInt(applicationId) : 0,
        creationDate: new Date().toISOString(),
        status: 3,
        applicationType,
        applicationDescription: description,
        createdByUserID: parseInt(userId),
      },
    };
  } else if (type === "consumable") {
    requiredItem = parseInt(document.getElementById("consumableSelect").value);
    applicationType = 6;
    url = `https://movesmartapi.runasp.net/api/ConsumablePurchaseOrderService`;
    method = isEdit ? "PUT" : "POST";

    if (!requiredItem) return alert("اختر المستهلك");

    payload = {
      orderId: isEdit ? parseInt(editId) : 0,
      requiredItem,
      requiredQuantity,
      approvedByGeneralSupervisor: 0,
      approvedByGeneralManager: 0,
      application: {
        applicationId: isEdit ? parseInt(applicationId) : 0,
        creationDate: new Date().toISOString(),
        status: 3,
        applicationType,
        applicationDescription: description,
        createdByUserID: parseInt(userId),
      },
    };
  } else {
    return alert("اختر نوع الطلب");
  }

  console.log("Payload to be sent:", payload);
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (response.ok) {
    alert("تم حفظ طلب الشراء بنجاح");
    closeAddPurchaseOrderForm();
    fetchPurchaseOrders();
  } else {
    alert("حدث خطأ في حفظ طلب الشراء");
  }
}

async function deletePurchaseOrder(id, orderType) {
  if (!confirm("هل أنت متأكد من حذف الطلب؟")) return;
  let url = "";
  if (orderType === "spare") {
    url = `https://movesmartapi.runasp.net/api/SparePartPurchaseOrderService/${id}`;
  } else {
    url = `https://movesmartapi.runasp.net/api/ConsumablePurchaseOrderService/${id}`;
  }
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.ok) {
    alert("تم حذف الطلب بنجاح");
    fetchPurchaseOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الحذف");
  }
}
async function approvePurchaseOrder(order, by) {
  const orderType = order._orderType;
  const orderId = order.orderId;

  let url = `https://movesmartapi.runasp.net/api/${
    orderType === "spare"
      ? "SparePartPurchaseOrderService"
      : "ConsumablePurchaseOrderService"
  }/${orderId}`;

  const newStatus =
    by === "manager" && order.approvedByGeneralSupervisor === 1
      ? 1
      : order.application.status;

  const payload = {
    orderId: orderId,
    requiredItem: order.requiredItem,
    requiredQuantity: order.requiredQuantity,
    approvedByGeneralSupervisor:
      by === "supervisor" ? 1 : order.approvedByGeneralSupervisor,
    approvedByGeneralManager:
      by === "manager" ? 1 : order.approvedByGeneralManager,
    application: {
      ...order.application,
      status: newStatus,
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("تمت الموافقة بنجاح");
    fetchPurchaseOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الموافقة");
  }
}

async function rejectPurchaseOrder(order, by) {
  const orderType = order._orderType;
  const orderId = order.orderId;

  let url = `https://movesmartapi.runasp.net/api/${
    orderType === "spare"
      ? "SparePartPurchaseOrderService"
      : "ConsumablePurchaseOrderService"
  }/${orderId}`;

  const payload = {
    orderId: orderId,
    requiredItem: order.requiredItem,
    requiredQuantity: order.requiredQuantity,
    approvedByGeneralSupervisor:
      by === "supervisor" ? 2 : order.approvedByGeneralSupervisor,
    approvedByGeneralManager:
      by === "manager" ? 2 : order.approvedByGeneralManager,
    application: {
      ...order.application,
      status: 4, // مرفوض
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("تم الرفض بنجاح");
    fetchPurchaseOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الرفض");
  }
}

// تحويل كود الحالة لنص
function mapPurchaseOrderStatus(code) {
  switch (code) {
    case 1:
      return "مقبول ";
    case 2:
      return "مرفوض";
    case 3:
      return "قيد الانتظار";
    default:
      return "غير معروف";
  }
}

async function fillWithdrawVehiclesSelect() {
  const select = document.getElementById("withdrawVehicleSelect");
  select.innerHTML = '<option value="">اختر السيارة</option>';
  const vehicles = await fetchVehicles();
  console.log("Fetched Vehicles:", vehicles);
  vehicles.forEach((vehicle) => {
    select.innerHTML += `<option value="${vehicle.vehicleID}">${
      vehicle.plateNumbers || vehicle.modelName
    }</option>`;
  });
}

// زر فتح قائمة طلبات الصرف
document
  .getElementById("WithdrawOrder")
  .addEventListener("click", showWithdrawOrders);

function showWithdrawOrders() {
  document.getElementById("withdrawOrderPopup").classList.remove("hidden");
  fetchWithdrawOrders();
}

function closeWithdrawOrderPopup() {
  document.getElementById("withdrawOrderPopup").classList.add("hidden");
}

// فتح فورم إضافة/تعديل طلب صرف
function openAddWithdrawOrderForm(order = null) {
  document.getElementById("addWithdrawOrderPopup").classList.remove("hidden");
  document.getElementById("withdrawOrderForm").reset();
  document.getElementById("withdrawOrderType").value = "";
  document.getElementById("withdrawSparePartsGroup").style.display = "none";
  document.getElementById("withdrawConsumableGroup").style.display = "none";
  fillWithdrawSparePartsSelect();
  fillWithdrawConsumablesSelect();
  fillWithdrawVehiclesSelect();

  const form = document.getElementById("withdrawOrderForm");
  if (order) {
    if (order.application.applicationType === 3) {
      document.getElementById("withdrawOrderType").value = "spare";
      document.getElementById("withdrawSparePartsGroup").style.display =
        "block";
      setTimeout(() => {
        document.getElementById("withdrawSparePartSelect").value =
          order.requiredItem;
      }, 300);
    } else if (order.application.applicationType === 5) {
      document.getElementById("withdrawOrderType").value = "consumable";
      document.getElementById("withdrawConsumableGroup").style.display =
        "block";
      setTimeout(() => {
        document.getElementById("withdrawConsumableSelect").value =
          order.requiredItem;
      }, 300);
    }
    document.getElementById("withdrawOrderDescription").value =
      order.application.applicationDescription;

    form.dataset.editId = order.withdrawApplicationId;
    form.dataset.orderId = order.orderId || order.id;
    form.dataset.applicationId = order.application?.applicationId;
  } else {
    form.dataset.editId = "";
    form.dataset.orderId = "";
    form.dataset.applicationId = "";
  }
}

function toggleWithdrawType() {
  const type = document.getElementById("withdrawOrderType").value;
  document.getElementById("withdrawSparePartsGroup").style.display =
    type === "spare" ? "block" : "none";
  document.getElementById("withdrawConsumableGroup").style.display =
    type === "consumable" ? "block" : "none";
}

// جلب قطع الغيار للصرف
async function fillWithdrawSparePartsSelect() {
  const select = document.getElementById("withdrawSparePartSelect");
  select.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/SparePart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const items = data.$values || data || [];
    select.innerHTML = '<option value="">اختر قطعة الغيار</option>';
    items.forEach((item) => {
      select.innerHTML += `<option value="${item.sparePartId}">${item.partName}</option>`;
    });
  } catch {
    select.innerHTML = '<option value="">تعذر التحميل</option>';
  }
}

// جلب المستهلكات للصرف
async function fillWithdrawConsumablesSelect() {
  const select = document.getElementById("withdrawConsumableSelect");
  select.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    const items = data.$values || data || [];
    select.innerHTML = '<option value="">اختر المستهلك</option>';
    items.forEach((item) => {
      select.innerHTML += `<option value="${item.consumableId}">${item.consumableName}</option>`;
    });
  } catch {
    select.innerHTML = '<option value="">تعذر التحميل</option>';
  }
}

// جلب كل طلبات الصرف
async function fetchWithdrawOrders() {
  // جلب طلبات المستهلكات
  const consumableRes = await fetch(
    "https://movesmartapi.runasp.net/api/ConsumableWithdrawApplicationService",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  // جلب طلبات قطع الغيار
  const spareRes = await fetch(
    "https://movesmartapi.runasp.net/api/SparePartWithdrawApplicationService",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  let consumableOrders = [];
  let spareOrders = [];

  if (consumableRes.ok) {
    const data = await consumableRes.json();
    consumableOrders = (data.$values || data || []).map((o) => ({
      ...o,
      _orderType: "consumable",
    }));
  }
  if (spareRes.ok) {
    const data = await spareRes.json();
    spareOrders = (data.$values || data || []).map((o) => ({
      ...o,
      _orderType: "spare",
    }));
  }

  const orders = [...spareOrders, ...consumableOrders];
  renderWithdrawOrderCards(orders);
}

function renderWithdrawOrderCards(orders) {
  const container = document.getElementById("withdrawOrdersContainer");
  if (!container) return;
  container.innerHTML = "";
  const role = localStorage.getItem("userRole");

  orders.forEach((order) => {
    const showCard =
      role === "Admin" ||
      role === "SuperUser" ||
      role === "WorkshopSupervisor" ||
      (role === "GeneralSupervisor" &&
        order.approvedByGeneralSupervisor === 0) ||
      (role === "GeneralManager" &&
        order.approvedByGeneralSupervisor === 1 &&
        order.approvedByGeneralManager === 0);

    if (!showCard) return;

    const card = document.createElement("div");
    card.className = "card";
    card.style = "padding: 10px; background: #f4f4f4; cursor: pointer;";
    card.innerHTML = `
      <p><strong>رقم الطلب:</strong> ${order.withdrawApplicationId}</p>
      <p><strong>الوصف:</strong> ${
        order.application?.applicationDescription || ""
      }</p>
      <p><strong>الحالة:</strong> ${mapPurchaseOrderStatus(
        order.application?.status
      )}</p>
    `;
    card.onclick = () => showWithdrawOrderDetails(order);
    container.appendChild(card);
  });
}

function showWithdrawOrderDetails(order) {
  const role = localStorage.getItem("userRole");
  const status = order.application?.status;
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-content job-details-popup">
      <div class="details-header">
        <h2>تفاصيل طلب الصرف</h2>
        <button type="button" class="close-btn" onclick="closePopupDetails(this)">✕</button>
      </div>
      <div class="details-content">
        <div class="details-grid">
          <div class="detail-item"><span class="detail-label">رقم الطلب:</span><span class="detail-value">${
            order.withdrawApplicationId
          }</span></div>
          <div class="detail-item"><span class="detail-label">الوصف:</span><span class="detail-value">${
            order.application?.applicationDescription || ""
          }</span></div>
          <div class="detail-item"><span class="detail-label">الحالة:</span><span class="detail-value">${mapPurchaseOrderStatus(
            order.application?.status
          )}</span></div>
          <div class="detail-item"><span class="detail-label">نوع الطلب:</span><span class="detail-value">${
            order.application?.applicationType === 3 ? "قطع غيار" : "مستهلكات"
          }</span></div>
        </div>
      </div>
      <div class="details-actions">
        ${
          role === "WorkshopSupervisor" && status === 3
            ? `
          <button class="btn btn-primary" onclick='editWithdrawOrder(${JSON.stringify(
            order
          )})'>✏️ تعديل</button>
          <button class="btn btn-danger" onclick='deleteWithdrawOrder(${
            order.withdrawApplicationId
          }, "${order._orderType}")'>🗑️ حذف</button>`
            : ""
        }
        ${
          role === "GeneralSupervisor" &&
          order.approvedByGeneralSupervisor === 0
            ? `
          <button class="btn btn-success" onclick='approveWithdrawOrder(${JSON.stringify(
            order
          )}, "${order._orderType}", "supervisor")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectWithdrawOrder(${JSON.stringify(
            order
          )}, "${order._orderType}", "supervisor")'>❌ رفض</button>`
            : ""
        }
        ${
          role === "GeneralManager" &&
          order.approvedByGeneralManager === 0 &&
          order.approvedByGeneralSupervisor === 1
            ? `
          <button class="btn btn-success" onclick='approveWithdrawOrder(${JSON.stringify(
            order
          )}, "${order._orderType}", "manager")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectWithdrawOrder(${JSON.stringify(
            order
          )}, "${order._orderType}", "manager")'>❌ رفض</button>`
            : ""
        }
        <button class="btn btn-secondary" onclick="closePopupDetails(this)">✕ إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

function editWithdrawOrder(order) {
  closePopupDetails(event.target);
  openAddWithdrawOrderForm(order);
}

// إضافة أو تعديل طلب صرف
async function submitWithdrawOrder(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.dataset.editId;
  const applicationId = form.dataset.applicationId || 0;
  const userId = getUserIdFromToken();
  const type = document.getElementById("withdrawOrderType").value;
  const description = document.getElementById("withdrawOrderDescription").value;
  const vehicleId = parseInt(
    document.getElementById("withdrawVehicleSelect").value
  );
  console.log("Edit ID:", editId);
  if (!vehicleId) return alert("اختر السيارة");

  let url = "";
  let method;
  let payload = {};
  const isEdit = !!editId;

  if (type === "spare") {
    const sparePartId = parseInt(
      document.getElementById("withdrawSparePartSelect").value
    );
    if (!sparePartId) return alert("اختر قطعة الغيار");

    url = `https://movesmartapi.runasp.net/api/SparePartWithdrawApplicationService`;
    method = isEdit ? "PUT" : "POST";

    payload = isEdit
      ? {
          withdrawApplicationId: parseInt(editId),
          applicationId: parseInt(applicationId),
          sparePartId,
          vehicleId,
          application: {
            applicationId: parseInt(applicationId),
            creationDate: new Date().toISOString(),
            status: 3,
            applicationType: 3,
            applicationDescription: description,
            createdByUserID: parseInt(userId),
          },
          approvedByGeneralSupervisor: 0,
          approvedByGeneralManager: 0,
          sparePart: null,
        }
      : {
          sparePartId,
          vehicleId,
          approvedByGeneralSupervisor: 0,
          approvedByGeneralManager: 0,
          application: {
            applicationId: 0,
            creationDate: new Date().toISOString(),
            status: 3,
            applicationType: 3,
            applicationDescription: description,
            createdByUserID: parseInt(userId),
          },
        };
  } else if (type === "consumable") {
    const consumableId = parseInt(
      document.getElementById("withdrawConsumableSelect").value
    );
    if (!consumableId) return alert("اختر المستهلك");

    url = `https://movesmartapi.runasp.net/api/ConsumableWithdrawApplicationService`;
    method = isEdit ? "PUT" : "POST";

    payload = isEdit
      ? {
          withdrawApplicationId: parseInt(editId),
          applicationId: parseInt(applicationId),
          consumableId,
          vehicleId,
          application: {
            applicationId: parseInt(applicationId),
            creationDate: new Date().toISOString(),
            status: 3,
            applicationType: 5,
            applicationDescription: description,
            createdByUserID: parseInt(userId),
          },
          approvedByGeneralSupervisor: 0,
          approvedByGeneralManager: 0,
          consumable: null,
        }
      : {
          consumableId,
          vehicleId,
          approvedByGeneralSupervisor: 0,
          approvedByGeneralManager: 0,
          application: {
            applicationId: 0,
            creationDate: new Date().toISOString(),
            status: 3,
            applicationType: 5,
            applicationDescription: description,
            createdByUserID: parseInt(userId),
          },
        };
  } else {
    return alert("اختر نوع الطلب");
  }

  console.log("Withdraw Payload to be sent:", payload);
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (response.ok) {
    alert("تم حفظ طلب الصرف بنجاح");
    closeAddWithdrawOrderForm();
    fetchWithdrawOrders();
  } else {
    const err = await response.text();
    alert("حدث خطأ في حفظ طلب الصرف: " + err);
  }
}

async function deleteWithdrawOrder(id, orderType) {
  if (!confirm("هل أنت متأكد من حذف الطلب؟")) return;
  console.log("Deleting Withdraw Order:", id);
  let url = "";
  if (orderType === "spare") {
    url = `https://movesmartapi.runasp.net/api/SparePartWithdrawApplicationService/${id}`;
  } else {
    url = `https://movesmartapi.runasp.net/api/ConsumableWithdrawApplicationService/${id}`;
  }
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.ok) {
    alert("تم حذف الطلب بنجاح");
    fetchWithdrawOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الحذف");
  }
}

function closeAddWithdrawOrderForm() {
  document.getElementById("addWithdrawOrderPopup").classList.add("hidden");
}
async function approveWithdrawOrder(order, type, by) {
  const url = `https://movesmartapi.runasp.net/api/${
    type === "spare"
      ? "SparePartWithdrawApplicationService"
      : "ConsumableWithdrawApplicationService"
  }/${order.withdrawApplicationId}`;

  const newStatus =
    by === "manager" && order.approvedByGeneralSupervisor === 1
      ? 1
      : order.application.status;

  const payload = {
    withdrawApplicationId: order.withdrawApplicationId,
    applicationId: order.application.applicationId,
    ...(type === "spare"
      ? { sparePartId: order.requiredItem }
      : { consumableId: order.requiredItem }),
    vehicleId: order.vehicleId,
    approvedByGeneralSupervisor:
      by === "supervisor" ? 1 : order.approvedByGeneralSupervisor,
    approvedByGeneralManager:
      by === "manager" ? 1 : order.approvedByGeneralManager,
    application: {
      ...order.application,
      status: newStatus,
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("تمت الموافقة بنجاح");
    fetchWithdrawOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الموافقة");
  }
}

async function rejectWithdrawOrder(order, type, by) {
  const url = `https://movesmartapi.runasp.net/api/${
    type === "spare"
      ? "SparePartWithdrawApplicationService"
      : "ConsumableWithdrawApplicationService"
  }/${order.withdrawApplicationId}`;

  const payload = {
    withdrawApplicationId: order.withdrawApplicationId,
    applicationId: order.application.applicationId,
    ...(type === "spare"
      ? { sparePartId: order.requiredItem }
      : { consumableId: order.requiredItem }),
    vehicleId: order.vehicleId,
    approvedByGeneralSupervisor:
      by === "supervisor" ? 2 : order.approvedByGeneralSupervisor,
    approvedByGeneralManager:
      by === "manager" ? 2 : order.approvedByGeneralManager,
    application: {
      ...order.application,
      status: 4, // مرفوض
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("تم الرفض بنجاح");
    fetchWithdrawOrders();
    document.querySelectorAll(".popup").forEach((p) => p.remove());
  } else {
    alert("حدث خطأ أثناء الرفض");
  }
}

document
  .getElementById("maintenanceRequestsCard")
  .addEventListener("click", showMaintenanceRequests);

function showMaintenanceRequests() {
  document
    .getElementById("maintenanceRequestsPopup")
    .classList.remove("hidden");

  const role = localStorage.getItem("userRole");
  const addBtn = document.getElementById("addMaintenanceRequestBtn");

  if (role === "WorkshopSupervisor") {
    addBtn.classList.remove("hidden");
  } else {
    addBtn.classList.add("hidden");
  }

  fetchMaintenanceRequests();
}

function closeMaintenanceRequestsPopup() {
  document.getElementById("maintenanceRequestsPopup").classList.add("hidden");
}

async function fetchMaintenanceRequests() {
  const container = document.getElementById("maintenanceRequestsContainer");
  container.innerHTML = "⏳ جاري التحميل...";

  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/MaintenanceApplications/All",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      const requests = data.$values || [];
      console.log("Fetched Maintenance Requests:", requests);
      if (requests.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#999">لا توجد طلبات صيانة حالياً.</p>`;
        return;
      }
      renderMaintenanceRequestCards(requests);
    } else {
      container.innerHTML = `<p style="text-align:center; color:#999">لا توجد طلبات صيانة حالياً.</p>`;
    }
  } catch (err) {
    console.error("خطأ في تحميل الطلبات:", err);
    container.innerHTML = `<p style="color:red; text-align:center;">حدث خطأ أثناء تحميل الطلبات</p>`;
  }
}

function renderMaintenanceRequestCards(requests) {
  const container = document.getElementById("maintenanceRequestsContainer");
  container.innerHTML = "";

  const role = localStorage.getItem("userRole");

  requests.forEach((req) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style =
      "background: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px;";

    card.innerHTML = `
      <p><strong>رقم الطلب:</strong> ${req.maintenanceApplicationID}</p>
      <p><strong>الوصف:</strong> ${
        req.application?.applicationDescription || ""
      }</p>
      <p><strong>السيارة:</strong> ${req.vehicleID}</p>
      <p><strong>الحالة:</strong> ${mapApplicationStatus(
        req.application?.status
      )}</p>
      <div class="card-actions" style="margin-top: 8px;">
        ${
          role === "WorkshopSupervisor" && req.application?.status === 3
            ? `
          <button class="btn btn-secondary" onclick='editMaintenanceRequest(${req.maintenanceApplicationID})'>✏️ تعديل</button>
          <button class="btn btn-danger" onclick='deleteMaintenanceRequest(${req.maintenanceApplicationID})'>🗑️ حذف</button>`
            : ""
        }

        ${
          role === "GeneralSupervisor" &&
          req.approvedByGeneralSupervisor === false
            ? `
          <button class="btn btn-success" onclick='approveMaintenanceRequest(${req.maintenanceApplicationID}, "supervisor")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectMaintenanceRequest(${req.maintenanceApplicationID}, "supervisor")'>❌ رفض</button>`
            : ""
        }

        ${
          role === "GeneralManager" &&
          req.approvedByGeneralSupervisor === true &&
          req.approvedByGeneralManager === false
            ? `
          <button class="btn btn-success" onclick='approveMaintenanceRequest(${req.maintenanceApplicationID}, "manager")'>✔️ موافقة</button>
          <button class="btn btn-danger" onclick='rejectMaintenanceRequest(${req.maintenanceApplicationID}, "manager")'>❌ رفض</button>`
            : ""
        }
      </div>
    `;

    container.appendChild(card);
  });
}

function mapApplicationStatus(status) {
  switch (status) {
    case 1:
      return "مقبول";
    case 2:
      return "مرفوض";
    case 3:
      return "قيد الانتظار";
    default:
      return "غير معروف";
  }
}

// ✅ تعديل الطلب
let editingApplicationId = null;

async function editMaintenanceRequest(id) {
  try {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("فشل تحميل بيانات الطلب");
    const data = await res.json();

    editingMaintenanceId = data.maintenanceApplicationID;
    editingApplicationId = data.application?.applicationId;

    openAddMaintenanceRequestForm(data);
  } catch (err) {
    console.error("خطأ في تحميل الطلب للتعديل:", err);
    alert("فشل في تحميل البيانات");
  }
}

// ✅ حذف الطلب
async function deleteMaintenanceRequest(id) {
  if (!confirm("هل أنت متأكد من حذف طلب الصيانة؟")) return;
  try {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("فشل في الحذف");
    alert("تم حذف الطلب بنجاح");
    fetchMaintenanceRequests();
  } catch (err) {
    console.error("فشل الحذف:", err);
    alert("حدث خطأ أثناء الحذف");
  }
}

// ✅ الموافقة
async function approveMaintenanceRequest(id, by) {
  try {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();

    if (by === "supervisor") {
      data.approvedByGeneralSupervisor = true;
    }
    if (by === "manager") {
      if (data.approvedByGeneralSupervisor !== true) {
        alert("يجب موافقة المشرف العام أولاً");
        return;
      }
      data.approvedByGeneralManager = true;
      data.application.status = 1;
      await updateVehicleStatus(data.vehicleID, "قيد الصيانة");
    }
    const payload = {
      maintenanceApplicationID: data.maintenanceApplicationID,
      applicationID: data.application.applicationId,
      vehicleID: data.vehicleID,
      approvedByGeneralSupervisor: data.approvedByGeneralSupervisor,
      approvedByGeneralManager: data.approvedByGeneralManager,
      application: {
        applicationId: data.application.applicationId,
        creationDate: data.application.creationDate,
        status: data.application.status,
        applicationType: data.application.applicationType,
        applicationDescription: data.application.applicationDescription,
        createdByUserID: data.application.createdByUserID,
      },
    };

    console.log("✅ Payload to be sent:", payload);

    const updateRes = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!updateRes.ok) throw new Error("فشل الموافقة");
    alert("تمت الموافقة بنجاح");
    fetchMaintenanceRequests();
  } catch (err) {
    console.error("فشل الموافقة:", err);
    alert("فشل في إتمام العملية");
  }
}

// ✅ الرفض
async function rejectMaintenanceRequest(id, by) {
  try {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("فشل تحميل الطلب");
    const data = await res.json();

    if (by === "supervisor") data.approvedByGeneralSupervisor = false;
    if (by === "manager") data.approvedByGeneralManager = false;
    data.application = data.application || {};
    data.application.status = 2;

    const updateRes = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!updateRes.ok) throw new Error("فشل في الرفض");
    alert("❌ تم رفض الطلب بنجاح");
    fetchMaintenanceRequests();
  } catch (err) {
    console.error("خطأ أثناء الرفض:", err);
    alert("❌ فشل في رفض الطلب");
  }
}

// ✅ تغيير حالة السيارة
async function updateVehicleStatus(vehicleId, statusName) {
  try {
    // 1. جيب بيانات السيارة
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/Vehicles/${vehicleId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("فشل تحميل بيانات السيارة");

    const vehicle = await res.json();

    // 2. حدّد قيمة الحالة الجديدة حسب الاسم
    const statusMap = {
      متاحة: 1,
      "قيد الصيانة": 2,
      متوقفة: 3,
    };
    vehicle.status = statusMap[statusName] || 2;

    const updateRes = await fetch(
      `https://movesmartapi.runasp.net/api/Vehicles`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicle),
      }
    );

    if (!updateRes.ok) throw new Error("فشل تحديث حالة السيارة");
    console.log("✅ تم تغيير حالة السيارة إلى:", statusName);
  } catch (err) {
    console.error("❌ فشل تغيير حالة السيارة:", err);
  }
}

// ✅ فتح النموذج
let isEditingMaintenance = false;
let editingMaintenanceId = null;

function openAddMaintenanceRequestForm(data = null) {
  document
    .getElementById("maintenanceRequestFormPopup")
    .classList.remove("hidden");
  document.getElementById("maintenanceRequestForm").reset();
  fillMaintenanceVehicleSelect();

  const title = document.getElementById("maintenanceFormTitle");

  if (data) {
    isEditingMaintenance = true;
    editingMaintenanceId = data.maintenanceApplicationID;
    title.textContent = "تعديل طلب صيانة";
    document.getElementById("maintenanceVehicleSelect").value = data.vehicleID;
    document.getElementById("maintenanceDescription").value =
      data.application?.applicationDescription || "";
  } else {
    isEditingMaintenance = false;
    editingMaintenanceId = null;
    title.textContent = "طلب صيانة جديد";
  }
}

function closeMaintenanceRequestForm() {
  document
    .getElementById("maintenanceRequestFormPopup")
    .classList.add("hidden");
}

// ✅ تعبئة قائمة السيارات
async function fillMaintenanceVehicleSelect() {
  const select = document.getElementById("maintenanceVehicleSelect");
  select.innerHTML = `<option value="">جاري التحميل...</option>`;

  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/Vehicles/All",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    const vehicles = data.$values || [];

    select.innerHTML = `<option value="">اختر السيارة</option>`;
    vehicles.forEach((vehicle) => {
      const opt = document.createElement("option");
      opt.value = vehicle.vehicleID;
      opt.textContent = `${vehicle.plateNumbers} - ${vehicle.model || ""}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("فشل تحميل السيارات", err);
    select.innerHTML = `<option value="">تعذر تحميل السيارات</option>`;
  }
}

// ✅ حفظ الطلب (جديد أو تعديل)
async function submitMaintenanceRequest(e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const userId = getUserIdFromToken();

  const vehicleId = parseInt(
    document.getElementById("maintenanceVehicleSelect").value
  );
  const description = document.getElementById("maintenanceDescription").value;

  const payload = {
    maintenanceApplicationID: editingMaintenanceId ?? 0,
    applicationID: isEditingMaintenance ? editingApplicationId : 0,
    vehicleID: vehicleId,
    approvedByGeneralSupervisor: false,
    approvedByGeneralManager: false,
    application: {
      applicationId: isEditingMaintenance ? editingApplicationId : 0,
      creationDate: new Date().toISOString(),
      status: 3,
      applicationType: 7,
      applicationDescription: description,
      createdByUserID: parseInt(userId),
    },
  };
  console.log("🔍 Final payload", payload);

  try {
    const url = `https://movesmartapi.runasp.net/api/MaintenanceApplications`;
    const method = isEditingMaintenance ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("فشل في الحفظ");

    alert("✅ تم حفظ الطلب بنجاح");
    closeMaintenanceRequestForm();
    fetchMaintenanceRequests();
  } catch (err) {
    console.error("خطأ في حفظ الطلب:", err);
    alert("❌ حدث خطأ أثناء الحفظ");
  }
}

function getUserIdFromToken() {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.nameid;
  } catch {
    return null;
  }
}

document
  .getElementById("actualMaintenanceCard")
  .addEventListener("click", showMaintenanceRecords);

// فتح الكارت الرئيسي
function showMaintenanceRecords() {
  document.getElementById("maintenanceRecordsPopup").classList.remove("hidden");
  fetchMaintenanceRecords();
}

// إغلاق كارت العرض
function closeMaintenanceRecordsPopup() {
  document.getElementById("maintenanceRecordsPopup").classList.add("hidden");
}

// عرض كل سجلات الصيانة الفعلية
async function fetchMaintenanceRecords() {
  const container = document.getElementById("maintenanceRecordsContainer");
  container.innerHTML = "⏳ جاري التحميل...";

  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Maintenance", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("فشل في تحميل السجلات");

    const data = await res.json();
    const records = data.$values || [];

    if (records.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#999">لا توجد سجلات صيانة فعلية.</p>`;
      return;
    }

    container.innerHTML = "";
    records.forEach((rec) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style =
        "background: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px;";

      card.innerHTML = `
        <p><strong>رقم الصيانة:</strong> ${rec.maintenanceId}</p>
        <p><strong>الوصف:</strong> ${rec.description}</p>
        <p><strong>التاريخ:</strong> ${rec.maintenanceDate?.split("T")[0]}</p>
        <p><strong>طلب الصيانة المرتبط:</strong> ${
          rec.maintenanceApplicationId
        }</p>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("فشل تحميل السجلات:", err);
    container.innerHTML = `<p style="color:red; text-align:center">حدث خطأ أثناء التحميل</p>`;
  }
}

// فتح النموذج
function openAddActualMaintenanceForm() {
  document
    .getElementById("actualMaintenanceFormPopup")
    .classList.remove("hidden");
  document.getElementById("actualMaintenanceForm").reset();
  fillMaintenanceApplicationSelect();
  fillMaintenanceSparePartSelect();
  fillMaintenanceConsumableSelect();
}

// إغلاق النموذج
function closeActualMaintenanceForm() {
  document.getElementById("actualMaintenanceFormPopup").classList.add("hidden");
}

// تحميل الطلبات المقبولة فقط وغير مرتبطة بصيانة فعلية
async function fillMaintenanceApplicationSelect() {
  const select = document.getElementById("maintenanceApplicationSelect");
  select.innerHTML = `<option value="">جاري التحميل...</option>`;

  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/MaintenanceApplications/All",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    const requests = data.$values || [];
    const available = [];

    for (const req of requests) {
      if (req.application?.status === 1) {
        const check = await fetch(
          `https://movesmartapi.runasp.net/api/Maintenance/maintenance-application-id/${req.maintenanceApplicationID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const result = await check.json();

        if (result.$values?.length === 0) {
          // ✅ جلب بيانات السيارة المرتبطة
          const vehicleRes = await fetch(
            `https://movesmartapi.runasp.net/api/Vehicles/${req.vehicleID}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const vehicleData = await vehicleRes.json();
          const plate = vehicleData.plateNumbers || `مركبة #${req.vehicleID}`;

          available.push({
            id: req.maintenanceApplicationID,
            plate,
          });
        }
      }
    }
    if (available.length === 0) {
      select.innerHTML = `<option value="">لا توجد طلبات صيانة متاحة</option>`;
      return;
    }
    select.innerHTML = `<option value="">اختر طلب صيانة...</option>`;
    available.forEach((req) => {
      const opt = document.createElement("option");
      opt.value = req.id;
      opt.textContent = `طلب #${req.id} - ${req.plate}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("فشل تحميل الطلبات:", err);
    select.innerHTML = `<option value="">تعذر التحميل</option>`;
  }
}

// حفظ الصيانة الفعلية
async function submitActualMaintenance(event) {
  event.preventDefault();

  const applicationId = parseInt(
    document.getElementById("maintenanceApplicationSelect").value
  );
  const description = document.getElementById(
    "actualmaintenanceDescription"
  ).value;

  const sparePartId = document.getElementById("sparePartSelect").value;
  const consumableId = document.getElementById("consumableSelect").value;

  const payload = {
    maintenanceId: 0,
    maintenanceDate: new Date().toISOString(),
    description,
    maintenanceApplicationId: applicationId,
  };

  try {
    console.log("🚀 Payload to send:", payload);
    // 🛠️ إضافة الصيانة الفعلية
    const res = await fetch("https://movesmartapi.runasp.net/api/Maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("فشل في حفظ الصيانة");

    const result = await res.json();
    const newMaintenanceId = result.maintenanceId;

    // 🔁 تسجيل قطعة الغيار (إن وجدت)
    if (sparePartId) {
      await fetch("https://movesmartapi.runasp.net/api/SparePartReplacements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          replacementId: 0,
          maintenanceId: newMaintenanceId,
          sparePartId: parseInt(sparePartId),
          sparePart: "",
        }),
      });
    }

    // 🔁 تسجيل المستهلك (إن وجد)
    if (consumableId) {
      await fetch(
        "https://movesmartapi.runasp.net/api/ConsumableReplacements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            replacementId: 0,
            maintenanceId: newMaintenanceId,
            consumableId: parseInt(consumableId),
            consumable: "",
          }),
        }
      );
    }

    // ✅ تحديث حالة السيارة إلى "متاح"
    const vehicleId = await getVehicleIdByApplicationId(applicationId);
    if (vehicleId) {
      await updateVehicleStatus(vehicleId, "متاح");
    }

    alert("✅ تم حفظ الصيانة بنجاح");
    closeActualMaintenanceForm();
    fetchMaintenanceRecords();
  } catch (err) {
    console.error("❌ فشل حفظ الصيانة:", err);
    alert("حدث خطأ أثناء حفظ الصيانة");
  }
}

// استخراج vehicleID من الطلب المرتبط
async function getVehicleIdByApplicationId(applicationId) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/MaintenanceApplications/${applicationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    return data.vehicleID || null;
  } catch (err) {
    console.error("فشل في جلب السيارة المرتبطة:", err);
    return null;
  }
}
async function fillMaintenanceSparePartSelect() {
  const select = document.getElementById("sparePartMaintenanceSelect");
  select.innerHTML = `<option value="">جاري التحميل...</option>`;

  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/SparePart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log("قطع الغيار:", data);
    const parts = data.$values || [];

    select.innerHTML = `<option value="">-- اختر قطعة غيار --</option>`;
    parts.forEach((part) => {
      const opt = document.createElement("option");
      opt.value = part.sparePartId; // ✅ صح
      opt.textContent = part.partName || `قطعة #${part.sparePartId}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("فشل تحميل قطع الغيار:", err);
    select.innerHTML = `<option value="">تعذر تحميل القطع</option>`;
  }
}

async function fillMaintenanceConsumableSelect() {
  const select = document.getElementById("consumableMaintenanceSelect");
  select.innerHTML = `<option value="">جاري التحميل...</option>`;

  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    console.log("المستهلكات:", data);
    const items = data.$values || [];

    select.innerHTML = `<option value="">-- اختر مستهلك --</option>`;
    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.consumableId; // ✅ صح
      opt.textContent = item.consumableName || `مستهلك #${item.consumableId}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("فشل تحميل المستهلكات:", err);
    select.innerHTML = `<option value="">تعذر التحميل</option>`;
  }
}

// زر فتح نافذة ملاحظات المأموريات
document
  .getElementById("missionNotesCard")
  .addEventListener("click", showMissionNotes);

function showMissionNotes() {
  document.getElementById("missionNotesPopup").classList.remove("hidden");
  const addnoteBtn = document.getElementById("addMissionNoteBtn");
  if (userRole !== "HospitalManager") {
    addnoteBtn.classList.add("hidden");
  }
  fetchMissionNotes();
}

function closeMissionNotesPopup() {
  document.getElementById("missionNotesPopup").classList.add("hidden");
}

// ✅ جلب الملاحظات
async function fetchMissionNotes() {
  const container = document.getElementById("missionNotesContainer");
  container.innerHTML = "جارٍ التحميل...";
  try {
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/MissionsNotes/All",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    const notes = data.$values || [];

    container.innerHTML = "";

    if (notes.length === 0) {
      container.innerHTML = "<p>لا توجد ملاحظات</p>";
      return;
    }

    notes.forEach((note) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style = "padding: 10px; background: #f4f4f4; cursor: pointer;";

      const isManager = userRole === "HospitalManager";

      card.innerHTML = `
    <p><strong>الوصف:</strong> ${
      note.application.applicationDescription || "—"
    }</p>
    <p><strong>الحالة:</strong> ${mapStatus(note.application.status)}</p>
    ${
      isManager
        ? `
      <div class="details-actions">
        <button class="btn btn-primary" onclick='editMissionNote(${JSON.stringify(
          note
        )})'>✏️ تعديل</button>
        <button class="btn btn-danger" onclick='cancelMissionNote(${
          note.noteID
        })'>❌ إلغاء</button>
      </div>`
        : ""
    }
  `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML =
      "<p style='color:red'>حدث خطأ أثناء جلب الملاحظات</p>";
  }
}

// ✅ فتح فورم الإضافة
function openAddMissionNoteForm() {
  document.getElementById("addMissionNotePopup").classList.remove("hidden");
  document.getElementById("missionNoteForm").reset();
  document.getElementById("missionNoteForm").dataset.editId = "";
  document.getElementById("missionNoteForm").dataset.applicationId = "";
  document.getElementById("missionNoteFormTitle").textContent = "ملاحظة جديدة";
}

// ✅ إغلاق فورم الإضافة / التعديل
function closeMissionNoteForm() {
  document.getElementById("addMissionNotePopup").classList.add("hidden");
}

// ✅ إرسال (إضافة أو تعديل)
async function submitMissionNote(e) {
  e.preventDefault();

  const editId = e.target.dataset.editId;
  const userId = getUserIdFromToken();
  const applicationId = editId ? parseInt(e.target.dataset.applicationId) : 0; // صفر لو إضافة، الرقم لو تعديل

  const payload = {
    noteID: editId ? parseInt(editId) : 0,
    applicationID: applicationId,
    application: {
      applicationId: applicationId,
      creationDate: new Date().toISOString(),
      status: 1, //  مقبول
      applicationType: 2, // مأمورية
      applicationDescription: document.getElementById("descriptionInput").value,
      createdByUserID: parseInt(userId),
    },
  };

  console.log("🚀 Payload:", payload);

  const method = editId ? "PUT" : "POST";
  const url = "https://movesmartapi.runasp.net/api/MissionsNotes";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    alert("تم الحفظ بنجاح");
    closeMissionNoteForm();
    fetchMissionNotes();
  } else {
    alert("حدث خطأ أثناء الحفظ");
  }
}

// ✅ تعديل
function editMissionNote(note) {
  openAddMissionNoteForm();

  document.getElementById("descriptionInput").value =
    note.application.applicationDescription;

  // خزنه في الداتا بدل ما يظهر في input
  document.getElementById("missionNoteForm").dataset.applicationId =
    note.application.applicationId;

  document.getElementById("missionNoteForm").dataset.editId = note.noteID;
  document.getElementById("missionNoteFormTitle").textContent =
    "تعديل الملاحظة";
}

// ✅ إلغاء (تغيير الحالة إلى ملغي)
async function cancelMissionNote(noteID) {
  if (!confirm("هل أنت متأكد من إلغاء هذه الملاحظة؟")) return;

  const res = await fetch(
    `https://movesmartapi.runasp.net/api/MissionsNotes/${noteID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const note = await res.json();

  const payload = {
    noteID: note.noteID,
    applicationID: note.application.applicationId,
    application: {
      ...note.application,
      status: 4, // ملغي
    },
  };

  const response = await fetch(
    `https://movesmartapi.runasp.net/api/MissionsNotes`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (response.ok) {
    alert("تم الإلغاء بنجاح");
    fetchMissionNotes();
  } else {
    alert("حدث خطأ أثناء الإلغاء");
  }
}

// ✅ تحويل كود الحالة لنص
function mapStatus(code) {
  switch (code) {
    case 1:
      return "مقبول";
    case 2:
      return "قيد الانتظار";
    case 3:
      return "مرفوض";
    case 4:
      return "ملغي";
    default:
      return "غير معروف";
  }
}

const missionApi = "https://movesmartapi.runasp.net/api/Mission";
const missionNotesApi = "https://movesmartapi.runasp.net/api/MissionsNotes/All";

// ✅ إظهار الكارت حسب الدور
if (
  ["HospitalManager", "GeneralManager", "GeneralSupervisor"].includes(userRole)
) {
  document
    .getElementById("missionOrder")
    .addEventListener("click", showMissionOrders);
} else {
  document.getElementById("missionOrder").style.display = "none";
}

function showMissionOrders() {
  document.getElementById("missionOrderPopup").classList.remove("hidden");
  fetchMissionOrders();

  // إخفاء زر الإضافة إذا لم يكن GeneralSupervisor
  if (userRole !== "GeneralSupervisor") {
    document.getElementById("addMissionOrderBtn").style.display = "none";
  } else {
    document.getElementById("addMissionOrderBtn").style.display = "block";
  }
}

function closeMissionOrderPopup() {
  document.getElementById("missionOrderPopup").classList.add("hidden");
}

function openAddMissionOrderForm() {
  document.getElementById("addMissionOrderPopup").classList.remove("hidden");
  document.getElementById("missionOrderForm").reset();
  document.getElementById("missionOrderForm").dataset.editId = "";
  document.getElementById("missionOrderFormTitle").textContent =
    "أمر مأمورية جديد";
  loadAvailableMissionNotes();
  populateMissionVehiclesSelect();
}

function closeMissionOrderForm() {
  document.getElementById("addMissionOrderPopup").classList.add("hidden");
}

// ✅ تحميل الملاحظات الغير مستخدمة في أوامر المأمورية
async function loadAvailableMissionNotes() {
  const select = document.getElementById("missionNoteSelect");
  select.innerHTML = "<option value=''>جارٍ التحميل...</option>";

  try {
    // جلب كل الملاحظات
    const notesRes = await fetch(missionNotesApi, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notesData = await notesRes.json();
    const notes = notesData.$values || [];

    // جلب كل أوامر المأموريات
    const missionsRes = await fetch(missionApi, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const missionsData = await missionsRes.json();
    const missions = missionsData.$values || [];

    // استخراج الـ noteIDs المستخدمة
    const usedNoteIds = missions
      .map((m) => m.missoinNoteId)
      .filter((id) => id != null);

    // فلترة الملاحظات غير المستخدمة
    const availableNotes = notes.filter(
      (note) => !usedNoteIds.includes(note.noteID)
    );

    if (availableNotes.length === 0) {
      select.innerHTML = "<option value=''>لا توجد ملاحظات متاحة</option>";
    } else {
      select.innerHTML = "<option value=''>اختر الملاحظة</option>";
      availableNotes.forEach((note) => {
        select.innerHTML += `
          <option value="${note.noteID}">
            ${note.application.applicationDescription}
          </option>`;
      });
    }
  } catch (error) {
    console.error("❌ خطأ أثناء تحميل الملاحظات:", error);
    select.innerHTML = "<option value=''>حدث خطأ أثناء التحميل</option>";
  }
}

// ✅ جلب أوامر المأموريات
async function fetchMissionOrders() {
  const container = document.getElementById("missionOrdersContainer");
  container.innerHTML = "جارٍ التحميل...";

  try {
    const res = await fetch(missionApi, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const orders = data.$values || [];

    container.innerHTML = "";

    if (orders.length === 0) {
      container.innerHTML = "<p>لا توجد أوامر مأمورية</p>";
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <p><strong>الوجهة:</strong> ${order.destination}</p>
        <p><strong>من:</strong> ${new Date(
          order.startDate
        ).toLocaleDateString()}</p>
        <p><strong>إلى:</strong> ${new Date(
          order.endDate
        ).toLocaleDateString()}</p>
        ${
          userRole === "GeneralSupervisor"
            ? `<div class="details-actions">
                <button class="btn btn-primary" onclick='editMissionOrder(${JSON.stringify(
                  order
                )})'>✏️ تعديل</button>
                <button class="btn btn-danger" onclick='deleteMissionOrder(${
                  order.missionId
                })'>❌ حذف</button>
              </div>`
            : ""
        }
      `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = "<p style='color:red'>حدث خطأ أثناء جلب البيانات</p>";
  }
}

// ✅ تعبئة الفورم عند التعديل
function editMissionOrder(order) {
  openAddMissionOrderForm();
  document.getElementById("missionOrderForm").dataset.editId = order.missionId;
  document.getElementById("missionNoteSelect").value = order.missionNoteId;
  document.getElementById("missionVehicleSelect").value =
    order.missionVehiclesId;
  document.getElementById("destination").value = order.destination;
  document.getElementById("startDate").value = order.startDate.slice(0, 10);
  document.getElementById("endDate").value = order.endDate.slice(0, 10);
  document.getElementById("missionOrderFormTitle").textContent =
    "تعديل أمر مأمورية";
}

// ✅ إرسال (إضافة أو تعديل)
async function submitMissionOrder(e) {
  e.preventDefault();

  const editId = e.target.dataset.editId;
  const userId = getUserIdFromToken();

  const startDate = document.getElementById("missionstartDate").value;
  const endDate = document.getElementById("missionendDate").value;
  const missiondestination = document.getElementById("missiondestination").value;

  const payload = {
    missionId: editId ? parseInt(editId) : 0,
    missionNoteId: parseInt(document.getElementById("missionNoteSelect").value),
    missionVehiclesId: parseInt(
      document.getElementById("missionVehicleSelect").value
    ),
    startDate: new Date(`${startDate}`).toISOString(),
    endDate: new Date(`${endDate}`).toISOString(),
    destination: missiondestination,
    userId: parseInt(userId),
  };

  console.log("🚀 Payload to send:", payload);
  const url = editId ? `${missionApi}/${editId}` : missionApi;
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("تم الحفظ بنجاح");
      closeMissionOrderForm();
      fetchMissionOrders();
    } else {
      const errText = await res.text();
      console.error("❌ Server error:", errText);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  } catch (error) {
    console.error("❌ Failed to fetch", error);
    alert("❌ حدث خطأ أثناء إرسال البيانات");
  }
}

// ✅ حذف أمر مأمورية
async function deleteMissionOrder(id) {
  if (!confirm("هل أنت متأكد من حذف أمر المأمورية؟")) return;

  const res = await fetch(`${missionApi}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    alert("تم الحذف بنجاح");
    fetchMissionOrders();
  } else {
    alert("❌ حدث خطأ أثناء الحذف");
  }
}

async function populateMissionVehiclesSelect() {
  const select = document.getElementById("missionVehicleSelect");
  select.innerHTML = "<option value=''>جارٍ التحميل...</option>";

  try {
    const vehicles = await fetchVehicles(); // موجودة أصلاً عندك
    const available = vehicles.filter((v) => v.status === 1);
    select.innerHTML = "<option value=''>اختر السيارة</option>";

    available.forEach((v) => {
      select.innerHTML += `<option value="${v.vehicleID}">${
        v.plateNumbers || v.vehicleID
      }</option>`;
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تحميل السيارات:", error);
    select.innerHTML = "<option value=''>فشل في تحميل السيارات</option>";
  }
}
