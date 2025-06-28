const vehicleColors = ['#007bff', '#ff9800', '#4caf50'];
const vehicleLabels = ['متاح', 'قيد العمل', 'معطل'];

const driverColors = ['#4caf50', '#ff9800', '#007bff'];
const driverLabels = ['متاح', 'غائب', 'قيد العمل'];

async function fetchVehicleData() {
    try {
        const token = localStorage.getItem('token');
        const baseUrl = 'https://movesmartapi.runasp.net/api/Vehicles';
        
        console.log('Fetching vehicle data...');
        
        // Fetch total number of vehicles
        const totalResponse = await fetch(`${baseUrl}/Count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total vehicles: ${totalResponse.status}`);
        }
        
        const totalVehicles = await totalResponse.json();
        console.log('Total vehicles:', totalVehicles);

        // Fetch vehicles by status
        const statuses = [0, 1, 2]; // Available, Working, BrokenDown
        const statusCounts = await Promise.all(
            statuses.map(async (status) => {
                const response = await fetch(`${baseUrl}/Count/WithStatus/${status}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    console.error(`Failed to fetch vehicle status ${status}:`, response.status);
                    return 0;
                }
                
                return await response.json();
            })
        );

        return statusCounts;
    } catch (error) {
        console.error('Error in fetchVehicleData:', error);
        return [0, 0, 0];
    }
}

async function fetchDriverData() {
    try {
        const token = localStorage.getItem('token');
        const baseUrl = 'https://movesmartapi.runasp.net/api/Drivers';
        
        console.log('Fetching driver data...');
        
        // Fetch total number of drivers
        const totalResponse = await fetch(`${baseUrl}/Count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total drivers: ${totalResponse.status}`);
        }
        
        const totalDrivers = await totalResponse.json();
        console.log('Total drivers:', totalDrivers);

        // Fetch drivers by status
        const statuses = [0, 1, 2]; // Available, Absent, Working
        const statusCounts = await Promise.all(
            statuses.map(async (status) => {
                const response = await fetch(`${baseUrl}/Count/WithStatus/${status}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    console.error(`Failed to fetch driver status ${status}:`, response.status);
                    return 0;
                }
                
                return await response.json();
            })
        );

        return statusCounts;
    } catch (error) {
        console.error('Error in fetchDriverData:', error);
        return [0, 0, 0];
    }
}

function formatNumber(num) {
    return num.toString().padStart(4, '0');
}

function createChart(ctx, data, labels, colors) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            cutout: '50%',
            plugins: { legend: { display: false } }
        }
    });
}

function populateLegend(legendEl, data, labels, colors) {
    legendEl.innerHTML = data.map((value, i) => `
        <li>
            <span style="background-color: ${colors[i]}"></span>
            ${labels[i]}: ${formatNumber(value)}
        </li>
    `).join('');
}

function populateTable(tableEl, data, labels, colors) {
    const tbody = tableEl.querySelector('tbody');
    tbody.innerHTML = data.map((value, i) => `
        <tr>
            <td>${formatNumber(value)}</td>
            <td>${labels[i]}</td>
            <td><span style="background-color: ${colors[i]}; width: 12px; height: 12px; display: inline-block;"></span></td>
        </tr>
    `).join('');
}

async function initCharts() {
    try {
        const vehicleData = await fetchVehicleData();
        const driverData = await fetchDriverData();

        // Initialize vehicle chart
        const ctx1 = document.getElementById('chart1').getContext('2d');
        createChart(ctx1, vehicleData, vehicleLabels, vehicleColors);
        populateLegend(document.getElementById('legend1'), vehicleData, vehicleLabels, vehicleColors);
        populateTable(document.getElementById('table1'), vehicleData, vehicleLabels, vehicleColors);

        // Initialize driver chart
        const ctx2 = document.getElementById('chart2').getContext('2d');
        createChart(ctx2, driverData, driverLabels, driverColors);
        populateLegend(document.getElementById('legend2'), driverData, driverLabels, driverColors);
        populateTable(document.getElementById('table2'), driverData, driverLabels, driverColors);
    } catch (error) {
        console.error('Error initializing charts:', error);
        const contentDiv = document.getElementById('content');
        if (contentDiv) {
            const errorMessage = document.createElement('div');
            errorMessage.style.color = 'red';
            errorMessage.style.padding = '20px';
            errorMessage.style.textAlign = 'center';
            errorMessage.innerHTML = 'حدث خطأ في تحميل البيانات. يرجى التحقق من اتصال الخادم.';
            contentDiv.appendChild(errorMessage);
        }
    }
}

// Initialize charts when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        window.location.href = '../Login.html';
        return;
    }

    if (userRole !== 'HospitalManager') {
        window.location.href = `${userRole.toLowerCase()}Dashboard.html`;
        return;
    }

    initCharts();
}); 