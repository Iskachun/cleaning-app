const today_tasks = document.querySelector('.task-list-today ul');
const user_tasks = document.querySelector('.task-list-user ul');
const task_list = document.querySelector('.all-tasks ul');
const leaderboard = document.querySelector('.leaderboard-list ol');
const userDropdown = document.getElementById('user-dropdown');

async function loadUsers() {
    const response = await fetch('/getUsers');
    const users = await response.json();
    userDropdown.innerHTML = '';
    userDropdown.appendChild(new Option("Select a user", ""));
    for (let user of users) {
        //console.log(user.Name);
        const option = document.createElement('option');
        option.value = user.ID;
        option.textContent = user.Name;
        userDropdown.appendChild(option);
    }
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
getUserTasks();
userDropdown.addEventListener('change', getUserTasks);


async function displaytasks() {
    const response = await fetch('/getTasks');
    const tasks = await response.json();
    task_list.innerHTML = '';
    for (let task of tasks) {
        const li = document.createElement('li');
        li.textContent = `${task.Name} - ${task.Points} points`;

        const button = document.createElement('button');
        button.textContent = '🗑️'; 
        button.addEventListener('click',async () => {
            li.remove();
            const respone = await fetch(`/deleteTask/${task.ID}`, {
                method: 'DELETE'
            });
            getTodayTasks();
            getUserTasks();
        });

        const button2 = document.createElement('button');
        button2.textContent = '📆';
        button2.addEventListener('click',async () => {
            showAssignForm(task.ID, li);
            getTodayTasks();
            getUserTasks();
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

        const button = document.createElement('button');
        button.textContent = '🗑️'; 
        button.addEventListener('click',async () => {
            if (user.ID === 0) {
                alert("Cannot delete this user.");
                return;
            }
            li.remove();
            const respone = await fetch(`/deleteUser/${user.ID}`, {
                method: 'DELETE'
            });
            loadUsers();
            displayLeaderboard();
        });
        
        li.appendChild(button);
        leaderboard.appendChild(li);
    }
}
displayLeaderboard();

document.querySelector('.add-task').addEventListener('click', addTask);
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
    task_list.innerHTML = '';
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
        
        // Show the selected div
        const tabName = button.getAttribute('data-tab');
        document.getElementById(tabName).style.display = 'block';
    });
});


async function first_display() {
    document.getElementById('tasks').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('today').style.display = 'block';
}
first_display();