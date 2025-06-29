(function () {
  // Chart colors and configurations
  const chartColors = {
    green: "#4caf50",
    orange: "#ff9800",
    red: "#f44336",
    blue: "#2196f3",
  };

  let driverChartInstance = null;
  let carChartInstance = null;
  let orderChartInstance = null;
  let consumableChartInstance = null;
  let sparePartChartInstance = null;
  let patrolChartInstance = null;
  let subscriptionChartInstance = null;

  function filterCardsByRole() {
    const drivers = document.getElementById("drivers");
    const cars = document.getElementById("cars");
    const orders = document.getElementById("orders");
    const consumables = document.getElementById("consumables");
    const spareParts = document.getElementById("spareParts");
    const patrols = document.getElementById("patrols");
    const subscriptions = document.getElementById("subscriptions");

    switch (userRole) {
      case "PatrolsSupervisor":
        orders?.classList.add("hidden");
        consumables?.classList.add("hidden");
        spareParts?.classList.add("hidden");
        // Don't hide cars card, but change its title to show buses instead
        if (cars) {
          const titleElement = cars.querySelector("h2");
          if (titleElement) {
            titleElement.textContent = "نظرة عامة على الحافلات";
          }
        }
        break;

      case "WorkshopSupervisor":
        // يظهر فقط كروت الطلبات، المستهلكات، قطع الغيار
        drivers?.classList.add("hidden");
        patrols?.classList.add("hidden");
        subscriptions?.classList.add("hidden");
        orders?.classList.add("hidden");

        break;
      case "AdministrativeSupervisor":
        patrols?.classList.add("hidden");
        subscriptions?.classList.add("hidden");
        consumables?.classList.add("hidden");
        spareParts?.classList.add("hidden");
        orders?.classList.add("hidden");

      case "GeneralManager":
        // يشوف كل الكروت
        break;

      case "HospitalManager":
        // يشوف كل الكروت
        break;
      case "GeneralSupervisor":
        // يشوف كل الكروت
        break;

      default:
        // لو مش معروف الرول اخفي كل الكروت
        drivers?.classList.add("hidden");
        cars?.classList.add("hidden");
        orders?.classList.add("hidden");
        consumables?.classList.add("hidden");
        spareParts?.classList.add("hidden");
        patrols?.classList.add("hidden");
        subscriptions?.classList.add("hidden");
        break;
    }
  }

  // Initialize dashboard when DOM is loaded
  console.log("Dashboard initialization started");
  initializeDashboard();

  async function initializeDashboard() {
    try {
      // Check if we're still on the dashboard page
      if (!document.getElementById("driverChart")) {
        console.log("Dashboard elements not found, page may have changed");
        return;
      }

      // Get user role and determine which data to load
      const userRole = localStorage.getItem("userRole");
      const dataLoaders = getDataLoadersByRole(userRole);
      
      // Load only the data that the user has access to
      await Promise.all(dataLoaders);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      showNotification("حدث خطأ في تحميل البيانات", "error");
    }
  }

  // Function to determine which data loaders to call based on user role
  function getDataLoadersByRole(userRole) {
    const loaders = [];
    
    switch (userRole) {
      case "PatrolsSupervisor":
        // Only load drivers, buses (instead of cars), patrols, and subscriptions data
        loaders.push(loadDriverData());
        loaders.push(loadBusData());
        loaders.push(loadPatrolData());
        loaders.push(loadSubscriptionData());
        break;

      case "WorkshopSupervisor":
        // Only load consumables and spare parts data
        loaders.push(loadConsumableData());
        loaders.push(loadSparePartData());
        break;

      case "AdministrativeSupervisor":
        // Only load drivers and cars data
        loaders.push(loadDriverData());
        loaders.push(loadCarData());
        break;

      case "GeneralManager":
      case "HospitalManager":
      case "GeneralSupervisor":
        // Load all data
        loaders.push(loadDriverData());
        loaders.push(loadCarData());
        loaders.push(loadOrderData());
        loaders.push(loadConsumableData());
        loaders.push(loadSparePartData());
        loaders.push(loadPatrolData());
        loaders.push(loadSubscriptionData());
        break;

      default:
        // For unknown roles, don't load any data
        console.warn("Unknown user role:", userRole);
        break;
    }
    
    return loaders;
  }

  // Driver data functions
  async function loadDriverData() {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = "https://movesmartapi.runasp.net/api/Drivers";

      // Fetch total drivers
      const totalResponse = await fetch(`${baseUrl}/Count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!totalResponse.ok) throw new Error("Failed to fetch total drivers");
      const totalDrivers = await totalResponse.json();

      // Fetch drivers by status
      const workingResponse = await fetch(`${baseUrl}/Count/WithStatus/3`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const workingDrivers = workingResponse.ok
        ? await workingResponse.json()
        : 0;

      const availableResponse = await fetch(`${baseUrl}/Count/WithStatus/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const availableDrivers = availableResponse.ok
        ? await availableResponse.json()
        : 0;

      const onLeaveResponse = await fetch(`${baseUrl}/Count/WithStatus/2`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const onLeaveDrivers = onLeaveResponse.ok
        ? await onLeaveResponse.json()
        : 0;

      // Update UI - with safety checks
      const totalElement = document.getElementById("total-drivers");
      const workingElement = document.getElementById("working-drivers");
      const availableElement = document.getElementById("available-drivers");
      const onleaveElement = document.getElementById("onleave-drivers");

      if (totalElement) totalElement.textContent = totalDrivers;
      if (workingElement) workingElement.textContent = workingDrivers;
      if (availableElement) availableElement.textContent = availableDrivers;
      if (onleaveElement) onleaveElement.textContent = onLeaveDrivers;

      // Create chart only if we're still on the dashboard page
      const chartCanvas = document.getElementById("driverChart");
      if (chartCanvas) {
        createDriverChart([workingDrivers, availableDrivers, onLeaveDrivers]);
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
      setDefaultValues("driver");
    }
  }

  // Car data functions
  async function loadCarData() {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = "https://movesmartapi.runasp.net/api/Vehicles";

      // Fetch total cars
      const totalResponse = await fetch(`${baseUrl}/Count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!totalResponse.ok) throw new Error("Failed to fetch total cars");
      const totalCars = await totalResponse.json();

      // Fetch cars by status
      const maintenanceResponse = await fetch(`${baseUrl}/Count/WithStatus/3`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const maintenanceCars = maintenanceResponse.ok
        ? await maintenanceResponse.json()
        : 0;

      const availableResponse = await fetch(`${baseUrl}/Count/WithStatus/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const availableCars = availableResponse.ok
        ? await availableResponse.json()
        : 0;

      const workingResponse = await fetch(`${baseUrl}/Count/WithStatus/2`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const workingCars = workingResponse.ok ? await workingResponse.json() : 0;

      // Update UI - with safety checks
      const totalElement = document.getElementById("total-cars");
      const maintenanceElement = document.getElementById("cars-maintenance");
      const availableElement = document.getElementById("cars-available");
      const workingElement = document.getElementById("cars-working");

      if (totalElement) totalElement.textContent = totalCars;
      if (maintenanceElement) maintenanceElement.textContent = maintenanceCars;
      if (availableElement) availableElement.textContent = availableCars;
      if (workingElement) workingElement.textContent = workingCars;

      // Create chart only if we're still on the dashboard page
      const chartCanvas = document.getElementById("carChart");
      if (chartCanvas) {
        createCarChart([maintenanceCars, availableCars, workingCars]);
      }
    } catch (error) {
      console.error("Error loading car data:", error);
      setDefaultValues("car");
    }
  }

  // Bus data functions
  async function loadBusData() {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = "https://movesmartapi.runasp.net/api/Buses";

      // Fetch all buses to count them
      const allBusesResponse = await fetch(`${baseUrl}/All`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!allBusesResponse.ok) throw new Error("Failed to fetch buses");
      const busesData = await allBusesResponse.json();
      const buses = busesData.$values || [];
      const totalBuses = buses.length;

      // Count buses by status (assuming buses have similar status structure to vehicles)
      let maintenanceBuses = 0;
      let availableBuses = 0;
      let workingBuses = 0;

      buses.forEach(bus => {
        if (bus.vehicle) {
          const status = bus.vehicle.status;
          if (status === 3) maintenanceBuses++;
          else if (status === 1) availableBuses++;
          else if (status === 2) workingBuses++;
        }
      });

      // Update UI - using the same car elements but with bus data
      const totalElement = document.getElementById("total-cars");
      const maintenanceElement = document.getElementById("cars-maintenance");
      const availableElement = document.getElementById("cars-available");
      const workingElement = document.getElementById("cars-working");

      if (totalElement) totalElement.textContent = totalBuses;
      if (maintenanceElement) maintenanceElement.textContent = maintenanceBuses;
      if (availableElement) availableElement.textContent = availableBuses;
      if (workingElement) workingElement.textContent = workingBuses;

      // Create chart only if we're still on the dashboard page
      const chartCanvas = document.getElementById("carChart");
      if (chartCanvas) {
        createCarChart([maintenanceBuses, availableBuses, workingBuses]);
      }
    } catch (error) {
      console.error("Error loading bus data:", error);
      setDefaultValues("car");
    }
  }

  // Order data functions
  async function loadOrderData() {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = "https://movesmartapi.runasp.net/api/Application";

      // Fetch total orders
      const totalResponse = await fetch(`${baseUrl}/Count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!totalResponse.ok) throw new Error("Failed to fetch total orders");
      const totalOrders = await totalResponse.json();

      // Fetch application by status
      const confirmedResponse = await fetch(`${baseUrl}/Count/Status/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const confirmedApplications = confirmedResponse.ok
        ? await confirmedResponse.json()
        : 0;

      const rejectedResponse = await fetch(`${baseUrl}/Count/Status/2`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const rejectedApplications = rejectedResponse.ok
        ? await rejectedResponse.json()
        : 0;

      const pendingResponse = await fetch(`${baseUrl}/Count/Status/3`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const pendingApplications = pendingResponse.ok
        ? await pendingResponse.json()
        : 0;

      const cancelledResponse = await fetch(`${baseUrl}/Count/Status/4`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const cancelledApplications = cancelledResponse.ok
        ? await cancelledResponse.json()
        : 0;

      // Update UI - with safety checks
      const totalElement = document.getElementById("total-orders");
      const pendingElement = document.getElementById("orders-pending");
      const approvedElement = document.getElementById("orders-approved");
      const rejectedElement = document.getElementById("orders-rejected");

      if (totalElement) totalElement.textContent = totalOrders.count;
      if (pendingElement) pendingElement.textContent = pendingApplications.count;
      if (approvedElement) approvedElement.textContent = confirmedApplications.count;
      if (rejectedElement) rejectedElement.textContent = rejectedApplications.count;

      // Create chart only if we're still on the dashboard page
      const chartCanvas = document.getElementById("orderChart");
      if (chartCanvas) {
        createOrderChart([
          pendingApplications.count,
          confirmedApplications.count,
          rejectedApplications.count,
        ]);
      }
    } catch (error) {
      console.error("Error loading order data:", error);
      setDefaultValues("order");
    }
  }

  // Consumable data functions
  async function loadConsumableData() {
    try {
      // For now, set default values
      const totalConsumables = 150;
      const availableConsumables = 100;
      const usedConsumables = 30;
      const inOrderConsumables = 20;

      // Update UI - using the correct element IDs from the HTML
      const totalElement = document.getElementById("totalConsumables");
      if (totalElement) {
        totalElement.textContent = totalConsumables;
      }

      // Note: The HTML doesn't have separate elements for available, used, in-order
      // So we'll just update the total for now

      // Create chart
      createConsumableChart([
        availableConsumables,
        usedConsumables,
        inOrderConsumables,
      ]);
    } catch (error) {
      console.error("Error loading consumable data:", error);
      setDefaultValues("consumable");
    }
  }

  // Spare part data functions
  async function loadSparePartData() {
    try {
      // For now, set default values
      const totalSpareParts = 200;
      const availableSpareParts = 120;
      const usedSpareParts = 50;
      const inOrderSpareParts = 30;

      // Update UI - using the correct element ID from the HTML
      const totalElement = document.getElementById("totalSpareParts");
      if (totalElement) {
        totalElement.textContent = totalSpareParts;
      }

      // Create chart
      createSparePartChart([
        availableSpareParts,
        usedSpareParts,
        inOrderSpareParts,
      ]);
    } catch (error) {
      console.error("Error loading spare part data:", error);
      setDefaultValues("sparePart");
    }
  }

  // Patrol data functions
  async function loadPatrolData() {
    try {
      // For now, set default values
      const totalPatrols = 25;
      const workingPatrols = 8;
      const availablePatrols = 12;
      const completedPatrols = 5;

      // Update UI - check if elements exist before updating
      const totalElement = document.getElementById("total-patrol");
      const workingElement = document.getElementById("working-patrol");
      const availableElement = document.getElementById("available-patrol");
      const onleaveElement = document.getElementById("onleave-patrol");

      if (totalElement) totalElement.textContent = totalPatrols;
      if (workingElement) workingElement.textContent = workingPatrols;
      if (availableElement) availableElement.textContent = availablePatrols;
      if (onleaveElement) onleaveElement.textContent = completedPatrols;

      // Create chart only if the chart element exists
      const chartElement = document.getElementById("patrolChart");
      if (chartElement) {
        createPatrolChart([workingPatrols, availablePatrols, completedPatrols]);
      }
    } catch (error) {
      console.error("Error loading patrol data:", error);
      setDefaultValues("patrol");
    }
  }

  // Subscription data functions
  async function loadSubscriptionData() {
    try {
      // For now, set default values
      const totalSubscriptions = 50;
      const activeSubscriptions = 35;
      const expiredSubscriptions = 15;

      // Update UI
      document.getElementById("total-subscriptions").textContent =
        totalSubscriptions;
      document.getElementById("active-subscriptions").textContent =
        activeSubscriptions;
      document.getElementById("expired-subscriptions").textContent =
        expiredSubscriptions;

      // Create chart
      createSubscriptionChart([activeSubscriptions, expiredSubscriptions]);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      setDefaultValues("subscription");
    }
  }

  // Chart creation functions
  function createDriverChart(data) {
    const ctx = document.getElementById("driverChart").getContext("2d");
    if (driverChartInstance) {
      driverChartInstance.destroy();
    }
    driverChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["أمر شغل", "متاح", "إجازة"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.orange,
              chartColors.green,
              chartColors.red,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createCarChart(data) {
    const ctx = document.getElementById("carChart").getContext("2d");
    if (carChartInstance) {
      carChartInstance.destroy();
    }
    carChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["طور الصيانة", "متاح", "أمر شغل"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.orange,
              chartColors.green,
              chartColors.red,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createOrderChart(data) {
    const ctx = document.getElementById("orderChart").getContext("2d");
    if (orderChartInstance) {
      orderChartInstance.destroy();
    }
    orderChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["انتظار", "موافقة", "مرفوض"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.orange,
              chartColors.green,
              chartColors.red,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createConsumableChart(data) {
    const ctx = document.getElementById("consumableChart").getContext("2d");
    if (consumableChartInstance) {
      consumableChartInstance.destroy();
    }
    consumableChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["متوفر", "مستهلك", "في الطلب"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.green,
              chartColors.red,
              chartColors.orange,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createSparePartChart(data) {
    const ctx = document.getElementById("sparePartChart").getContext("2d");
    if (sparePartChartInstance) {
      sparePartChartInstance.destroy();
    }
    sparePartChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["متوفر", "مستهلك", "في الطلب"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.green,
              chartColors.red,
              chartColors.orange,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createPatrolChart(data) {
    const ctx = document.getElementById("patrolChart").getContext("2d");
    if (patrolChartInstance) {
      patrolChartInstance.destroy();
    }
    patrolChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["قيد التنفيذ", "قادمة", "منتهية"],
        datasets: [
          {
            data: data,
            backgroundColor: [
              chartColors.orange,
              chartColors.green,
              chartColors.red,
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  function createSubscriptionChart(data) {
    const ctx = document.getElementById("subscriptionChart").getContext("2d");
    if (subscriptionChartInstance) {
      subscriptionChartInstance.destroy();
    }
    subscriptionChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["نشطة", "منتهية"],
        datasets: [
          {
            data: data,
            backgroundColor: [chartColors.green, chartColors.red],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "60%",
      },
    });
  }

  // Utility functions
  function setDefaultValues(type) {
    const defaultData = {
      driver: [0, 0, 0],
      car: [0, 0, 0],
      order: [0, 0, 0],
      consumable: [0, 0, 0],
      sparePart: [0, 0, 0],
      patrol: [0, 0, 0],
      subscription: [0, 0],
    };

    // Set default values in UI
    const elements = {
      driver: [
        "total-drivers",
        "working-drivers",
        "available-drivers",
        "onleave-drivers",
      ],
      car: ["total-cars", "cars-maintenance", "cars-available", "cars-working"],
      order: [
        "total-orders",
        "orders-pending",
        "orders-approved",
        "orders-rejected",
      ],
      consumable: [
        "total-consumables",
        "consumables-available",
        "consumables-used",
        "consumables-inorder",
      ],
      sparePart: [
        "total-spareParts",
        "spareParts-available",
        "spareParts-used",
        "spareParts-inorder",
      ],
      patrol: [
        "total-patrol",
        "working-patrol",
        "available-patrol",
        "onleave-patrol",
      ],
      subscription: [
        "total-subscriptions",
        "active-subscriptions",
        "expired-subscriptions",
      ],
    };

    elements[type].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = "0";
      }
    });
  }

  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${
              type === "error"
                ? "#dc3545"
                : type === "success"
                ? "#28a745"
                : "#007bff"
            };
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Make initializeDashboard available globally for sharedLayout.js
  window.initializeDashboard = initializeDashboard;
  filterCardsByRole();
})();
