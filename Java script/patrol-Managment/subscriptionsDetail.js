document.addEventListener("DOMContentLoaded", async () => {
  if (typeof token === "undefined") var token = localStorage.getItem("token");
  if (typeof userRole === "undefined")
    var userRole = localStorage.getItem("userRole");
  if (typeof userName === "undefined")
    var userName = localStorage.getItem("userName");

  const employeeId = new URLSearchParams(window.location.search).get("id");

  const saveBtn = document.querySelector(".save-btn");
  const delBtn = document.querySelector(".delete-btn");
  const printBtn = document.querySelector(".print-btn");
  const backBtn = document.querySelector(".back-btn");
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const subscriptionItems = document.querySelector(".subscription-items");

  let employee = { subscriptions: [] };
  let patrolsMap = new Map();

  async function loadEmployee() {
    const res = await fetch(
      `https://movesmartapi.runasp.net/api/PatrolsSubscriptions/AllForEmployee/${employeeId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw "❌ خطأ تحميل الموظف";
    const data = await res.json();
    return {
      ...data.employee,
      subscriptions: data.$values || [],
    };
  }

  async function loadPatrols() {
    const res = await fetch(`https://movesmartapi.runasp.net/api/Patrols/All`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw "❌ خطأ تحميل الدوريات";
    const result = await res.json();
    const list = result.$values || [];

    list.forEach((p) => {
      patrolsMap.set(p.patrolID, p);
    });

    return list;
  }

  function fillEmployeeInfo(data) {
    employee = data;

    document.getElementById("employee-name").textContent =
      data.name || "اسم غير متوفر";
    document.getElementById("employee-phone").textContent = `رقم الهاتف: ${
      data.phone || "غير متوفر"
    }`;

    document.querySelector('input[name="employeeName"]').value =
      data.name || "";
    document.querySelector('input[name="employeePhone"]').value =
      data.phone || "";
    document.querySelector('input[name="employeeNationalId"]').value =
      data.nationalNo || "";
    document.querySelector('input[name="employeeJobTitle"]').value =
      data.jobTitle || "";

    renderSubs();
  }

  function renderSubs() {
    subscriptionItems.innerHTML = "";
    if (!employee.subscriptions.length) {
      subscriptionItems.innerHTML = "<div>لا يوجد اشتراكات</div>";
      return;
    }

    employee.subscriptions.forEach((s) => {
      const patrol = patrolsMap.get(s.patrolID); // ✅ التصليح هنا
      const patrolText = patrol
        ? `${patrol.patrolID} - ${new Date(patrol.movingAt).toLocaleString(
            "ar-EG"
          )}`
        : `ID: ${s.patrolID}`;

      const div = document.createElement("div");
      div.className = "subscription-item";
      div.innerHTML = `
        <div>${patrolText}</div>
        <div>${
          s.movingAt ? new Date(s.movingAt).toLocaleString("ar-EG") : "-"
        }</div>
        <div>${s.approximatedTime || "-"}</div>
        <div>${s.status || "-"}</div>
      `;
      subscriptionItems.appendChild(div);
    });
  }

  async function saveEmployee() {
    const body = {
      employeeID: +employeeId,
      name: document.querySelector('input[name="employeeName"]').value,
      phone: document.querySelector('input[name="employeePhone"]').value,
      nationalNo: document.querySelector('input[name="employeeNationalId"]')
        .value,
      jobTitle: document.querySelector('input[name="employeeJobTitle"]').value,
    };

    const res = await fetch(`https://movesmartapi.runasp.net/api/Employees`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) alert("✅ تم الحفظ بنجاح");
    else alert("❌ فشل في حفظ البيانات");
  }

  // الأحداث
  saveBtn.addEventListener("click", saveEmployee);
  delBtn.addEventListener("click", () => {
    if (confirm("⚠️ هل أنت متأكد من حذف البيانات؟")) {
      saveEmployee(); // يمكن استبداله بـ DELETE لو عاوز تحذف فعلاً
    }
  });
  printBtn.addEventListener("click", () => window.print());
  backBtn.addEventListener("click", () => history.back());

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      tabContents.forEach((c) => (c.style.display = "none"));
      document.getElementById(t.dataset.tab).style.display = "block";
    });
  });

  // التهيئة
  try {
    const [empData, _] = await Promise.all([loadEmployee(), loadPatrols()]);
    fillEmployeeInfo(empData);
  } catch (e) {
    console.error(e);
    alert("❌ حدث خطأ أثناء التحميل");
  }
});
