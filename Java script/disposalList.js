console.log(window.token, window.userRole, window.userName, window.role);
// Navigation functionality
document.addEventListener("DOMContentLoaded", function () {

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  const pageTitle = document.querySelector(".page-title");
  pageTitle.style.cursor = "pointer";
  pageTitle.addEventListener("click", function () {
    window.location.href = `../dash-Boards/${userRole.toLowerCase()}Dashboard.html`;
  });
});

var consumables = [];
var editIndex = null;

// Declare variables globally to prevent redeclaration errors
var listEl, cardsContainer, totalSpan, searchInput, addBtnSubmit, editBtnSubmit;

// Function to initialize DOM elements
function initializeElements() {
  listEl = document.getElementById("consumables");
  cardsContainer = document.getElementById("consumablesCards");
  totalSpan = document.getElementById("total");
  searchInput = document.getElementById("search");
  addBtnSubmit = document.getElementById("addBtnSubmit");
  editBtnSubmit = document.getElementById("editBtnSubmit");
  
  // Debug logging
  console.log("Initializing disposal elements:", {
    listEl: !!listEl,
    cardsContainer: !!cardsContainer,
    totalSpan: !!totalSpan,
    searchInput: !!searchInput,
    addBtnSubmit: !!addBtnSubmit,
    editBtnSubmit: !!editBtnSubmit
  });
}

// Initialize elements when script loads
initializeElements();

// Also initialize when DOM is ready (in case script loads before DOM)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeElements);
} else {
  // DOM is already ready
  initializeElements();
}

// Add a small delay to ensure DOM is fully ready before fetching data
setTimeout(() => {
  console.log("Delayed initialization and data fetch for disposals");
  initializeElements();
  fetchConsumables();
}, 100);

// فتح البوب أب
function openPop() {
  document.getElementById("addPartPopup").classList.remove("hidden");
  addBtnSubmit.classList.remove("hidden");
  editBtnSubmit.classList.add("hidden");
  clearInputs();
}

// إغلاق البوب أب
function closePop() {
  document.getElementById("addPartPopup").classList.add("hidden");
  editIndex = null;
  clearInputs();
}

// مسح الحقول
function clearInputs() {
  document.getElementById("newconsumableName").value = "";
  document.getElementById("newQuantity").value = "";
  document.getElementById("newLifetime").value = "";
}

// جلب البيانات
async function fetchConsumables() {
  try {
    // Reinitialize elements if they're not available
    if (!listEl || !cardsContainer || !totalSpan) {
      console.log("Reinitializing elements in fetchConsumables");
      initializeElements();
    }
    
    const res = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    console.log("Fetched consumables data:", data);
    consumables = Array.isArray(data.$values) ? data.$values : [];
    console.log("Consumables array:", consumables);
    renderConsumablesList();
  } catch (err) {
    console.error("خطأ في جلب المستهلكات:", err);
  }
}

// عرض القائمة والكروت
function renderConsumablesList() {
  console.log("Rendering consumables list. Elements available:", {
    listEl: !!listEl,
    cardsContainer: !!cardsContainer,
    totalSpan: !!totalSpan,
    consumablesLength: consumables.length
  });
  
  // Reinitialize elements if they're not available
  if (!listEl || !cardsContainer || !totalSpan) {
    console.log("Elements not available, reinitializing...");
    initializeElements();
  }
  
  // Double check after reinitialization
  if (!listEl || !cardsContainer || !totalSpan) {
    console.error("Failed to initialize DOM elements");
    return;
  }
  
  listEl.innerHTML = "";
  cardsContainer.innerHTML = "";

  if (consumables.length === 0) {
    listEl.innerHTML = "<li>لا توجد مستهلكات حالياً.</li>";
  } else {
    consumables.forEach((item, index) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.onclick = () => toggleCard(index);
      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(` ${item.consumableName}`));
      listEl.appendChild(li);
    });
  }

  totalSpan.innerText = consumables.length;
  console.log("Consumables rendering completed");
}

// عرض الكارت
function toggleCard(index) {
  const existing = document.getElementById(`card-${index}`);
  if (existing) return existing.remove();

  const item = consumables[index];
  const card = document.createElement("div");
  card.className = "card";
  card.id = `card-${index}`;
  card.innerHTML = `
    <h3>${item.consumableName}</h3>
    <div class="card-details">
      <p><strong>الكمية:</strong> ${item.quantity}</p>
      <p><strong>العمر الافتراضي:</strong> ${item.validityLength} يوم</p>
    </div>
    <div class="card-buttons">
      <button onclick="editItem(${index})">✏️ تعديل</button>
      <button onclick="deleteItem(${index})">🗑️ حذف</button>
    </div>
  `;
  cardsContainer.appendChild(card);
}

// بدء التعديل
function editItem(index) {
  editIndex = index;
  const item = consumables[index];
  document.getElementById("newconsumableName").value = item.consumableName;
  document.getElementById("newQuantity").value = item.quantity;
  document.getElementById("newLifetime").value = item.validityLength;

  document.getElementById("addPartPopup").classList.remove("hidden");
  addBtnSubmit.classList.add("hidden");
  editBtnSubmit.classList.remove("hidden");
}

// حذف
async function deleteItem(index) {
  const confirmDelete = confirm("هل تريد حذف المستهلك؟");
  if (!confirmDelete) return;

  try {
    const id = consumables[index].consumableId;
    await fetch(`https://movesmartapi.runasp.net/api/VehicleConsumable/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchConsumables();
  } catch (err) {
    console.error("فشل الحذف:", err);
  }
}

// إضافة
async function addItem() {
  const newItem = {
    consumableId: 0,
    consumableName: document.getElementById("newconsumableName").value,
    quantity: +document.getElementById("newQuantity").value,
    validityLength: +document.getElementById("newLifetime").value,
  };

  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      }
    );

    if (response.ok) {
      closePop();
      await fetchConsumables();
    } else {
      alert("فشل في الإضافة!");
    }
  } catch (err) {
    console.error("فشل الإضافة:", err);
  }
}

// تعديل
async function updatePart() {
  const updated = {
    consumableId: consumables[editIndex].consumableId,
    consumableName: document.getElementById("newconsumableName").value,
    quantity: +document.getElementById("newQuantity").value,
    validityLength: +document.getElementById("newLifetime").value,
  };

  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/VehicleConsumable",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      }
    );

    if (response.ok) {
      closePop();
      await fetchConsumables();
    } else {
      alert("فشل التعديل.");
    }
  } catch (err) {
    console.error("فشل التعديل:", err);
  }
}

// بحث
searchInput.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const filtered = consumables.filter((item) =>
    item.consumableName.toLowerCase().includes(keyword)
  );

  listEl.innerHTML = "";
  cardsContainer.innerHTML = "";

  if (filtered.length === 0) {
    listEl.innerHTML = "<li>لا توجد نتائج مطابقة.</li>";
  } else {
    filtered.forEach((item) => {
      const originalIndex = consumables.indexOf(item);
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.onclick = () => toggleCard(originalIndex);
      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(` ${item.consumableName}`));
      listEl.appendChild(li);
    });
  }

  totalSpan.innerText = filtered.length;
});

window.openPop = openPop;
window.closePop = closePop;
window.addItem = addItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.updatePart = updatePart;

fetchConsumables();
document.getElementById("refreshBtn").onclick = fetchConsumables;
