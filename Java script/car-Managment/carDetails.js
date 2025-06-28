document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const saveButton = document.querySelector(".save-btn");
  const printButton = document.querySelector(".print-btn");
  const backButton = document.querySelector(".back-btn");
  const token = localStorage.getItem("token");
  console.log("توكن:", token);

  function loadCarData() {
    const carstatus = {
      1: "متاحة",
      2: "مشغولة",
      3: "قيد الصيانة",
    };
    const fuelType = {
      0: "بنزين",
      1: "سولار",
      2: "غاز طبيعي",
    };
    const carType = {
      0: "سيدان",
      1: "واحد كبينة",
      2: "ثنائي كبينة",
      3: "شاحنة نقل",
      4: "ميكروباص",
      5: "ميني باص",
      6: "أتوبيس",
      7: "اسعاف",
    };
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleID = urlParams.get("id");
    fetch(`https://movesmartapi.runasp.net/api/Vehicles/${vehicleID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("بيانات السيارة:", data);
        document.getElementById(
          "car-number"
        ).innerText = `رقم السيارة: ${data.plateNumbers}`;
        document.getElementById(
          "car-make"
        ).innerText = `الماركة: ${data.brandName}`;
        document.getElementById(
          "car-model"
        ).innerText = `الموديل: ${data.modelName}`;
        document.getElementById("car-type").innerText = `نوع السيارة: ${
          carType[data.vehicleType]
        }`;
        document.getElementById(
          "total-km"
        ).innerText = `${data.totalKilometersMoved} KM`;

        document.querySelector('input[name="carNumber"]').value =
          data.plateNumbers || "";
        document.querySelector('input[name="carBrand"]').value =
          data.brandName || "";
        document.querySelector('input[name="carModel"]').value =
          data.modelName || "";
        document.querySelector('select[name="carType"]').value =
          data.vehicleType;
        document.querySelector('select[name="carCondition"]').value =
          data.status;
        document.querySelector('input[name="carFunction"]').value =
          data.associatedTask || "";
        document.querySelector('input[name="hospital"]').value =
          data.associatedHospital || "";
        document.querySelector('input[name="fuelConsumption"]').value =
          data.fuelConsumptionRate || "0";
        document.querySelector('input[name="oilConsumption"]').value =
          data.oilConsumptionRate || "0";
        document.querySelector('select[name="fuelType"]').value = data.fuelType;
      })
      .catch((err) => {
        console.error("فشل تحميل بيانات السيارة:", err);
      });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      tabContents.forEach((c) => (c.style.display = "none"));
      document.getElementById(this.dataset.tab).style.display = "block";

      saveButton.style.display =
        this.dataset.tab === "car-info" ? "block" : "none";
    });
  });

  function showError(id, message) {
    const errorElement = document.getElementById(`error-${id}`);
    if (errorElement) {
      errorElement.innerText = message || "";
    }
  }

  function validate() {
    const carBrand = document
      .querySelector('input[name="carBrand"]')
      .value.trim();
    const carModel = document
      .querySelector('input[name="carModel"]')
      .value.trim();
    const carNumber = document
      .querySelector('input[name="carNumber"]')
      .value.trim();
    const hospital = document
      .querySelector('input[name="hospital"]')
      .value.trim();
    const task = document
      .querySelector('input[name="carFunction"]')
      .value.trim();

    let isValid = true;

    // Clear previous errors
    ["carBrand", "carModel", "carNumber", "hospital", "carFunction"].forEach(
      (field) => showError(field, "")
    );

    if (carBrand.length < 2) {
      isValid = false;
      showError("carBrand", "البراند نيم يجب أن يكون 2 أحرف على الأقل.");
    }

    if (!carModel) {
      isValid = false;
      showError("carModel", "الموديل نيم لا يمكن أن يكون فارغًا.");
    }

    const plateRegex = /^[أ-يA-Za-z]{3}\d{4}$/;
    if (!plateRegex.test(carNumber)) {
      isValid = false;
      showError("carNumber", "رقم السيارة يجب أن يتكون من 3 حروف و4 أرقام.");
    }

    if (!hospital) {
      isValid = false;
      showError("hospital", "يرجى إدخال اسم المستشفى.");
    }

    if (!task) {
      isValid = false;
      showError("carFunction", "يرجى إدخال المهمة المرتبطة.");
    }

    return isValid;
  }

  function editVehicle() {
    // التحقق من صحة البيانات المدخلة
    if (!validate()) {
      return; // إذا كانت البيانات غير صحيحة، لا نتابع
    }
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleID = parseInt(urlParams.get("id")); // استخراج ID من الرابط

    const carData = {
      vehicleID: vehicleID,
      brandName: document.getElementsByName("carBrand")[0].value,
      modelName: document.getElementsByName("carModel")[0].value,
      plateNumbers: document.getElementsByName("carNumber")[0].value,
      vehicleType: parseInt(document.getElementsByName("carType")[0].value),
      associatedHospital: document.getElementsByName("hospital")[0].value,
      associatedTask: document.getElementsByName("carFunction")[0].value,
      status: parseInt(document.getElementsByName("carCondition")[0].value),
      totalKilometersMoved:
        parseInt(
          document.getElementById("total-km").innerText.replace(/\D/g, "")
        ) || 0,
      fuelType: parseInt(document.getElementsByName("fuelType")[0].value),
      fuelConsumptionRate: parseFloat(
        document.getElementsByName("fuelConsumption")[0].value
      ),
      oilConsumptionRate: parseFloat(
        document.getElementsByName("oilConsumption")[0].value
      ),
    };

    const token = localStorage.getItem("token");
    fetch("https://movesmartapi.runasp.net/api/Vehicles", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(carData),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          const text = await response.text();
          alert(text);
        }
      })

      .then((data) => {
        console.log("Success:", data);
        alert("تم حفظ التعديلات بنجاح ✅");
        refreshData();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  saveButton?.addEventListener("click", () => {
    editVehicle();
  });

  backButton?.addEventListener("click", () => {
    window.history.back();
  });

  printButton?.addEventListener("click", () => {
    const tabId = document.querySelector(".tab.active").dataset.tab;
    const content = document.getElementById(tabId);
    const newWin = window.open("", "", "width=800,height=600");
    newWin.document.write(
      `<html><head><title>طباعة</title></head><body>${content.outerHTML}</body></html>`
    );
    newWin.document.close();
    newWin.print();
  });

  function refreshData() {
    loadCarData(); // إعادة تحميل السيارات من الـ API
  }

  document.querySelector("[data-tab='car-info']")?.click();
  loadCarData();

  // Add these functions

  function openAddBusPopup() {
    document.getElementById("addBusPopup").style.display = "block";
  }

  function closeAddBusPopup() {
    document.getElementById("addBusPopup").style.display = "none";
  }

  function submitBusForm(event) {
    event.preventDefault();
    // Add your form submission logic here
    const formData = {
      plateNumbers: document.getElementById("plateNumbers").value,
      model: document.getElementById("model").value,
      manufacturer: document.getElementById("manufacturer").value,
      year: document.getElementById("year").value,
      capacity: document.getElementById("capacity").value,
      status: document.getElementById("status").value,
    };
    console.log("Form Data:", formData);
    // Add your API call here
    closeAddBusPopup();
  }

  const deleteButton = document.querySelector(".delete-btn");

  deleteButton?.addEventListener("click", () => {
    if (!confirm("هل أنت متأكد أنك تريد حذف المركبة؟")) return;

    const urlParams = new URLSearchParams(window.location.search);
    const vehicleID = urlParams.get("id");
    const type = urlParams.get("type");

    let apiUrl = "";
    if (type === "bus") {
      apiUrl = `https://movesmartapi.runasp.net/api/Buses/ByID/${vehicleID}`;
    } else {
      apiUrl = `https://movesmartapi.runasp.net/api/Vehicles/ByID/${vehicleID}`;
    }

    fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          alert("تم حذف المركبة بنجاح.");
          window.location.href =
            type === "bus" ? "busesList.html" : "carsList.html";
        } else {
          return res.text().then((text) => {
            throw new Error(text);
          });
        }
      })
      .catch((err) => {
        alert("حدث خطأ أثناء الحذف: " + err.message);
      });
  });
  // Close popup when clicking outside
  window.onclick = function (event) {
    const popup = document.getElementById("addBusPopup");
    if (event.target === popup) {
      closeAddBusPopup();
    }
  };
});
