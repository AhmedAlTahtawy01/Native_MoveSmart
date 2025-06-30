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

console.log('=== EmployeeDetails.js Authentication Debug ===');
console.log('Token exists:', !!token);
console.log('User Role:', userRole);
console.log('User Name:', userName);
console.log('===========================================');

// Detect if we're in shared layout context
var isInSharedLayout = window.location.pathname.includes('sharedLayout.html') || 
                        (window.location.pathname.includes('Pages') && !window.location.pathname.includes('employee-Managment')) ||
                        typeof changeContent === 'function';

// Get current employee ID to check if we need to reinitialize
var currentEmployeeId = new URLSearchParams(window.location.search).get("id");
var storedEmployeeId = sessionStorage.getItem("selectedEmployeeId");
var targetEmployeeId = currentEmployeeId || storedEmployeeId;

// Force re-initialization if employee ID changed or if we have a new stored employee ID
if (window.lastEmployeeId && window.lastEmployeeId !== targetEmployeeId) {
  console.log('Employee ID changed from', window.lastEmployeeId, 'to', targetEmployeeId, '- forcing re-initialization');
  window.employeeDetailsInitialized = false;
}

// Also force re-initialization if we have a stored employee ID that's different from the current one
if (storedEmployeeId && storedEmployeeId !== currentEmployeeId) {
  console.log('New employee selected from sessionStorage:', storedEmployeeId, '- forcing re-initialization');
  window.employeeDetailsInitialized = false;
  window.lastEmployeeId = null; // Reset to force initialization
}

console.log('=== EmployeeDetails.js Initialization Debug ===');
console.log('Current Employee ID from URL:', currentEmployeeId);
console.log('Stored Employee ID from sessionStorage:', storedEmployeeId);
console.log('Target Employee ID:', targetEmployeeId);
console.log('Is in shared layout:', isInSharedLayout);
console.log('Window employeeDetailsInitialized:', window.employeeDetailsInitialized);
console.log('Window lastEmployeeId:', window.lastEmployeeId);
console.log('===========================================');

// Check if we need to re-initialize (different employee or first time)
var shouldInitialize = true; // Always initialize to ensure proper employee switching

// Force initialization if this is a fresh page load or if we have a new employee
if (!window.employeeDetailsInitialized || storedEmployeeId || currentEmployeeId) {
  shouldInitialize = true;
  console.log('Forcing initialization - fresh load or new employee detected');
}

// Additional check: if we have a stored employee ID that's different from the current URL, force initialization
if (storedEmployeeId && storedEmployeeId !== currentEmployeeId) {
  console.log('New employee detected in sessionStorage:', storedEmployeeId, 'vs URL:', currentEmployeeId);
  shouldInitialize = true;
}

console.log('Should initialize:', shouldInitialize);

if (shouldInitialize) {
  // Check if we're on the employee details page by looking for key elements
  var isEmployeeDetailsPage = document.querySelector('.save-btn') || 
                             document.querySelector('#employee-name') ||
                             document.querySelector('input[name="employeeName"]');
  
  if (!isEmployeeDetailsPage && isInSharedLayout) {
    console.log('Employee details page elements not found, skipping initialization');
  } else {
    // Update the initialization flag and last employee ID
    window.employeeDetailsInitialized = true;
    window.lastEmployeeId = targetEmployeeId;

    console.log('Initializing employee details for employee ID:', targetEmployeeId);
    console.log('Previous employee ID was:', window.lastEmployeeId);

    // Initialize function that works in both contexts
    function initializeEmployeeDetails() {
      const saveButton = document.querySelector(".save-btn");
      const deleteButton = document.querySelector(".delete-btn");
      const printButton = document.querySelector(".print-btn");
      const backButton = document.querySelector(".back-btn");
      const tabs = document.querySelectorAll(".tab");
      const tabContents = document.querySelectorAll(".tab-content");
      const subscriptionItems = document.querySelector(".subscription-items");

      // Get employee ID from URL parameters or sessionStorage
      function getEmployeeId() {
        let employeeId;
        
        if (isInSharedLayout) {
          // In shared layout, prioritize sessionStorage over URL
          employeeId = sessionStorage.getItem("selectedEmployeeId");
          if (employeeId) {
            // Update URL without page reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set("id", employeeId);
            window.history.replaceState({}, "", newUrl);
            // Clear from sessionStorage
            sessionStorage.removeItem("selectedEmployeeId");
            console.log('Using employee ID from sessionStorage:', employeeId);
            return employeeId;
          }
        }
        
        // Fallback to URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        employeeId = urlParams.get("id");
        
        if (!employeeId) {
          employeeId = sessionStorage.getItem("selectedEmployeeId");
          if (employeeId) {
            // Update URL without page reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set("id", employeeId);
            window.history.replaceState({}, "", newUrl);
            // Clear from sessionStorage
            sessionStorage.removeItem("selectedEmployeeId");
          }
        }
        
        console.log('getEmployeeId() returned:', employeeId);
        return employeeId;
      }

      // Load employee data
      function loadEmployeeData() {
        const employeeId = getEmployeeId();
        
        console.log('loadEmployeeData() called with employee ID:', employeeId);
        
        if (!employeeId) {
          console.error("No employee ID found");
          alert("❌ معرف الموظف غير متوفر");
          return;
        }

        console.log("Loading data for employee ID:", employeeId);

        fetch(`https://movesmartapi.runasp.net/api/Employees/ByID/${employeeId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("فشل في تحميل بيانات الموظف");
            return res.json();
          })
          .then((data) => {
            console.log("بيانات الموظف:", data);
            console.log("Employee ID from API response:", data.employeeID);
            
            // Update employee info display
            const employeeNameElement = document.getElementById("employee-name");
            const employeePhoneElement = document.getElementById("employee-phone");
            
            if (employeeNameElement) {
              employeeNameElement.textContent = data.name || "اسم غير متوفر";
              console.log("Updated employee name display:", data.name);
            }
            if (employeePhoneElement) {
              employeePhoneElement.textContent = `رقم الهاتف: ${data.phone || "غير متوفر"}`;
              console.log("Updated employee phone display:", data.phone);
            }

            // Update form fields
            const nameInput = document.querySelector('input[name="employeeName"]');
            const phoneInput = document.querySelector('input[name="employeePhone"]');
            const nationalIdInput = document.querySelector('input[name="employeeNationalId"]');
            const jobTitleInput = document.querySelector('input[name="employeeJobTitle"]');

            if (nameInput) {
              nameInput.value = data.name || "";
              console.log("Updated name input:", data.name);
            }
            if (phoneInput) {
              phoneInput.value = data.phone || "";
              console.log("Updated phone input:", data.phone);
            }
            if (nationalIdInput) {
              nationalIdInput.value = data.nationalNo || "";
              console.log("Updated national ID input:", data.nationalNo);
            }
            if (jobTitleInput) {
              jobTitleInput.value = data.jobTitle || "";
              console.log("Updated job title input:", data.jobTitle);
            }

            // Load subscriptions for this employee
            loadEmployeeSubscriptions(employeeId);
          })
          .catch((error) => {
            console.error("Error fetching employee data:", error);
            alert("❌ حدث خطأ أثناء تحميل بيانات الموظف");
          });
      }

      // Load employee subscriptions
      function loadEmployeeSubscriptions(employeeId) {
        fetch(`https://movesmartapi.runasp.net/api/PatrolsSubscriptions/AllForEmployee/${employeeId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) {
              if (res.status === 404) {
                // No subscriptions found
                console.log('No subscriptions found for employee ID:', employeeId);
                renderSubscriptions([]);
                return null; // Return null to indicate no data
              }
              throw new Error("فشل في تحميل الاشتراكات");
            }
            return res.json();
          })
          .then((data) => {
            if (data === null) {
              // Already handled 404 case
              return;
            }
            const subscriptions = data && data.$values ? data.$values : [];
            console.log('Loaded subscriptions:', subscriptions);
            renderSubscriptions(subscriptions);
          })
          .catch((error) => {
            console.error("Error fetching subscriptions:", error);
            renderSubscriptions([]);
          });
      }

      // Render subscriptions
      function renderSubscriptions(subscriptions) {
        if (!subscriptionItems) return;

        subscriptionItems.innerHTML = "";
        
        if (!subscriptions.length) {
          subscriptionItems.innerHTML = "<div class='no-subscriptions'>لا يوجد اشتراكات</div>";
          return;
        }

        console.log('Rendering subscriptions:', subscriptions);

        // Helper function to get status text
        function getStatusText(status) {
          switch (status) {
            case 0:
              return "صالح";
            case 1:
              return "منتهي الصلاحية";
            case 2:
              return "غير مشترك";
            default:
              return "غير محدد";
          }
        }

        // Helper function to get status class for styling
        function getStatusClass(status) {
          switch (status) {
            case 0:
              return "status-valid";
            case 1:
              return "status-expired";
            case 2:
              return "status-unsubscribed";
            default:
              return "status-unknown";
          }
        }

        subscriptions.forEach((subscription) => {
          console.log('Processing subscription:', subscription);
          
          const div = document.createElement("div");
          div.className = "subscription-item";
          div.innerHTML = `
            <div>رقم الدورية: ${subscription.patrolID}</div>
            <div>رقم الاشتراك: ${subscription.subscriptionID}</div>
            <div class="${getStatusClass(subscription.transportationSubscriptionStatus)}">${getStatusText(subscription.transportationSubscriptionStatus)}</div>
          `;
          subscriptionItems.appendChild(div);
        });
      }

      // Save employee function
      function saveEmployee() {
        const employeeId = getEmployeeId();
        
        if (!employeeId) {
          alert("❌ معرف الموظف غير متوفر");
          return;
        }

        const nameInput = document.querySelector('input[name="employeeName"]');
        const phoneInput = document.querySelector('input[name="employeePhone"]');
        const nationalIdInput = document.querySelector('input[name="employeeNationalId"]');
        const jobTitleInput = document.querySelector('input[name="employeeJobTitle"]');

        const updatedEmployee = {
          employeeID: parseInt(employeeId),
          name: nameInput ? nameInput.value : "",
          phone: phoneInput ? phoneInput.value : "",
          nationalNo: nationalIdInput ? nationalIdInput.value : "",
          jobTitle: jobTitleInput ? jobTitleInput.value : "",
        };

        fetch(`https://movesmartapi.runasp.net/api/Employees`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedEmployee),
        })
          .then((res) => {
            if (!res.ok) throw new Error("فشل في تحديث البيانات");
            return res.text();
          })
          .then(() => {
            alert("✅ تم حفظ التعديلات بنجاح!");
            loadEmployeeData(); // Reload data to show updated info
          })
          .catch((err) => {
            console.error(err);
            alert("❌ حدث خطأ أثناء الحفظ!");
          });
      }

      // Delete employee function
      function deleteEmployee() {
        if (confirm("⚠ هل أنت متأكد من حذف بيانات الموظف؟")) {
          const employeeId = getEmployeeId();
          
          if (!employeeId) {
            alert("❌ معرف الموظف غير متوفر");
            return;
          }

          fetch(`https://movesmartapi.runasp.net/api/Employees/ByID/${employeeId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => {
              if (!res.ok) throw new Error("فشل في حذف البيانات");
              alert("✅ تم حذف بيانات الموظف!");
              
              // Navigate back
              if (isInSharedLayout && typeof changeContent === 'function') {
                changeContent('employees');
              } else {
                window.history.back();
              }
            })
            .catch((err) => {
              console.error(err);
              alert("❌ حدث خطأ أثناء الحذف!");
            });
        }
      }

      // Event listeners - Remove existing listeners to prevent duplicates
      if (saveButton) {
        // Remove existing event listeners
        const newSaveBtn = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveBtn, saveButton);
        newSaveBtn.addEventListener("click", saveEmployee);
      }

      if (deleteButton) {
        const newDeleteBtn = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteBtn, deleteButton);
        newDeleteBtn.addEventListener("click", deleteEmployee);
      }

      if (printButton) {
        const newPrintBtn = printButton.cloneNode(true);
        printButton.parentNode.replaceChild(newPrintBtn, printButton);
        newPrintBtn.addEventListener("click", function () {
          window.print();
        });
      }

      if (backButton) {
        const newBackBtn = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackBtn, backButton);
        newBackBtn.addEventListener("click", function () {
          // Clean up before navigating away
          cleanupEmployeeDetails();
          
          // Handle back navigation based on context
          if (isInSharedLayout && typeof changeContent === 'function') {
            // Navigate back to employees list in shared layout
            changeContent('employees');
          } else {
            // Navigate back in standalone mode
            window.history.back();
          }
        });
      }

      // Tab navigation - Remove existing listeners
      if (tabs.length > 0) {
        tabs.forEach((tab) => {
          const newTab = tab.cloneNode(true);
          tab.parentNode.replaceChild(newTab, tab);
          
          newTab.addEventListener("click", function () {
            tabs.forEach((t) => t.classList.remove("active"));
            newTab.classList.add("active");

            tabContents.forEach((content) => (content.style.display = "none"));
            const targetContent = document.getElementById(newTab.dataset.tab);
            if (targetContent) {
              targetContent.style.display = "block";
            }

            // Show/hide save button based on active tab
            const currentSaveBtn = document.querySelector(".save-btn");
            if (currentSaveBtn) {
              currentSaveBtn.style.display =
                newTab.dataset.tab === "employee-info" ? "block" : "none";
            }
          });
        });
      }

      // Cleanup function to reset state when navigating away
      function cleanupEmployeeDetails() {
        console.log('Cleaning up employee details state');
        // Clear any cached data or state that might interfere with next employee
        if (subscriptionItems) {
          subscriptionItems.innerHTML = "";
        }
        
        // Clear form fields
        const nameInput = document.querySelector('input[name="employeeName"]');
        const phoneInput = document.querySelector('input[name="employeePhone"]');
        const nationalIdInput = document.querySelector('input[name="employeeNationalId"]');
        const jobTitleInput = document.querySelector('input[name="employeeJobTitle"]');
        
        if (nameInput) nameInput.value = "";
        if (phoneInput) phoneInput.value = "";
        if (nationalIdInput) nationalIdInput.value = "";
        if (jobTitleInput) jobTitleInput.value = "";
        
        // Clear display elements
        const employeeNameElement = document.getElementById("employee-name");
        const employeePhoneElement = document.getElementById("employee-phone");
        
        if (employeeNameElement) employeeNameElement.textContent = "";
        if (employeePhoneElement) employeePhoneElement.textContent = "";
        
        // Clear initialization flag to ensure fresh initialization on return
        window.employeeDetailsInitialized = false;
        window.lastEmployeeId = null;
        console.log('Cleared initialization flags for fresh start');
      }

      // Initialize the page
      loadEmployeeData();
      
      // Set default active tab
      const defaultTab = document.querySelector("[data-tab='employee-info']");
      if (defaultTab) {
        defaultTab.click();
      }
      
      // Add cleanup on page unload
      window.addEventListener('beforeunload', function() {
        cleanupEmployeeDetails();
      });
      
      // Add cleanup when navigating away in shared layout
      if (isInSharedLayout) {
        window.addEventListener('popstate', function() {
          cleanupEmployeeDetails();
        });
      }
    }

    // Initialize based on context
    if (isInSharedLayout) {
      // In shared layout, initialize immediately
      initializeEmployeeDetails();
    } else {
      // In standalone mode, wait for DOM to be ready
      document.addEventListener("DOMContentLoaded", initializeEmployeeDetails);
    }
  }
}