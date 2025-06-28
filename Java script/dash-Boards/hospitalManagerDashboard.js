document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content");
  const storedPayload = JSON.parse(localStorage.getItem("payload"));
  console.log("Id:", storedPayload.sub);

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });

    // Close sidebar when clicking outside of it
    document.addEventListener("click", function (event) {
      if (
        !sidebar.contains(event.target) &&
        event.target !== menuToggle &&
        !menuToggle.contains(event.target)
      ) {
        sidebar.classList.remove("active");
      }
    });
  }

  // Check for saved sidebar state
  const sidebarHidden = localStorage.getItem("sidebarHidden") === "true";
  if (sidebarHidden) {
    sidebar.classList.remove("active");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  async function loadDashboardData() {
    try {
      // 🔵 السائقين
      const driversRes = await fetch(
        "https://movesmartapi.runasp.net/api/Drivers/All",
        { headers }
      );
      const drivers = (await driversRes.json()).$values || [];
      const totalDrivers = drivers.length;
      const workingDrivers = drivers.filter((d) => d.status === 1).length;
      const availableDrivers = drivers.filter((d) => d.status === 0).length;
      const onLeaveDrivers = drivers.filter((d) => d.status === 2).length;
      document.getElementById("total-drivers").textContent = totalDrivers;
      document.getElementById("working-drivers").textContent = workingDrivers;
      document.getElementById("available-drivers").textContent =
        availableDrivers;
      document.getElementById("onleave-drivers").textContent = onLeaveDrivers;

      // 🔵 السيارات
      const carsRes = await fetch(
        "https://movesmartapi.runasp.net/api/Vehicles/All",
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

      // ✅ بعد ملء التاجات، نرسم الشارتات
      drawChart("driverChart", [
        getValue("working-drivers"),
        getValue("available-drivers"),
        getValue("onleave-drivers"),
      ]);
      drawChart("carChart", [
        getValue("cars-maintenance"),
        getValue("cars-available"),
        getValue("cars-working"),
      ]);
      //   drawChart("orderChart", [
      //     getValue("orders-pending"),
      //     getValue("orders-approved"),
      //     getValue("orders-rejected"),
      //   ]);
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
