// User List Management JavaScript

let users = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let editingUserId = null;
let userToDelete = null;
let isLoading = false;

// API Configuration
const API_BASE_URL = 'https://movesmartapi.runasp.net/api/v1/User';

// Role mapping from enum to Arabic display names
const roleDisplayNames = {
    0: 'المشرف الرئيسي',        // SuperUser
    1: 'مدير المستشفى',        // HospitalManager
    2: 'المدير العام',          // GeneralManager
    3: 'المشرف العام',          // GeneralSupervisor
    4: 'مشرف الدوريات',        // PatrolsSupervisor
    5: 'مشرف الورشة',          // WorkshopSupervisor
    6: 'المشرف الإداري'         // AdministrativeSupervisor
};

// Role enum values for filtering
const roleEnumValues = {
    'SuperUser': 0,
    'HospitalManager': 1,
    'GeneralManager': 2,
    'GeneralSupervisor': 3,
    'PatrolsSupervisor': 4,
    'WorkshopSupervisor': 5,
    'AdministrativeSupervisor': 6
};

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    if (!token) {
        window.location.href = '../Login.html';
        return;
    }

    // Display the user's name
    const userNameElement = document.getElementById('userName');
    userNameElement.textContent = userName || 'User';

    // Initialize the page
    initializeUserList();
    setupEventListeners();
});

async function initializeUserList() {
    showLoadingState();
    try {
        await loadUsersFromAPI();
        renderUsersTable();
        renderPagination();
    } catch (error) {
        console.error('Error initializing user list:', error);
        showErrorMessage('فشل في تحميل بيانات المستخدمين');
    } finally {
        hideLoadingState();
    }
}

async function loadUsersFromAPI(pageNumber = 1, pageSize = 100) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '../Login.html';
            return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Debug: Log the actual response structure
    console.log('API Response:', data);
    console.log('Response type:', typeof data);
    console.log('Is Array:', Array.isArray(data));
    console.log('Is Object:', typeof data === 'object');
    
    // Handle different response structures more flexibly
    let userArray = [];
    
    // Function to check if something is iterable/enumerable
    function isIterable(obj) {
        if (obj == null) return false;
        return typeof obj[Symbol.iterator] === 'function' || 
               (typeof obj === 'object' && typeof obj.length === 'number') ||
               Array.isArray(obj);
    }
    
    // Function to convert any enumerable to array
    function toArray(obj) {
        if (Array.isArray(obj)) {
            return obj;
        }
        if (obj && typeof obj[Symbol.iterator] === 'function') {
            return Array.from(obj);
        }
        if (obj && typeof obj.length === 'number' && obj.length >= 0) {
            return Array.from(obj);
        }
        if (obj && typeof obj === 'object') {
            // Try to get values if it's an object with numeric keys
            const keys = Object.keys(obj);
            if (keys.every(key => !isNaN(key))) {
                return keys.map(key => obj[key]);
            }
        }
        return [];
    }
    
    try {
        // Handle JSON.NET serialization with $values pattern first (highest priority)
        if (data && typeof data === 'object' && data['$values'] && isIterable(data['$values'])) {
            userArray = toArray(data['$values']);
            console.log('Found JSON.NET $values array:', userArray);
        } else if (isIterable(data)) {
            // Response is directly iterable
            userArray = toArray(data);
            console.log('Direct iterable found, converted to array:', userArray);
        } else if (data && typeof data === 'object') {
            // Try common property names for nested arrays/lists
            const possibleArrayProps = ['users', 'data', 'items', 'results', 'list', 'values'];
            
            for (const prop of possibleArrayProps) {
                if (data[prop] && isIterable(data[prop])) {
                    userArray = toArray(data[prop]);
                    console.log(`Found iterable in property '${prop}':`, userArray);
                    break;
                }
            }
            
            // If no common property found, try to find any iterable property (excluding $id and other metadata)
            if (userArray.length === 0) {
                const keys = Object.keys(data).filter(key => !key.startsWith('$'));
                for (const key of keys) {
                    if (isIterable(data[key]) && data[key].length > 0) {
                        userArray = toArray(data[key]);
                        console.log(`Found iterable in property '${key}':`, userArray);
                        break;
                    }
                }
            }
            
            // If still no array found, check if the object itself has user-like properties
            if (userArray.length === 0 && data.userId !== undefined) {
                // Single user object, wrap in array
                userArray = [data];
                console.log('Single user object found, wrapped in array:', userArray);
            }
        }
        
        if (userArray.length === 0) {
            console.error('No valid user data found in response');
            console.error('Response structure:', JSON.stringify(data, null, 2));
            
            // Final fallback: try to extract user data from any object structure
            if (data && typeof data === 'object') {
                console.log('Attempting final fallback extraction...');
                
                // If data is an object with properties that look like user properties
                if (data.userId !== undefined || data.name !== undefined || data.nationalNo !== undefined) {
                    userArray = [data];
                    console.log('Treating response as single user object');
                } else {
                    // Try to find any nested objects that might contain user data
                    const allValues = Object.values(data);
                    for (const value of allValues) {
                        if (value && typeof value === 'object' && 
                            (value.userId !== undefined || value.name !== undefined)) {
                            if (Array.isArray(value)) {
                                userArray = value;
                            } else {
                                userArray = [value];
                            }
                            console.log('Found user data in nested object:', value);
                            break;
                        }
                    }
                }
            }
            
            if (userArray.length === 0) {
                throw new Error('No user data found in API response');
            }
        }
        
        console.log('Final user array to process:', userArray);
        
        // Map API response to UI format
        users = userArray.map((user, index) => {
            if (!user || typeof user !== 'object') {
                console.warn(`Invalid user object at index ${index}:`, user);
                return null;
            }
            
            return {
                id: user.userId || user.id || index,
                username: user.name || user.userName || user.username || 'غير محدد',
                nationalNo: user.nationalNo || user.nationalNumber || user.national_no || '',
                role: user.role !== undefined ? user.role : 0,
                roleDisplayName: roleDisplayNames[user.role] || 'غير محدد',
                accessRight: user.accessRight || user.access_right || 0,
                joinDate: user.joinDate || user.createdAt || user.created_at || new Date().toISOString().split('T')[0],
                status: user.status || user.isActive !== false ? 'active' : 'inactive'
            };
        }).filter(user => user !== null); // Remove any null entries

        filteredUsers = [...users];
        console.log('Successfully processed users:', users);
        
    } catch (error) {
        console.error('Error processing API response:', error);
        console.error('Raw response data:', data);
        throw new Error(`Failed to process API response: ${error.message}`);
    }
}

function showLoadingState() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="loading-state">
                <div class="loading-spinner"></div>
                <p>جاري تحميل المستخدمين...</p>
            </td>
        </tr>
    `;
    isLoading = true;
}

function hideLoadingState() {
    isLoading = false;
}

function showErrorMessage(message) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="error-state">
                <div>
                    <p class="error-message">${message}</p>
                    <button onclick="initializeUserList()" class="retry-button">إعادة المحاولة</button>
                </div>
            </td>
        </tr>
    `;
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    roleFilter.addEventListener('change', filterUsers);
    
    // Modal event listeners
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    
    // Close modals when clicking outside
    userModal.addEventListener('click', function(e) {
        if (e.target === userModal) {
            closeUserModal();
        }
    });
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Form submission
    const userForm = document.getElementById('userForm');
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const roleFilter = document.getElementById('roleFilter').value;
    
    filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                             (user.nationalNo && user.nationalNo.toLowerCase().includes(searchTerm));
        
        const matchesRole = !roleFilter || user.role.toString() === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    currentPage = 1;
    renderUsersTable();
    renderPagination();
}

function filterUsers() {
    handleSearch(); // This will apply both search and filter
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    if (paginatedUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div>
                        <p>لا توجد مستخدمين مطابقين للبحث</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paginatedUsers.map(user => `
        <tr>
            <td>${highlightSearchTerm(user.username)}</td>
            <td>${highlightSearchTerm(user.nationalNo || 'غير محدد')}</td>
            <td><span class="role-badge role-${user.role}">${getRoleDisplayName(user.role)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editUser(${user.id})" title="تعديل">
                        <img src="../../Assets/Images/edit.svg" alt="Edit" />
                        تعديل
                    </button>
                    <button class="btn-delete" onclick="deleteUser(${user.id})" title="حذف">
                        <img src="../../Assets/Images/delete.svg" alt="Delete" />
                        حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function getRoleDisplayName(role) {
    // Handle both numeric and string role values
    if (typeof role === 'number') {
        return roleDisplayNames[role] || 'غير محدد';
    }
    
    // Legacy support for string roles
    const legacyRoleNames = {
        'SuperUser': 'المشرف الرئيسي',
        'Admin': 'مدير',
        'Driver': 'سائق',
        'User': 'مستخدم'
    };
    return legacyRoleNames[role] || roleDisplayNames[role] || 'غير محدد';
}

function getStatusDisplayName(status) {
    return status === 'active' ? 'نشط' : 'غير نشط';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            السابق
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage || Math.abs(i - currentPage) <= 2) {
            paginationHTML += `
                <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>
                    ${i}
                </button>
            `;
        } else if (i === 1 || i === totalPages) {
            paginationHTML += `
                <button onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (Math.abs(i - currentPage) === 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            التالي
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderUsersTable();
    renderPagination();
}

// Modal Functions
function openAddUserModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('saveButton').textContent = 'حفظ';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.add('show');
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    editingUserId = userId;
    document.getElementById('modalTitle').textContent = 'تعديل المستخدم';
    document.getElementById('saveButton').textContent = 'تحديث';
    
    // Fill form with user data
    document.getElementById('username').value = user.username;
    document.getElementById('nationalNo').value = user.nationalNo || '';
    document.getElementById('password').value = ''; // Don't show existing password
    document.getElementById('role').value = user.role;
    
    // Make password field optional for editing
    document.getElementById('password').required = false;
    
    document.getElementById('userModal').classList.add('show');
}

function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    userToDelete = userId;
    document.getElementById('deleteModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
    document.getElementById('userForm').reset();
    document.getElementById('password').required = true;
    editingUserId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    userToDelete = null;
}

function saveUser() {
    const form = document.getElementById('userForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const userData = {
        username: formData.get('username'),
        nationalNo: formData.get('nationalNo'),
        password: formData.get('password'),
        role: parseInt(formData.get('role'))
    };
    
    // Check if national number already exists (exclude current user when editing)
    const nationalNoExists = users.some(user => 
        user.nationalNo === userData.nationalNo && user.id !== editingUserId
    );
    
    if (nationalNoExists) {
        alert('الرقم الوطني مستخدم بالفعل');
        return;
    }
    
    if (editingUserId) {
        // Update existing user
        const userIndex = users.findIndex(u => u.id === editingUserId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                username: userData.username,
                nationalNo: userData.nationalNo,
                role: userData.role
            };
            
            // Only update password if provided
            if (userData.password) {
                users[userIndex].password = userData.password;
            }
        }
    } else {
        // Add new user
        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            username: userData.username,
            nationalNo: userData.nationalNo,
            role: userData.role,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        users.push(newUser);
    }
    
    // Refresh the display
    filteredUsers = [...users];
    renderUsersTable();
    renderPagination();
    closeUserModal();
    
    // Show success message
    showNotification(editingUserId ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح', 'success');
}

function confirmDeleteUser() {
    if (!userToDelete) return;
    
    const userIndex = users.findIndex(u => u.id === userToDelete);
    if (userIndex !== -1) {
        const userName = users[userIndex].username;
        users.splice(userIndex, 1);
        
        // Refresh the display
        filteredUsers = [...users];
        renderUsersTable();
        renderPagination();
        
        // Adjust current page if necessary
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            renderUsersTable();
            renderPagination();
        }
        
        showNotification(`تم حذف المستخدم "${userName}" بنجاح`, 'success');
    }
    
    closeDeleteModal();
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Navigation Functions
function goBack() {
    window.location.href = '../dash-Boards/superUserDashboard.html';
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
    }
    
    .notification button:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style); 