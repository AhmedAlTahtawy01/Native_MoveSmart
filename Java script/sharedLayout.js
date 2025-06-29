window.token = localStorage.getItem("token");
window.userRole = localStorage.getItem("userRole");
window.userName = localStorage.getItem("userName");
window.role = localStorage.getItem("userRole")
document.addEventListener("DOMContentLoaded", function () {

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  // عرض اسم المستخدم
  const userNameElement = document.getElementById("userName");
  userNameElement.textContent = userName || "User";
  // إعداد زر تسجيل الخروج
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      showLogoutPopup();
    });
  }

  const confirmLogoutBtn = document.getElementById("confirmLogout");
  const cancelLogoutBtn = document.getElementById("cancelLogout");

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", function () {
      hideLogoutPopup();
      logout();
    });
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener("click", function () {
      hideLogoutPopup();
    });
  }
  // قائمة الموبايل
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("show");
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle("show");
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () {
      sidebar.classList.remove("show");
      sidebarOverlay.classList.remove("show");
    });
  }

  // تحميل الصفحة الرئيسية تلقائيًا
  const homeMenuItem = document.querySelector(
    ".menu li[onclick=\"changeContent('home')\"]"
  );
  if (homeMenuItem) {
    homeMenuItem.classList.add("active");
  }

  loadDashboardContent();
});

// Function to load dashboard content

function loadDashboardContent() {
  const content = document.getElementById("content");

  const pagePath = "dashboard.html";
  const scriptPath = "../Java script/dashboards.js";

  fetch(pagePath)
    .then((res) => res.text())
    .then((html) => {
      // Extract only the body content, not the entire HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Get the body content
      const bodyContent = tempDiv.querySelector("body");
      if (bodyContent) {
        content.innerHTML = bodyContent.innerHTML;
      } else {
        content.innerHTML = html;
      }

      // Load the script if specified
      if (scriptPath) {
        // Remove existing script with the same path
        const existingScript = document.querySelector(
          `script[src="${scriptPath}"]`
        );

        if (existingScript) {
          existingScript.remove();
        }
        // Clean up global variables that might cause redeclaration issues
        cleanupGlobalVariables();

        const script = document.createElement("script");

        script.src = scriptPath;
        script.defer = true;

        // Add error handling for script loading
        script.onerror = function () {
          console.error(`Failed to load script: ${scriptPath}`);
        };

        // Add onload handler for dashboard script
        script.onload = function () {
          console.log("Dashboard script loaded successfully");

          // Force initialization if the function exists
          if (typeof initializeDashboard === "function") {
            initializeDashboard();
          }
        };
        document.body.appendChild(script);
      }
    })
    .catch((err) => {
      content.innerHTML = "<p>حدث خطأ أثناء تحميل الصفحة.</p>";
      console.error(err);
    });
}

function showLogoutPopup() {
  const popup = document.getElementById("logoutPopup");
  if (popup) popup.classList.add("show");
}

function hideLogoutPopup() {
  const popup = document.getElementById("logoutPopup");
  if (popup) popup.classList.remove("show");
}

function clearAuthData() {
  localStorage.removeItem("userName");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("payload");
}

function logout() {
  clearAuthData();
  window.location.href = "Login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  const userRole = localStorage.getItem("userRole");
  document.querySelectorAll(".menu li").forEach((li) => {
    const roles = li.getAttribute("data-role");
    if (roles && roles !== "all") {
      const allowedRoles = roles.split(",").map((r) => r.trim());
      if (!allowedRoles.includes(userRole)) {
        li.style.display = "none";
      }
    }
  });
});

function changeContent(page) {
  const content = document.getElementById("content");
  let pagePath = "";
  let scriptPath = "";

  switch (page) {
    case "home":
      pagePath = `dashboard.html`;
      scriptPath = "../Java script/dashboards.js";
      break;

    case "cars":
      pagePath = "car-Managment/carList.html";
      scriptPath = "../../Java script/car-Managment/carList.js";
      break;

    case "drivers":
      pagePath = "driver-Managment/driverList.html";
      scriptPath = "../../Java script/driver-Managment/driverList.js";
      break;

    case "orders":
      pagePath = "orderList.html";
      scriptPath = "../../Java script/orderList.js";
      break;

    case "consumables":
      pagePath = "disposalList.html";
      scriptPath = "../../Java script/disposalList.js";
      break;

    case "spareParts":
      pagePath = "sparePartsList.html";
      scriptPath = "../../Java script/sparePartsList.js";
      break;

    case "patrols":
      pagePath = "patrol-Managment/patrolList.html";
      scriptPath = "../../Java script/patrol-Managment/patrolList.js";
      break;

    case "patrolsSubscriptions":
      pagePath = "patrol-Managment/subscriptionList.html";
      scriptPath = "../../Java script/patrol-Managment/subscriptionList.js";
      break;

    case "employees":
      pagePath = "employee-Managment/employeesList.html";
      scriptPath = "../../Java script/employee-Managment/employeesList.js";
      break;

    default:
      pagePath = "dash-Boards/index.html";
      scriptPath = "";
  }

  fetch(pagePath)
    .then((res) => res.text())
    .then((html) => {
      // Extract only the body content, not the entire HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Get the body content
      const bodyContent = tempDiv.querySelector("body");
      if (bodyContent) {
        content.innerHTML = bodyContent.innerHTML;
      } else {
        content.innerHTML = html;
      }

      // Load the script if specified
      if (scriptPath) {
        // Remove existing script with the same path
        const existingScript = document.querySelector(
          `script[src="${scriptPath}"]`
        );

        if (existingScript) {
          existingScript.remove();
        }

        // Clean up global variables that might cause redeclaration issues
        cleanupGlobalVariables();
        const script = document.createElement("script");
        script.src = scriptPath;
        script.defer = true;

        // Add error handling for script loading
        script.onerror = function () {
          console.error(`Failed to load script: ${scriptPath}`);
        };
        document.body.appendChild(script);
      }
    })
    .catch((err) => {
      content.innerHTML = "<p>حدث خطأ أثناء تحميل الصفحة.</p>";
      console.error(err);
    });

  const menuItems = document.querySelectorAll(".menu li");
  menuItems.forEach((item) => item.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

// Function to clean up global variables that might cause redeclaration issues
function cleanupGlobalVariables() {
  // Common variable names that might be redeclared
  const commonVars = [
    "consumables",
    "editIndex",
    "allCars",
    "drivers",
    "parts",
    "vehicles",
    "buses",
    "orders",
    "patrols",
    "subscriptions",
    "employees",
    "users",
    "maintenanceRequests",
    "missionNotes",
    "missionOrders",
    "purchaseOrders",
    "withdrawOrders",
    "maintenanceRecords",
  ];

  // Don't clean up DOM element references as they need to be reinitialized
  // Only clean up data arrays and state variables
  commonVars.forEach((varName) => {
    if (window.hasOwnProperty(varName)) {
      try {
        delete window[varName];
      } catch (e) {
        // If deletion fails, set to undefined
        window[varName] = undefined;
      }
    }
  });
}
