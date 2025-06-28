async function validateForm(event) {
  event.preventDefault();
  let isValid = true;
  const nationalNo = document.getElementById("nationalNo").value;
  const password = document.getElementById("password").value;
  const nationalNoError = document.getElementById("nationalNoError");
  const passwordError = document.getElementById("passwordError");
  const serverError = document.getElementById("serverError");
  const loginButton = document.querySelector(".login-button");

  const nationalIdPattern = /^[0-9]{14}$/;
  if (!nationalIdPattern.test(nationalNo)) {
    nationalNoError.style.display = "block";
    isValid = false;
  } else {
    nationalNoError.style.display = "none";
  }

  if (password.length < 6) {
    passwordError.style.display = "block";
    isValid = false;
  } else {
    passwordError.style.display = "none";
  }

  if (!isValid) return false;

  // Show loading state
  loginButton.classList.add("loading");
  loginButton.disabled = true;
  serverError.style.display = "none";

  try {
    const basetUrl = "https://movesmartapi.runasp.net/api/v1/User/login";

    const response = await fetch(basetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nationalNo, password }),
    });

    if (response.ok) {
      const data = await response.json();
      const parsedPayload = parseJwt(data.token);

      // Store token, user role, and user name in localStorage
      localStorage.setItem("userName", data.name || "User");
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("payload", JSON.stringify(parsedPayload));

      // Redirect based on role
      if (data.role === "SuperUser") {
        window.location.href = "dash-Boards/superUserDashboard.html";
      }
      else{
        window.location.href = "sharedLayout.html";
      }
      /*switch (data.role) {
        case "SuperUser":
          window.location.href = "dash-Boards/superUserDashboard.html";
          break;
        case "HospitalManager":
          window.location.href = "dash-Boards/hospitalManagerDashboard.html";
          break;
        case "GeneralManager":
          window.location.href = "dash-Boards/generalManagerDashboard.html";
          break;
        case "GeneralSupervisor":
          window.location.href = "dash-Boards/generalSupervisorDashboard.html";
          break;
        case "AdministrativeSupervisor":
          window.location.href =
            "dash-Boards/administrativeSupervisorDashboard.html";
          break;
        case "WorkshopSupervisor":
          window.location.href = "dash-Boards/workshopSupervisorDashboard.html";
          break;
        case "PatrolsSupervisor":
          window.location.href = "dash-Boards/patrolsSupervisorDashboard.html";
          break;
        default:
          // Fallback to shared layout if role is not recognized
          window.location.href = "sharedLayout.html";
      }*/
     
    } else {
      serverError.style.display = "block";
      const data = await response.json();
      serverError.textContent =
        data.message || "فشل تسجيل الدخول. حاول مرة أخرى.";
      console.log(data);
      isValid = false;
    }
  } catch (error) {
    serverError.style.display = "block";
    serverError.textContent = "حدث خطأ في الاتصال بالخادم. حاول مرة أخرى.";
    console.error(error);
    isValid = false;
  } finally {
    // Hide loading state
    loginButton.classList.remove("loading");
    loginButton.disabled = false;
  }

  return false;
}
function parseJwt(token) {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1]; // Get the payload part
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => {
          return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Invalid token format:", e);
    return null;
  }
}
