const today_tasks = document.querySelector('.task-list-today ul');
const user_tasks = document.querySelector('.task-list-user ul');
const task_list = document.querySelector('.all-tasks ul');
const leaderboard = document.querySelector('.leaderboard-list ol');
const userDropdown = document.getElementById('user-dropdown');

function logout() {
    fetch('/logout', { method: 'POST' }).then(() => {
        window.location.href = '/login.html';
    });
}

async function loadUsers() {
    const response = await fetch('/getCurrentUser');
    const currentUser = await response.json();
    userDropdown.innerHTML = '';
    userDropdown.appendChild(new Option("All tasks", ""));
    const option = document.createElement('option');
    option.value = currentUser.id;
    option.textContent = currentUser.username;
    userDropdown.appendChild(option);
    userDropdown.value = currentUser.id; // Set to current user by default
    
    // Display current user at top of page
    document.getElementById('current-user-display').textContent = currentUser.username;
    
    // Initialize header
    updateUserTasksHeader();
}
loadUsers();

async function getTodayTasks() {
    today_tasks.innerHTML = '';
    const response = await fetch('/getTasksinDay');
    const tasks = await response.json();
    const today = new Date().toISOString().substring(0, 10);
    for (let task of tasks) {
        //SELECT Users.Name as User, Tasks.Name as Task, Tasks.Points as Points, Status, Date

        if (task.Date === today) {
            const li = document.createElement('li');
            li.textContent = `${task.User} - ${task.Task} (${task.Points} points) - Status: ${task.Status} - Date: ${task.Date}`;
            
            const button = document.createElement('button');
            button.textContent = '✅'; 
            button.addEventListener('click',async () => {
                
                await fetch(`/completeTask/${task.ID}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Completed' })
                });

                getUserTasks();
                getTodayTasks();
                displayLeaderboard();
            });

            if (task.Status) {
                li.style.textDecoration = 'line-through';
                li.style.opacity = '0.6';
            } else {
                li.style.textDecoration = 'none';
                li.style.opacity = '1';
            }

            li.appendChild(button);
            
            today_tasks.appendChild(li);
        }
    }
}
getTodayTasks();

async function getUserTasks() {
    user_tasks.innerHTML = '';
    const response = await fetch('/getTasksinDay');
    const tasks = await response.json();
    const user = userDropdown.value;
    for (let task of tasks) {
        //SELECT Users.Name as User, Users.ID as UserID, Tasks.Name as Task, Tasks.Points as Points, Status, Date

        if (task.UserID == user || user == "" || user === null) {
            const li = document.createElement('li');
            li.textContent = `${task.User} - ${task.Task} (${task.Points} points) - Status: ${task.Status} - Date: ${task.Date}`;

            const button = document.createElement('button');
            button.textContent = '✅'; 
            button.addEventListener('click',async () => {
                
                await fetch(`/completeTask/${task.ID}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Completed' })
                });

                getUserTasks();
                getTodayTasks();
                displayLeaderboard();
            });

            if (task.Status) {
                li.style.textDecoration = 'line-through';
                li.style.opacity = '0.6';
            } else {
                li.style.textDecoration = 'none';
                li.style.opacity = '1';
            }

            li.appendChild(button);
            user_tasks.appendChild(li);
        }
    }
}

function updateUserTasksHeader() {
    const userTasksHeader = document.querySelector('.user-tasks h3');
    if (userDropdown.value === "") {
        userTasksHeader.textContent = "All tasks";
    } else {
        userTasksHeader.textContent = "Your tasks";
    }
}

getUserTasks();
userDropdown.addEventListener('change', () => {
    getUserTasks();
    updateUserTasksHeader();
});


async function displaytasks() {
    const response = await fetch('/getTasks');
    const tasks = await response.json();
    task_list.innerHTML = '';
    for (let task of tasks) {
        const li = document.createElement('li');
        li.textContent = `${task.Name} - ${task.Points} points`;

        const button = document.createElement('button');
        button.textContent = '🗑️'; 
        button.addEventListener('click', () => {
            openDeleteTaskModal(task.ID, task.Name);
        });

        const button2 = document.createElement('button');
        button2.textContent = '📆';
        button2.addEventListener('click', () => {
            openAssignTaskModal(task.ID);
        });
        
        li.appendChild(button2);
        li.appendChild(button);
        task_list.appendChild(li);
    }
}

function showAssignForm(taskID, li) {
    // Create form container
    const formDiv = document.createElement('div');
    formDiv.style.marginTop = '10px';
    formDiv.style.padding = '10px';
    formDiv.style.border = '1px solid #ccc';
    formDiv.style.borderRadius = '4px';

    // Date input
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Date: ';
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.required = true;

    // User dropdown
    const userLabel = document.createElement('label');
    userLabel.textContent = 'Assign to user: ';
    userLabel.style.marginLeft = '20px';
    const userSelect = document.createElement('select');
    userSelect.required = true;

    // Populate user dropdown
    userDropdown.querySelectorAll('option').forEach(option => {
        if (option.value) { // Skip the "Select a user" option
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.textContent;
            userSelect.appendChild(opt);
        }
    });

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Assign';
    submitBtn.type = 'button';
    submitBtn.style.marginLeft = '20px';
    submitBtn.addEventListener('click', async () => {
        if (!dateInput.value || !userSelect.value) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/assignTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskID: taskID,
                    userID: userSelect.value,
                    date: dateInput.value
                })
            });
            formDiv.remove();
            getTodayTasks();
            getUserTasks();
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Error assigning task');
        }
    });

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.addEventListener('click', () => {
        formDiv.remove();
    });

    // Append elements to form
    formDiv.appendChild(dateLabel);
    formDiv.appendChild(dateInput);
    formDiv.appendChild(userLabel);
    formDiv.appendChild(userSelect);
    formDiv.appendChild(submitBtn);
    formDiv.appendChild(cancelBtn);

    // Append form to list item
    li.appendChild(formDiv);
}

displaytasks();


async function displayLeaderboard() {
    leaderboard.innerHTML = '';
    const response = await fetch('/getUsers');
    const users  = await response.json();
    for (let user of users) {
        const li = document.createElement('li');
        if (user.Name === "N/A") continue;

        li.textContent = `${user.Name} - ${user.Points} points`;
        
        leaderboard.appendChild(li);
    }
}
displayLeaderboard();

document.querySelector('.add-task').addEventListener('click', addTask);

// Add enter key support for task inputs
document.getElementById('task-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask(e);
    }
});
document.getElementById('task-points').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask(e);
    }
});

async function addTask(e) {
    e.preventDefault();
    const name = document.getElementById('task-name').value;
    const points = document.getElementById('task-points').value;
    const onlyLetters = /^[a-zA-Z0-9\s]+$/.test(name);
    
    if (!onlyLetters) {
        alert('Please enter a valid task name.');
        return;
    }
    if (points <= 0) {
        alert('Please enter a valid number of points.');
        return;
    }

    const response = await fetch('/getTasks');
    const tasks = await response.json();
    for (let task of tasks) {
        if (task.Name == name) {
            alert("Task already created.");
            return;
        }
    }

    console.log('Adding task:', { name, points });

    const res = await fetch('/addTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskname: name, points: parseInt(points) })
    });
    
    if (res.ok) {
        // Clear input fields on successful submission
        document.getElementById('task-name').value = '';
        document.getElementById('task-points').value = '';
    }
    displaytasks();
}

/*
document.querySelector('.add-user').addEventListener('click', addUser);
async function addUser(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const onlyLetters = /^[a-zA-Z\s]+$/.test(name);
    if (!onlyLetters) {
        alert('Please enter a valid user name.');
        return;
    }

    const response = await fetch('/getUsers');
    const users  = await response.json();
    for (let user of users) {
        if (user.Name == name) {
            alert("Username already used.");
            return;
        }
    }

    const res = await fetch('/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name })
    });
    displayLeaderboard();
    loadUsers();

    let inputs = document.getElementById('user-name');
    inputs.forEach(input =>  input.value = '');
}
*/

// Task Modal Functions
let currentTaskID = null;

function openAssignTaskModal(taskID) {
    currentTaskID = taskID;
    const modal = document.getElementById('assign-task-modal');
    const userSelect = document.getElementById('assign-user');
    
    // Populate user dropdown
    userSelect.innerHTML = '<option value="">Select a user</option>';
    userDropdown.querySelectorAll('option').forEach(option => {
        if (option.value) {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.textContent;
            userSelect.appendChild(opt);
        }
    });
    
    // Reset date input
    document.getElementById('assign-date').value = '';
    
    modal.style.display = 'block';
}

function closeAssignTaskModal() {
    document.getElementById('assign-task-modal').style.display = 'none';
    currentTaskID = null;
}

async function confirmAssignTask() {
    const date = document.getElementById('assign-date').value;
    const userID = document.getElementById('assign-user').value;
    
    if (!date || !userID) {
        alert('Please fill in all fields');
        return;
    }
    
    const response = await fetch('/assignTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            taskID: currentTaskID,
            userID: userID,
            date: date
        })
    });
    
    if (response.ok) {
        alert('Task assigned successfully!');
        closeAssignTaskModal();
        getTodayTasks();
        getUserTasks();
    } else {
        alert('Error assigning task');
    }
}

function openDeleteTaskModal(taskID, taskName) {
    currentTaskID = taskID;
    document.getElementById('delete-task-name').textContent = taskName;
    document.getElementById('delete-task-modal').style.display = 'block';
}

function closeDeleteTaskModal() {
    document.getElementById('delete-task-modal').style.display = 'none';
    currentTaskID = null;
}

async function confirmDeleteTask() {
    const response = await fetch(`/deleteTask/${currentTaskID}`, {
        method: 'DELETE'
    });
    
    if (response.ok) {
        alert('Task deleted successfully!');
        closeDeleteTaskModal();
        displaytasks();
        getTodayTasks();
        getUserTasks();
    } else {
        alert('Error deleting task');
    }
}

// Profile functions
async function displayProfile() {
    const response = await fetch('/getUserProfile');
    const user = await response.json();
    
    document.getElementById('profile-name').textContent = user.Name;
    document.getElementById('profile-username').textContent = user.Username;
    document.getElementById('profile-points').textContent = user.Points;
    document.getElementById('profile-family').textContent = user.FamilyName ? user.FamilyName : 'None';
    
    // Store the current family ID for later use
    window.currentUserFamilyID = user.FamilyID;
    
    // Load families dropdown for family selection
    const familiesResponse = await fetch('/getFamilies');
    const families = await familiesResponse.json();
    const editFamilySelect = document.getElementById('edit-family-select');
    editFamilySelect.innerHTML = '<option value="">Select a family</option>';
    for (let family of families) {
        const option = document.createElement('option');
        option.value = family.ID;
        option.textContent = family.Name;
        editFamilySelect.appendChild(option);
    }
    if (user.FamilyID) {
        editFamilySelect.value = user.FamilyID;
    }
    
    // Load recent tasks
    const tasksResponse = await fetch('/getUserRecentTasks');
    const tasks = await tasksResponse.json();
    const profileTasks = document.querySelector('.profile-recent-tasks ul');
    profileTasks.innerHTML = '';
    for (let task of tasks) {
        const li = document.createElement('li');
        const statusText = task.Status ? '✅ Completed' : '❌ Incomplete';
        li.textContent = `${task.Name} (${task.Points} points) - ${statusText} - ${task.Date}`;
        profileTasks.appendChild(li);
    }
}

// Toggle family members display
async function toggleFamilyMembers() {
    const membersList = document.getElementById('family-members-list');
    
    if (!window.currentUserFamilyID) {
        alert('You are not part of a family');
        return;
    }
    
    if (membersList.style.display === 'none') {
        // Load and show family members
        const response = await fetch(`/getFamilyMembers/${window.currentUserFamilyID}`);
        const members = await response.json();
        
        membersList.innerHTML = '';
        for (let member of members) {
            const li = document.createElement('li');
            li.textContent = member.Name;
            membersList.appendChild(li);
        }
        membersList.style.display = 'block';
    } else {
        // Hide family members
        membersList.style.display = 'none';
    }
}
function openEditName() {
    document.getElementById('edit-name-modal').style.display = 'block';
    document.getElementById('edit-name-input').value = document.getElementById('profile-name').textContent;
}

function closeEditName() {
    document.getElementById('edit-name-modal').style.display = 'none';
}

async function saveName() {
    const newName = document.getElementById('edit-name-input').value;
    
    if (!newName) {
        alert('Please enter a name');
        return;
    }
    
    const response = await fetch('/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
    });
    
    if (response.ok) {
        alert('Name updated successfully!');
        closeEditName();
        displayProfile();
        loadUsers();
    } else {
        const error = await response.json();
        alert('Error: ' + error.error);
    }
}

// Modal functions for username
function openEditUsername() {
    document.getElementById('edit-username-modal').style.display = 'block';
    document.getElementById('edit-username-input').value = document.getElementById('profile-username').textContent;
}

function closeEditUsername() {
    document.getElementById('edit-username-modal').style.display = 'none';
}

async function saveUsername() {
    const newUsername = document.getElementById('edit-username-input').value;
    
    if (!newUsername) {
        alert('Please enter a username');
        return;
    }
    
    const response = await fetch('/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
    });
    
    if (response.ok) {
        alert('Username updated successfully!');
        closeEditUsername();
        displayProfile();
        loadUsers();
    } else {
        const error = await response.json();
        alert('Error: ' + error.error);
    }
}

// Modal functions for family
function openEditFamily() {
    document.getElementById('edit-family-modal').style.display = 'block';
}

function closeEditFamily() {
    document.getElementById('edit-family-modal').style.display = 'none';
}

async function saveFamily() {
    const familyId = document.getElementById('edit-family-select').value;
    
    const response = await fetch('/updateUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: familyId })
    });
    
    if (response.ok) {
        alert('Family updated successfully!');
        closeEditFamily();
        displayProfile();
        loadUsers();
    } else {
        const error = await response.json();
        alert('Error: ' + error.error);
    }
}

async function createFamily() {
    const familyName = document.getElementById('profile-new-family').value;
    
    if (!familyName) {
        alert('Please enter a family name');
        return;
    }
    
    const response = await fetch('/createFamily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName })
    });
    
    if (response.ok) {
        alert('Family created successfully!');
        document.getElementById('profile-new-family').value = '';
        displayProfile();
    } else {
        const error = await response.json();
        alert('Error: ' + error.error);
    }
}


// Handle tab switching
const tabButtons = document.querySelectorAll('.tab-button');

tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Hide all divs
        document.getElementById('today').style.display = 'none';
        document.getElementById('tasks').style.display = 'none';
        document.getElementById('leaderboard').style.display = 'none';
        document.getElementById('profile').style.display = 'none';
        
        // Show the selected div
        const tabName = button.getAttribute('data-tab');
        document.getElementById(tabName).style.display = 'block';
        
        // Load profile data if profile tab is clicked
        if (tabName === 'profile') {
            displayProfile();
        }
        
        // Save the active tab to localStorage
        localStorage.setItem('activeTab', tabName);
    });
});


async function first_display() {
    // Get the saved tab from localStorage, default to 'today'
    const savedTab = localStorage.getItem('activeTab') || 'today';
    
    document.getElementById('today').style.display = 'none';
    document.getElementById('tasks').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('profile').style.display = 'none';
    document.getElementById(savedTab).style.display = 'block';
    
    // Load profile data if profile tab is the saved tab
    if (savedTab === 'profile') {
        displayProfile();
    }
    
    // Update active button
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === savedTab) {
            btn.classList.add('active');
        }
    });
}
first_display();