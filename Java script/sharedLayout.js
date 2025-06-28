document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

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

  // التابات حسب الرول
  const sidebarItems = document.querySelectorAll(".menu li");

  if (userRole) {
    const homeTab = sidebarItems[0]; 
    const carsTab = sidebarItems[1]; 
    const driversTab = sidebarItems[2]; 
    const employeesTab = sidebarItems[3]; 
    const ordersTab = sidebarItems[4]; 
    const patrolsTab = sidebarItems[5]; 
    const subscriptionsTab = sidebarItems[6]; 
    const consumablesTab = sidebarItems[7];
    const sparePartsTab = sidebarItems[8]; 

    function hideTabs(...tabs) {
      tabs.forEach(tab => {
        if (tab) tab.style.display = "none";
      });
    }

    if (userRole === "admin") {
      // كل التابات متاحة
    } else if (userRole === "generalSupervisor") {
      hideTabs(carsTab, driversTab, patrolsTab, subscriptionsTab, employeesTab);
    } else if (userRole === "generalManager") {
      hideTabs(carsTab, driversTab, patrolsTab, subscriptionsTab, consumablesTab, sparePartsTab, employeesTab);
    } else if (userRole === "patrolSupervisor") {
      hideTabs(carsTab, driversTab, ordersTab, consumablesTab, sparePartsTab, employeesTab);
    } else if (userRole === "workshopSupervisor") {
      hideTabs(carsTab, driversTab, patrolsTab, subscriptionsTab, employeesTab);
    }
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
  const homeMenuItem = document.querySelector('.menu li[onclick="changeContent(\'home\')"]');
  if (homeMenuItem) {
    homeMenuItem.classList.add("active");
  }

  loadDashboardContent();
});

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

function loadDashboardContent() {
  const content = document.getElementById("content");
  const pagePath = "dashboard.html";
  const scriptPath = "../Java script/dashboards.js";

  fetch(pagePath)
    .then((res) => res.text())
    .then((html) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      const bodyContent = tempDiv.querySelector('body');
      content.innerHTML = bodyContent ? bodyContent.innerHTML : html;

      if (scriptPath) {
        const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
        if (existingScript) existingScript.remove();

        const script = document.createElement("script");
        script.src = scriptPath;
        script.defer = true;

        script.onerror = function () {
          console.error(`فشل تحميل السكربت: ${scriptPath}`);
        };

        script.onload = function () {
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
