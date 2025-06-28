document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const storedPayload = JSON.parse(localStorage.getItem("payload"));
  console.log("Id:", storedPayload.sub);

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "WorkshopSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function loadDashboardData() {
    try {
      // 🔵 السيارات
      const carsRes = await fetch(
        "https://movesmartapi.runasp.net/api/Buses/All",
        {
          headers,
        }
      );
      const cars = (await carsRes.json()).$values || [];
      const totalCars = cars.length;
      const maintenanceCars = cars.filter((c) => c.status === 2).length;
      const availableCars = cars.filter((c) => c.status === 0).length;
      const workingCars = cars.filter((c) => c.status === 1).length;
      document.getElementById("total-cars").textContent = totalCars;
      document.getElementById("cars-maintenance").textContent = maintenanceCars;
      document.getElementById("cars-available").textContent = availableCars;
      document.getElementById("cars-working").textContent = workingCars;

      // 🔵 الطلبات
      //   const ordersRes = await fetch(
      //     "https://movesmartapi.runasp.net/api/Requests",
      //     { headers }
      //   );
      //   const orders = (await ordersRes.json()).$values || [];
      //   const totalOrders = orders.length;
      //   const pendingOrders = orders.filter((o) => o.status === 0).length;
      //   const approvedOrders = orders.filter((o) => o.status === 1).length;
      //   const rejectedOrders = orders.filter((o) => o.status === 2).length;
      //   document.getElementById("total-orders").textContent = totalOrders;
      //   document.getElementById("orders-pending").textContent = pendingOrders;
      //   document.getElementById("orders-approved").textContent = approvedOrders;
      //   document.getElementById("orders-rejected").textContent = rejectedOrders;

      // 🔵 المستهلكات
      const consumablesRes = await fetch(
        "https://movesmartapi.runasp.net/api/ConsumableReplacement",
        { headers }
      );
      const consumables = (await consumablesRes.json()).$values || [];
      const totalConsumables = consumables.length;
      const availableConsumables = consumables.filter(
        (c) => c.status === 0
      ).length;
      const usedConsumables = consumables.filter((c) => c.status === 1).length;
      const inOrderConsumables = consumables.filter(
        (c) => c.status === 2
      ).length;
      document.getElementById("total-consumables").textContent =
        totalConsumables;
      document.getElementById("consumables-available").textContent =
        availableConsumables;
      document.getElementById("consumables-used").textContent = usedConsumables;
      document.getElementById("consumables-inorder").textContent =
        inOrderConsumables;

      // 🔵 قطع الغيار
      const spareRes = await fetch(
        "https://movesmartapi.runasp.net/api/SparePart",
        { headers }
      );
      const spareParts = (await spareRes.json()).$values || [];
      const totalSpare = spareParts.length;
      const availableSpare = spareParts.filter((p) => p.status === 0).length;
      const usedSpare = spareParts.filter((p) => p.status === 1).length;
      const inOrderSpare = spareParts.filter((p) => p.status === 2).length;
      document.getElementById("total-spareParts").textContent = totalSpare;
      document.getElementById("spareParts-available").textContent =
        availableSpare;
      document.getElementById("spareParts-used").textContent = usedSpare;
      document.getElementById("spareParts-inorder").textContent = inOrderSpare;

      // 🔵 التقارير (بيانات ثابتة مؤقتًا)
      const reportType1 = 5;
      const reportType2 = 10;
      const reportType3 = 3;
      const totalReports = reportType1 + reportType2 + reportType3;
      document.getElementById("total-reports").textContent = totalReports;
      document.getElementById("report-type1").textContent = reportType1;
      document.getElementById("report-type2").textContent = reportType2;
      document.getElementById("report-type3").textContent = reportType3;

      // ✅ بعد ملء التاجات، نرسم الشارتات
      drawChart("carChart", [
        getValue("cars-maintenance"),
        getValue("cars-available"),
        getValue("cars-working"),
      ]);
      drawChart("orderChart", [
        getValue("orders-pending"),
        getValue("orders-approved"),
        getValue("orders-rejected"),
      ]);
      drawChart("consumableChart", [
        getValue("consumables-inorder"),
        getValue("consumables-available"),
        getValue("consumables-used"),
      ]);
      drawChart("sparePartChart", [
        getValue("spareParts-inorder"),
        getValue("spareParts-available"),
        getValue("spareParts-used"),
      ]);
      drawChart("reportChart", [
        getValue("report-type1"),
        getValue("report-type2"),
        getValue("report-type3"),
      ]);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  }

  function getValue(id) {
    return parseInt(document.getElementById(id).textContent) || 0;
  }

  function drawChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas with ID "${canvasId}" not found.`);
      return;
    }

    const ctx = canvas.getContext("2d");
    const hasNonZeroValue = data.some((value) => value > 0);

    let chartData, chartColors, chartLabels;

    if (!hasNonZeroValue) {
      // كل القيم = 0 → عرض شارت رمادي
      chartData = [1];
      chartColors = ["#ccc"];
      chartLabels = ["لا توجد بيانات"];
    } else {
      chartData = data;
      chartColors = ["#FFA500", "#28a745", "#dc3545"];
      chartLabels = ["orange", "green", "red"];
    }

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartData,
            backgroundColor: chartColors,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  await loadDashboardData();
});
