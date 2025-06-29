console.log(window.token, window.userRole, window.userName, window.role);
// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {

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

// Global variable declaration to prevent redeclaration errors
var employees = [];

function openPop() {
  document.getElementById("add-pop").classList.remove("hidden");
  clearAddForm();
}

function closePop() {
  document.getElementById("add-pop").classList.add("hidden");
  clearAddForm();
}

// Clear add form
function clearAddForm() {
  document.getElementById("employee-name").value = "";
  document.getElementById("national-no").value = "";
  document.getElementById("job-title").value = "";
  document.getElementById("employee-phone").value = "";
  clearAddErrors();
}

// Clear add form errors
function clearAddErrors() {
  const errorElements = document.querySelectorAll('#add-pop .error');
  errorElements.forEach(element => element.textContent = '');
}

async function submitEmployee() {
  const saveButton = document.querySelector(".pop-actions button:first-child");
  saveButton.disabled = true;

  const name = document.getElementById("employee-name").value.trim();
  const nationalNo = document.getElementById("national-no").value.trim();
  const jobTitle = document.getElementById("job-title").value.trim();
  const phone = document.getElementById("employee-phone").value.trim();

  if (!validate()) {
    saveButton.disabled = false;
    return;
  }

  const newEmployee = {
    employeeID: 0,
    nationalNo,
    name,
    jobTitle,
    phone
  };

  try {
    await addEmployee(newEmployee);

    // Clean up fields
    document.getElementById("employee-name").value = "";
    document.getElementById("national-no").value = "";
    document.getElementById("job-title").value = "";
    document.getElementById("employee-phone").value = "";

    // Show success message
    const successBox = document.getElementById("success-message");
    if (successBox) {
      successBox.classList.remove("hidden");
      setTimeout(() => {
        successBox.classList.add("hidden");
      }, 3000);
    }

    closePop();

  } catch (error) {
    console.error("فشل في إضافة الموظف:", error);
    alert("حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.");
  } finally {
    saveButton.disabled = false;
  }
}

async function loadEmployee() {
  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Employees/All",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn("⚠️ No employees found in database.");
        employees = [];
        displayEmployee([]);
        showNoEmployeesMessage();
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const employeesList = Array.isArray(data.$values) ? data.$values : [];

    employees = employeesList;
    displayEmployee(employeesList);
    
    // Hide no employees message if employees exist
    hideNoEmployeesMessage();
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
    employees = [];
    displayEmployee([]);
    showNoEmployeesMessage();
  }
}

function searchEmployee() {
  const searchTerm = document.getElementById("search").value.toLowerCase();

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.jobTitle.toLowerCase().includes(searchTerm) ||
      employee.phone.includes(searchTerm) ||
      employee.nationalNo.includes(searchTerm)
  );

  displayEmployee(filteredEmployees);
}

function displayEmployee(list) {
  const container = document.getElementById("employee-container");
  container.innerHTML = "";

  list.forEach((employee) => {
    const employeeCard = document.createElement("div");
    employeeCard.classList.add("card");

    employeeCard.innerHTML = `
      <p><strong></strong> ${employee.name}</p>
      <p><strong></strong> ${employee.jobTitle}</p>
      <p><strong></strong> ${employee.phone}</p>
    `;

    employeeCard.style.cursor = "pointer";
    employeeCard.addEventListener("click", () => {
      openEditPop(employee);
    });

    container.appendChild(employeeCard);
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
  const name = document.getElementById("employee-name").value.trim();
  const nationalNo = document.getElementById("national-no").value.trim();
  const jobTitle = document.getElementById("job-title").value.trim();
  const phone = document.getElementById("employee-phone").value.trim();

  let isValid = true;

  // Clear previous errors
  ["employee-name", "national-no", "job-title", "employee-phone"].forEach(id => {
    showFieldError(id, "");
  });

  if (!name || name.length < 2) {
    isValid = false;
    showFieldError("employee-name", "الاسم يجب أن يكون على الأقل حرفين.");
  }

  if (!/^\d{14}$/.test(nationalNo)) {
    isValid = false;
    showFieldError("national-no", "الرقم القومي يجب أن يكون 14 رقمًا.");
  }

  if (!jobTitle || jobTitle.length < 2) {
    isValid = false;
    showFieldError("job-title", "المسمى الوظيفي يجب أن يكون على الأقل حرفين.");
  }

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    isValid = false;
    showFieldError("employee-phone", "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقم.");
  }

  return isValid;
}

async function addEmployee(newEmployee) {
  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Employees",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEmployee),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error Text:", errorText);
      throw new Error("⚠️ خطأ في إضافة الموظف");
    }

    loadEmployee(); // Update the list
  } catch (error) {
    console.error("❌ خطأ أثناء الإضافة:", error);
    throw error;
  }
}

// Edit Employee Functions
function openEditPop(employee) {
  document.getElementById('edit-employee-id').value = employee.employeeID;
  document.getElementById('edit-employee-name').value = employee.name;
  document.getElementById('edit-national-no').value = employee.nationalNo;
  document.getElementById('edit-job-title').value = employee.jobTitle;
  document.getElementById('edit-employee-phone').value = employee.phone;
  
  document.getElementById('edit-pop').classList.remove('hidden');
  clearEditErrors();
}

function closeEditPop() {
  document.getElementById('edit-pop').classList.add('hidden');
  clearEditForm();
}

function clearEditForm() {
  document.getElementById('edit-employee-id').value = '';
  document.getElementById('edit-employee-name').value = '';
  document.getElementById('edit-national-no').value = '';
  document.getElementById('edit-job-title').value = '';
  document.getElementById('edit-employee-phone').value = '';
  clearEditErrors();
}

function clearEditErrors() {
  const errorElements = document.querySelectorAll('#edit-pop .error');
  errorElements.forEach(element => element.textContent = '');
}

function validateEdit() {
  const name = document.getElementById('edit-employee-name').value.trim();
  const nationalNo = document.getElementById('edit-national-no').value.trim();
  const jobTitle = document.getElementById('edit-job-title').value.trim();
  const phone = document.getElementById('edit-employee-phone').value.trim();

  let isValid = true;

  // Clear previous errors
  ["edit-employee-name", "edit-national-no", "edit-job-title", "edit-employee-phone"].forEach(id => {
    showFieldError(id, "");
  });

  if (!name || name.length < 2) {
    isValid = false;
    showFieldError("edit-employee-name", "الاسم يجب أن يكون على الأقل حرفين.");
  }

  if (!/^\d{14}$/.test(nationalNo)) {
    isValid = false;
    showFieldError("edit-national-no", "الرقم القومي يجب أن يكون 14 رقمًا.");
  }

  if (!jobTitle || jobTitle.length < 2) {
    isValid = false;
    showFieldError("edit-job-title", "المسمى الوظيفي يجب أن يكون على الأقل حرفين.");
  }

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    isValid = false;
    showFieldError("edit-employee-phone", "رقم الهاتف يجب أن يبدأ بـ 01 ويكون 11 رقم.");
  }

  return isValid;
}

async function updateEmployee() {
  const saveButton = document.querySelector("#edit-pop .pop-actions button:first-child");
  saveButton.disabled = true;

  if (!validateEdit()) {
    saveButton.disabled = false;
    return;
  }

  const employeeId = document.getElementById('edit-employee-id').value;
  const employeeData = {
    employeeID: parseInt(employeeId),
    nationalNo: document.getElementById('edit-national-no').value.trim(),
    name: document.getElementById('edit-employee-name').value.trim(),
    jobTitle: document.getElementById('edit-job-title').value.trim(),
    phone: document.getElementById('edit-employee-phone').value.trim()
  };

  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Employees",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error Text:", errorText);
      throw new Error("⚠️ خطأ في تحديث الموظف");
    }

    // Show success message
    const successBox = document.getElementById("edit-success-message");
    if (successBox) {
      successBox.classList.remove("hidden");
      setTimeout(() => {
        successBox.classList.add("hidden");
      }, 3000);
    }

    closeEditPop();
    loadEmployee(); // Update the list

  } catch (error) {
    console.error("❌ خطأ أثناء التحديث:", error);
    alert("حدث خطأ أثناء تحديث البيانات. حاول مرة أخرى.");
  } finally {
    saveButton.disabled = false;
  }
}

function refreshData() {
  loadEmployee();
}

// Function to show no employees message
function showNoEmployeesMessage() {
  const container = document.getElementById("employee-container");
  container.innerHTML = `
    <div class="no-employees-message">
      <p>لا يوجد موظفين في قاعدة البيانات</p>
      <p>اضغط على "إضافة موظف" لإضافة موظف جديد</p>
    </div>
  `;
  document.getElementById("total-count").innerText = "0";
}

// Function to hide no employees message
function hideNoEmployeesMessage() {
  const noEmployeesMessage = document.querySelector(".no-employees-message");
  if (noEmployeesMessage) {
    noEmployeesMessage.remove();
  }
}

loadEmployee();
