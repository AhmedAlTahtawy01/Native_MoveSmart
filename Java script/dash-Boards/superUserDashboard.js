// SuperUser Dashboard JavaScript
(function() {
    'use strict';

    // Base API URL
    const API_BASE_URL = 'https://movesmartapi.runasp.net';
    
    // API endpoints for counts
    const ENDPOINTS = {
        users: '/api/v1/User/count',
        vehicles: '/api/Vehicles/Count',
        drivers: '/api/Drivers/Count',
        applications: '/api/Application/count',
        spareParts: '/api/SparePart/count',
        consumables: '/api/VehicleConsumable/count'
    };

    // Initialize dashboard when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('SuperUser Dashboard initialization started');
        initializeSuperUserDashboard();
        setupEventListeners();
    });

    async function initializeSuperUserDashboard() {
        try {
            // Check authentication
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../Login.html';
                return;
            }

            // Load user name
            const userName = localStorage.getItem('userName');
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName || 'User';
            }

            // Load all dashboard data
            await Promise.all([
                loadUsersCount(),
                loadVehiclesCount(),
                loadDriversCount(),
                loadApplicationsCount(),
                loadConsumablesCount(),
                loadSparePartsCount()
            ]);

            console.log('SuperUser Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing SuperUser Dashboard:', error);
            showNotification('حدث خطأ في تحميل البيانات', 'error');
        }
    }

    function setupEventListeners() {
        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', showLogoutPopup);
        }

        // Search functionality
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
    }

    // Data loading functions
    async function loadUsersCount() {
        try {
            const count = await fetchCount(ENDPOINTS.users);
            console.log('Users count received:', count, typeof count);
            updateCardCount('totalUsers', count);
        } catch (error) {
            console.error('Error loading users count:', error);
            updateCardCount('totalUsers', 0);
        }
    }

    async function loadVehiclesCount() {
        try {
            const count = await fetchCount(ENDPOINTS.vehicles);
            updateCardCount('totalCars', count);
        } catch (error) {
            console.error('Error loading vehicles count:', error);
            updateCardCount('totalCars', 0);
        }
    }

    async function loadDriversCount() {
        try {
            const count = await fetchCount(ENDPOINTS.drivers);
            updateCardCount('totalDrivers', count);
        } catch (error) {
            console.error('Error loading drivers count:', error);
            updateCardCount('totalDrivers', 0);
        }
    }

    async function loadApplicationsCount() {
        try {
            const count = await fetchCount(ENDPOINTS.applications);
            updateCardCount('totalApplications', count);
        } catch (error) {
            console.error('Error loading applications count:', error);
            updateCardCount('totalApplications', 0);
        }
    }

    async function loadConsumablesCount() {
        try {
            const count = await fetchCount(ENDPOINTS.consumables);
            console.log('Consumables count received:', count, typeof count);
            updateCardCount('totalConsumables', count);
        } catch (error) {
            console.error('Error loading consumables count:', error);
            updateCardCount('totalConsumables', 0);
        }
    }

    async function loadSparePartsCount() {
        try {
            const count = await fetchCount(ENDPOINTS.spareParts);
            console.log('Spare parts count received:', count, typeof count);
            updateCardCount('totalSpareParts', count);
        } catch (error) {
            console.error('Error loading spare parts count:', error);
            updateCardCount('totalSpareParts', 0);
        }
    }

    // Helper function to fetch count from API
    async function fetchCount(endpoint) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`API Response for ${endpoint}:`, data);
            
            // Handle different response formats
            if (typeof data === 'number') {
                return data;
            } else if (data && typeof data === 'object') {
                // Try different possible property names
                if (data.count !== undefined) {
                    return data.count;
                } else if (data.message !== undefined) {
                    return data.message;
                } else if (data.total !== undefined) {
                    return data.total;
                } else if (data.value !== undefined) {
                    return data.value;
                } else if (data.result !== undefined) {
                    return data.result;
                } else {
                    // If it's an object but no known count property, log the structure
                    console.warn('Unknown response structure for endpoint:', endpoint, data);
                    return 0;
                }
            } else {
                console.warn('Unexpected response type for endpoint:', endpoint, data);
                return 0;
            }
        } catch (error) {
            console.error(`Error fetching count from ${endpoint}:`, error);
            return 0;
        }
    }

    // Update card count in the UI
    function updateCardCount(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            // Ensure count is a valid number
            const validCount = (count !== undefined && count !== null) ? Number(count) : 0;
            element.textContent = validCount.toLocaleString();
        }
    }

    // Navigation functions
    function navigateToSection(section) {
        const userRole = localStorage.getItem('userRole');
        let targetPage = '';

        switch (section) {
            case 'users':
                targetPage = '../user-Management/userList.html';
                break;
            case 'cars':
                targetPage = '../car-Managment/carList.html';
                break;
            case 'drivers':
                targetPage = '../driver-Managment/driverList.html';
                break;
            case 'applications':
                targetPage = '../orderList.html';
                break;
            case 'consumables':
                targetPage = '../disposalList.html';
                break;
            case 'spareParts':
                targetPage = '../sparePartsList.html';
                break;
            case 'reports':
                // Handle reports navigation - you might want to create a reports page
                showNotification('صفحة التقارير قيد التطوير', 'info');
                return;
            default:
                console.warn('Unknown section:', section);
                return;
        }

        // Navigate to the target page
        window.location.href = targetPage;
    }

    // Search functionality
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const cards = document.querySelectorAll('.info-card');

        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.card-description').textContent.toLowerCase();

            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Logout Functions
    function showLogoutPopup() {
        const popup = document.getElementById("logoutPopup");
        if (popup) {
            popup.style.display = "flex";
        }
    }

    function hideLogoutPopup() {
        const popup = document.getElementById("logoutPopup");
        if (popup) {
            popup.style.display = "none";
        }
    }

    function logout() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        // Redirect to login page
        window.location.href = '../Login.html';
    }

    document.addEventListener('DOMContentLoaded', function() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', showLogoutPopup);
        }
        const confirmLogoutBtn = document.getElementById('confirmLogout');
        const cancelLogoutBtn = document.getElementById('cancelLogout');
        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', function () {
                hideLogoutPopup();
                logout();
            });
        }
        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', function () {
                hideLogoutPopup();
            });
        }
    });

    // Notification system
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        switch (type) {
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            case 'success':
                notification.style.backgroundColor = '#4caf50';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                break;
            default:
                notification.style.backgroundColor = '#2196f3';
        }

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Make navigation function globally available
    window.navigateToSection = navigateToSection;

    // Export functions for potential external use
    window.superUserDashboard = {
        initialize: initializeSuperUserDashboard,
        loadUsersCount,
        loadVehiclesCount,
        loadDriversCount,
        loadApplicationsCount,
        loadConsumablesCount,
        loadSparePartsCount,
        showNotification
    };

})();
