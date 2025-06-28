document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const storedPayload = JSON.parse(localStorage.getItem("payload"));
  console.log("Id:", storedPayload.sub);

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "AdministrativeSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }
});

const token = localStorage.getItem("token");

const headers = {
  Authorization: `Bearer ${token}`,
};

// Helper function
async function fetchDataAndCount(url, statusKeys) {
  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    const items = data.$values;

    const result = {
      total: items.length,
    };

    statusKeys.forEach(({ key, status }) => {
      result[key] = items.filter((item) => item.status === status).length;
    });

    return result;
  } catch (error) {
    console.error(`فشل في تحميل البيانات من ${url}:`, error);
    return null;
  }
}

async function fetchAllStats() {
  //  السائقين
  const driverStats = await fetchDataAndCount(
    "https://movesmartapi.runasp.net/api/Drivers/All",
    [
      { key: "working", status: 2 },
      { key: "available", status: 0 },
      { key: "onLeave", status: 1 },
    ]
  );

  if (driverStats) {
    document.querySelector("#total-drivers").textContent = driverStats.total;
    document.querySelector("#working-drivers").textContent =
      driverStats.working;
    document.querySelector("#available-drivers").textContent =
      driverStats.available;
    document.querySelector("#onleave-drivers").textContent =
      driverStats.onLeave;
  }

  //  السيارات
  const carStats = await fetchDataAndCount(
    "https://movesmartapi.runasp.net/api/Vehicles/All",
    [
      { key: "maintenance", status: 0 },
      { key: "available", status: 1 },
      { key: "working", status: 2 },
    ]
  );

  if (carStats) {
    document.querySelector("#total-cars").textContent = carStats.total;
    document.querySelector("#cars-maintenance").textContent =
      carStats.maintenance;
    document.querySelector("#cars-available").textContent = carStats.available;
    document.querySelector("#cars-working").textContent = carStats.working;
  }

  //  الطلبات
  // const orderStats = await fetchDataAndCount(
  //     'https://movesmartapi.runasp.net/api/Requests/All',
  //     [
  //         { key: 'pending', status: 0 },
  //         { key: 'approved', status: 1 },
  //         { key: 'rejected', status: 2 }
  //     ]
  // );

  // if (orderStats) {
  //     document.querySelector('#total-orders').textContent = orderStats.total;
  //     document.querySelector('#orders-pending').textContent = orderStats.pending;
  //     document.querySelector('#orders-approved').textContent = orderStats.approved;
  //     document.querySelector('#orders-rejected').textContent = orderStats.rejected;
  // }

  //  التقارير
  // const reportStats = await fetchDataAndCount(
  //     'https://movesmartapi.runasp.net/api/Reports/All',
  //     [
  //         { key: 'type1', status: 0 },
  //         { key: 'type2', status: 1 },
  //         { key: 'type3', status: 2 }
  //     ]
  // );

  // if (reportStats) {
  //     document.querySelector('#total-reports').textContent = reportStats.total;
  //     document.querySelector('#report-type1').textContent = reportStats.type1;
  //     document.querySelector('#report-type2').textContent = reportStats.type2;
  //     document.querySelector('#report-type3').textContent = reportStats.type3;
  // }

  //  الدوريات
  // const patrolStats = await fetchDataAndCount(
  //     'https://movesmartapi.runasp.net/api/Patrols/All',
  //     [
  //         { key: 'current', status: 0 },
  //         { key: 'upcoming', status: 1 },
  //         { key: 'finished', status: 2 }
  //     ]
  // );

  // if (patrolStats) {
  //     document.querySelector('#total-patrols').textContent = patrolStats.total;
  //     document.querySelector('#patrols-current').textContent = patrolStats.current;
  //     document.querySelector('#patrols-upcoming').textContent = patrolStats.upcoming;
  //     document.querySelector('#patrols-finished').textContent = patrolStats.finished;
  // }
  const chartData = [
    {
      id: "driverChart",
      data: [
        parseInt(document.getElementById("working-drivers").textContent) || 0,
        parseInt(document.getElementById("available-drivers").textContent) || 0,
        parseInt(document.getElementById("onleave-drivers").textContent) || 0,
      ],
    },
    {
      id: "carChart",
      data: [
        parseInt(document.getElementById("cars-maintenance").textContent) || 0,
        parseInt(document.getElementById("cars-available").textContent) || 0,
        parseInt(document.getElementById("cars-working").textContent) || 0,
      ],
    },
  ];

  chartData.forEach(({ id, data }) => {
    const ctx = document.getElementById(id).getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["أمر شغل", "متاح", "إجازة"],
        datasets: [
          {
            data,
            backgroundColor: ["orange", "green", "red"],
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
      },
    });
  });
}

// نداء أول ما الصفحة تفتح
fetchAllStats();
