let allSubscribers = [];

async function fetchSubscribers() {
  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Employees/All",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) throw new Error("فشل في جلب البيانات");

    const data = await response.json();
    allSubscribers = data.$values || [];
    renderSubscribers(allSubscribers);
  } catch (error) {
    console.error(error);
    showNotification("حدث خطأ أثناء تحميل المشتركين");
  }
}

function renderSubscribers(list) {
  const tbody = document.getElementById("subscriberList");
  tbody.innerHTML = "";

  list.forEach((sub) => {
    const statusText =
      sub.transportationSubscriptionStatus === 1 ? "متاحة" : "منتهية";
    const statusClass =
      sub.transportationSubscriptionStatus === 1
        ? "status-active"
        : "status-ended";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>≡</td>
      <td>${sub.phone}</td>
      <td><span class="${statusClass}">${statusText}</span></td>
      <td>${sub.name}</td>
    `;
    // عند الضغط على الصف انتقل لصفحة التفاصيل مع تمرير employeeID
    tr.style.cursor = "pointer";
    tr.onclick = () => {
      window.location.href = `subscriptionDetail.html?id=${sub.employeeID}`;
    };
    tbody.appendChild(tr);
  });

  document.getElementById("totalCount").textContent = list.length;
}

document.getElementById("refreshBtn").onclick = fetchSubscribers;

document.getElementById("addSubscriber").onclick = () => {
  document.getElementById("popup").classList.remove("hidden");
};

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

document.getElementById("filterBtn").onclick = () => {
  document.getElementById("filterMenu").classList.toggle("hidden");
};

function toggleNameFilter() {
  document.getElementById("nameFilter").classList.toggle("hidden");
  document.getElementById("statusFilter").classList.add("hidden");
}

function toggleStatusFilter() {
  document.getElementById("statusFilter").classList.toggle("hidden");
  document.getElementById("nameFilter").classList.add("hidden");
}

function filterByName() {
  const name = document.getElementById("nameInput").value.trim();
  const filtered = allSubscribers.filter((s) => s.name.includes(name));
  renderSubscribers(filtered);
  document.getElementById("filterMenu").classList.add("hidden");
  document.getElementById("nameFilter").classList.add("hidden");
}

function filterByStatus(statusText) {
  const status = statusText === "متاحة" ? 1 : 0;
  const filtered = allSubscribers.filter(
    (s) => s.transportationSubscriptionStatus === status
  );
  renderSubscribers(filtered);
  document.getElementById("filterMenu").classList.add("hidden");
  document.getElementById("statusFilter").classList.add("hidden");
}

function showNotification(message) {
  const note = document.getElementById("notification");
  note.textContent = message;
  note.classList.remove("hidden");

  setTimeout(() => {
    note.classList.add("hidden");
  }, 3000);
}

async function saveNewSubscriber() {
  const nameInput = document.getElementById("newName");
  const phoneInput = document.getElementById("newPhone");
  const jobInput = document.getElementById("newJob");
  const idInput = document.getElementById("newId");

  [nameInput, phoneInput, jobInput, idInput].forEach((input) =>
    input.classList.remove("input-error")
  );

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const jobTitle = jobInput.value.trim();
  const nationalNo = idInput.value.trim();

  if (!name) {
    nameInput.classList.add("input-error");
    showNotification("يرجى إدخال الاسم");
    return;
  }

  if (!/^01[0-9]{9}$/.test(phone)) {
    phoneInput.classList.add("input-error");
    showNotification("يرجى إدخال رقم محمول صحيح");
    return;
  }

  if (!jobTitle) {
    jobInput.classList.add("input-error");
    showNotification("يرجى إدخال المسمى الوظيفي");
    return;
  }

  if (!/^[0-9]{14}$/.test(nationalNo)) {
    idInput.classList.add("input-error");
    showNotification("يرجى إدخال رقم قومي صحيح");
    return;
  }

  const newSubscriber = {
    nationalNo,
    name,
    jobTitle,
    phone,
    transportationSubscriptionStatus: 1,
  };

  try {
    const response = await fetch(
      "https://movesmartapi.runasp.net/api/Employees",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSubscriber),
      }
    );

    if (!response.ok) throw new Error("فشل في حفظ المشترك");

    showNotification("تمت إضافة المشترك بنجاح");
    closePopup();
    await fetchSubscribers();

    nameInput.value = "";
    phoneInput.value = "";
    jobInput.value = "";
    idInput.value = "";
  } catch (error) {
    console.error(error);
    showNotification("حدث خطأ أثناء حفظ المشترك");
  }
}

// ✅ Main init
(async function init() {
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

  await fetchSubscribers();
})();
