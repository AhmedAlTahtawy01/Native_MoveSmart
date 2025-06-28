document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  // Display the user's name
  const userNameElement = document.getElementById("userName");
  userNameElement.textContent = userName || "User";

  // Add logout functionality
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      showLogoutPopup();
    });
  }

  // Add event listeners for logout popup buttons
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

  // Add menu toggle functionality for mobile
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

  // Close sidebar when clicking overlay
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () {
      sidebar.classList.remove("show");
      sidebarOverlay.classList.remove("show");
    });
  }

  // Automatically load dashboard content when page loads
  // Set the home menu item as active
  const homeMenuItem = document.querySelector('.menu li[onclick="changeContent(\'home\')"]');
  if (homeMenuItem) {
    homeMenuItem.classList.add("active");
  }
  
  // Load dashboard content
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
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get the body content
      const bodyContent = tempDiv.querySelector('body');
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

        const script = document.createElement("script");
        script.src = scriptPath;
        script.defer = true;
        
        // Add error handling for script loading
        script.onerror = function() {
          console.error(`Failed to load script: ${scriptPath}`);
        };
        
        // Add onload handler for dashboard script
        script.onload = function() {
          console.log('Dashboard script loaded successfully');
          // Force initialization if the function exists
          if (typeof initializeDashboard === 'function') {
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

// Show logout confirmation popup
function showLogoutPopup() {
  const popup = document.getElementById("logoutPopup");
  if (popup) {
    popup.classList.add("show");
  }
}

// Hide logout confirmation popup
function hideLogoutPopup() {
  const popup = document.getElementById("logoutPopup");
  if (popup) {
    popup.classList.remove("show");
  }
}

// Clear authentication data from localStorage
function clearAuthData() {
  localStorage.removeItem("userName");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("payload");
}

// Logout user
function logout() {
  clearAuthData();
  window.location.href = "Login.html";
}

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
      pagePath = "employee-Managment/employeeList.html";
      scriptPath = "../../Java script/employee-Managment/employeeList.js";
      break;
    default:
      pagePath = "dash-Boards/index.html";
      scriptPath = "";
  }

  fetch(pagePath)
    .then((res) => res.text())
    .then((html) => {
      // Extract only the body content, not the entire HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get the body content
      const bodyContent = tempDiv.querySelector('body');
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

        const script = document.createElement("script");
        script.src = scriptPath;
        script.defer = true;
        
        // Add error handling for script loading
        script.onerror = function() {
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
