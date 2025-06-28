document.addEventListener("DOMContentLoaded", function () {
  const userRole = localStorage.getItem("userRole");
  const storedPayload = JSON.parse(localStorage.getItem("payload"));
  console.log("Id:", storedPayload.sub);

  if (!token) {
    window.location.href = "../Login.html";
    return;
  }

  if (userRole !== "PatrolsSupervisor") {
    window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
    return;
  }
});

const token = localStorage.getItem("token");

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function fetchPatrolsStats() {
  try {
    const res = await fetch("https://movesmartapi.runasp.net/api/Patrols/All", {
      headers,
    });

    if (!res.ok) throw new Error("فشل تحميل الدوريات");

    const data = await res.json();
    const patrols = data.$values || [];

    let total = patrols.length;
    let inProgress = 0;
    let upcoming = 0;
    let finished = 0;

    const now = new Date();

    patrols.forEach((patrol) => {
      const [h, m] = patrol.movingAt.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);

      const end = new Date(start.getTime() + patrol.approximatedTime * 60000);

      if (now < start) {
        upcoming++;
      } else if (now >= start && now < end) {
        inProgress++;
      } else {
        finished++;
      }
    });

    document.getElementById("total-patrol").textContent = total;
    document.getElementById("working-patrol").textContent = inProgress;
    document.getElementById("available-patrol").textContent = upcoming;
    document.getElementById("onleave-patrol").textContent = finished;

    renderPatrolChart(inProgress, upcoming, finished);
  } catch (err) {
    console.error("فشل تحميل إحصائيات الدوريات:", err);
  }
}

function renderPatrolChart(inProgress, upcoming, finished) {
  const ctx = document.getElementById("patrolChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["قيد التنفيذ", "قادمة", "منتهية"],
      datasets: [
        {
          label: "الحالة",
          data: [inProgress, upcoming, finished],
          backgroundColor: ["orange", "green", "red"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

fetchPatrolsStats();
