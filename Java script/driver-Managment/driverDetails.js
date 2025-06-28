document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.querySelector(".save-btn");
  const deleteButton = document.querySelector(".delete-btn");
  const printButton = document.querySelector(".print-btn");
  const backButton = document.querySelector(".back-btn");
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const inputs = document.querySelectorAll("input");
  const addVacationButton = document.querySelector(".add-vacation-btn");
  const vacationContent = document.querySelector(".vacation-content");
  const leaveModal = document.getElementById("leave-modal");
  const closeModal = document.querySelector(".close-modal");
  const saveLeaveButton = document.getElementById("save-leave-btn");
  const leaveFromInput = document.getElementById("leave-from");
  const leaveToInput = document.getElementById("leave-to");

  //  تحميل بيانات السائق من localStorage عند فتح الصفحة
  function loadSavedData() {
    const driverStatusMap = {
      1: "متاح",
      2: "غائب",
      3: "مشغول",
    };
    const urlParams = new URLSearchParams(window.location.search);
    const driverID = urlParams.get("id");
    const token = localStorage.getItem("token");
    fetch(`https://movesmartapi.runasp.net/api/Drivers/ByID/${driverID}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("بيانات السائق:", data);
        document.getElementById(
          "driver-name"
        ).innerText = `اسم السائق: ${data.name}`;
        document.getElementById(
          "driver-national-id"
        ).innerText = `الرقم القومي: ${data.nationalNo}`;
        document.getElementById(
          "driver-phone"
        ).innerText = `رقم الهاتف: ${data.phone}`;
        document.getElementById("driver-status").innerText = `حالة السائق: ${driverStatusMap[data.status] || "غير محدد"
          }`;
        document.querySelector('input[name="name"]').value = data.name || "";
        document.querySelector('input[name="vehicleID"]').value =
          data.vehicleID || "";
        document.querySelector('input[name="phone"]').value = data.phone || "";
        document.querySelector('input[name="nationalNum"]').value =
          data.nationalNo || "";
        document.querySelector('input[name="status"]').value =
          driverStatusMap[data.status] || "غير محدد";
      })
      .catch((error) => {
        console.error("Error fetching driver data:", error);
      });
  }
  //  دالة الحفظ
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      const urlParams = new URLSearchParams(window.location.search);
      const driverID = Number(urlParams.get("id")); // تأكد إنه رقم
      const token = localStorage.getItem("token");

      // تحويل الحالة من نص إلى رقم
      const statusText = document.querySelector('input[name="status"]').value;
      const statusMap = {
        متاح: 1,
        غائب: 2,
        مشغول: 3,
      };
      const statusCode = statusMap[statusText] ?? 1;

      const updatedDriver = {
        driverID: driverID,
        name: document.querySelector('input[name="name"]').value,
        vehicleID: Number(
          document.querySelector('input[name="vehicleID"]').value
        ),
        phone: document.querySelector('input[name="phone"]').value,
        nationalNo: document.querySelector('input[name="nationalNum"]').value,
        status: statusCode,
      };

      fetch(`https://movesmartapi.runasp.net/api/Drivers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedDriver),
      })
        .then((res) => {
          if (!res.ok) throw new Error("فشل في تحديث البيانات");
          return res.text();
        })
        .then(() => {
          alert("✅ تم حفظ التعديلات بنجاح!");
          loadSavedData();
        })
        .catch((err) => {
          console.error(err);
          alert("❌ حدث خطأ أثناء الحفظ!");
        });
    });
  }

  //  دالة الحذف
  if (deleteButton) {
    deleteButton.addEventListener("click", function () {
      if (confirm("⚠ هل أنت متأكد من حذف بيانات السائق؟")) {
        const urlParams = new URLSearchParams(window.location.search);
        const driverID = urlParams.get("id");
        const token = localStorage.getItem("token");

        fetch(`https://movesmartapi.runasp.net/api/Drivers/ByID/${driverID}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("فشل في حذف البيانات");
            alert("✅ تم حذف بيانات السائق!");
            window.history.back();
          })
          .catch((err) => {
            console.error(err);
            alert("❌ حدث خطأ أثناء الحذف!");
          });
      }
    });
  }

  // دالة الطباعة
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }

  //  دالة الرجوع
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.history.back();
    });
  }

  //  التنقل بين التبويبات
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      tabContents.forEach((content) => (content.style.display = "none"));
      document.getElementById(this.dataset.tab).style.display = "block";

      if (saveButton) {
        saveButton.style.display =
          this.dataset.tab === "driver-info" ? "block" : "none";
      }
      if (addVacationButton) {
        addVacationButton.style.display =
          this.dataset.tab === "vacation-record" ? "block" : "none";
      }
    });
  });

  //  إضافة إجازة جديدة
  if (addVacationButton) {
    addVacationButton.addEventListener("click", function () {
      leaveModal.style.display = "flex";
    });
  }

  if (closeModal) {
    closeModal.addEventListener("click", function () {
      leaveModal.style.display = "none";
    });
  }

  // حفظ الإجازة
  if (saveLeaveButton) {
    saveLeaveButton.addEventListener("click", function () {
      const fromDate = leaveFromInput.value;
      const toDate = leaveToInput.value;
      const substituteDriverID =
        document.getElementById("substitute-driver").value;
      const urlParams = new URLSearchParams(window.location.search);
      const vacationOwnerID = Number(urlParams.get("id"));
      const token = localStorage.getItem("token");

      if (fromDate && toDate && vacationOwnerID && substituteDriverID) {
        const vacationData = {
          vacationOwnerID: vacationOwnerID,
          startDate: fromDate,
          endDate: toDate,
          substituteDriverID: substituteDriverID || null,
        };

        fetch("https://movesmartapi.runasp.net/api/Vacations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(vacationData),
        })
          .then((res) => {
            if (!res.ok) throw new Error("فشل في إضافة الإجازة");
            return res.json();
          })
          .then((vac) => {
            alert("✅ تم حفظ الإجازة بنجاح!");

            const newRow = document.createElement("div");
            newRow.classList.add("vacation-entry");
            const days = Math.ceil(
              Math.abs(new Date(toDate) - new Date(fromDate)) /
              (1000 * 60 * 60 * 24)
            );
            newRow.innerHTML = `
            <span>${fromDate}</span>
            <span>${toDate}</span>
            <span>${days} أيام</span>
            <button class="delete-vacation-btn">🗑 حذف</button>
          `;
            newRow
              .querySelector(".delete-vacation-btn")
              .addEventListener("click", () => {
                newRow.remove();
              });

            loadDriverVacations();
            leaveModal.style.display = "none";
            leaveFromInput.value = "";
            leaveToInput.value = "";
            document.getElementById("substitute-driver").value = "";
          })
          .catch((err) => {
            console.error(err);
            alert("❌ حدث خطأ أثناء حفظ الإجازة!");
          });
      } else {
        alert("⚠ يرجى إدخال التواريخ واختيار السائق!");
      }
    });
  }
  function loadSubstituteDrivers() {
    const token = localStorage.getItem("token");
    const select = document.getElementById("substitute-driver");

    fetch("https://movesmartapi.runasp.net/api/Drivers/All", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const drivers = data.$values;
        drivers.forEach((driver) => {
          const option = document.createElement("option");
          option.value = driver.driverID;
          option.textContent = driver.name;
          select.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("فشل في تحميل قائمة السائقين:", err);
      });
  }

  function loadDriverVacations() {
    const urlParams = new URLSearchParams(window.location.search);
    const driverID = Number(urlParams.get("id"));
    const token = localStorage.getItem("token");

    fetch(
      `https://movesmartapi.runasp.net/api/Vacations/ForDriver/${driverID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (res) => {
        vacationContent.innerHTML = "";

        if (res.status === 404) {
          // لو مفيش إجازات
          vacationContent.innerHTML =
            "<p class='no-vacations'>لا توجد إجازات مسجلة لهذا السائق.</p>";
          return;
        }

        if (!res.ok) throw new Error("فشل في تحميل الإجازات");

        const data = await res.json();

        if (!data.$values || data.$values.length === 0) {
          vacationContent.innerHTML =
            "<p class='no-vacations'>لا توجد إجازات مسجلة لهذا السائق.</p>";
          return;
        }
        console.log("بيانات الإجازات:", data);
        data.$values.forEach((vac) => {
          const fromDate = vac.startDate?.split("T")[0];
          const toDate = vac.endDate?.split("T")[0];
          const days = Math.ceil(
            Math.abs(new Date(toDate) - new Date(fromDate)) /
            (1000 * 60 * 60 * 24)
          );

          const newRow = document.createElement("div");
          newRow.classList.add("vacation-entry");

          newRow.innerHTML = `
          <span>${fromDate}</span>
          <span>${toDate}</span>
          <span>${days} أيام</span>
          <button class="delete-vacation-btn">🗑 حذف</button>
        `;

          const deleteBtn = newRow.querySelector(".delete-vacation-btn");
          deleteBtn.addEventListener("click", () => {
            if (confirm("⚠ هل أنت متأكد من حذف هذه الإجازة؟")) {
              fetch(
                `https://movesmartapi.runasp.net/api/Vacations/${vac.vacationID}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
                .then((res) => {
                  if (!res.ok) throw new Error("فشل في حذف الإجازة");
                  alert("✅ تم حذف الإجازة بنجاح!");
                  newRow.remove();
                  // إعادة تحميل الإجازات للتأكد إذا أصبحت القائمة فارغة
                  loadDriverVacations();
                })
                .catch((err) => {
                  console.error("خطأ أثناء حذف الإجازة:", err);
                  alert("❌ حدث خطأ أثناء حذف الإجازة!");
                });
            }
          });

          vacationContent.appendChild(newRow);
        });
      })
      .catch((err) => {
        console.error("فشل في تحميل الإجازات:", err);
        vacationContent.innerHTML =
          "<p class='no-vacations'>حدث خطأ أثناء تحميل الإجازات.</p>";
      });
  }

  // استدعِ دالة تحميل السائقين
  loadSubstituteDrivers();

  // استدعِ دالة تحميل الإجازات
  loadDriverVacations();

  // تعيين التبويب الافتراضي وتحميل البيانات
  document.querySelector("[data-tab='driver-info']")?.click();
  loadSavedData();
});
