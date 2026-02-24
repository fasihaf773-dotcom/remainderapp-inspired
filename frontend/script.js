const API_URL = 'http://localhost:5000/api/tasks';
let tasks = [];
let activeCategory = null;
let currentEditTask = null;
let newStarred = false;
let editStarred = false;

async function loadTasks() {
    try {
        const res = await fetch(API_URL);
        tasks = await res.json();
        render();
    } catch (err) {
        console.error('Error:', err);
    }
}

function isToday(datetime) {
    if (!datetime) return false;
    const d = new Date(datetime);
    const now = new Date();
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear();
}

function formatDateTime(dt) {
    if (!dt) return null;
    return new Date(dt).toLocaleString("en-US", {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: 'numeric', minute: '2-digit'
    });
}

function getCounts() {
    return {
        today: tasks.filter(t => isToday(t.datetime)).length,
        scheduled: tasks.filter(t => t.datetime && !t.completed).length,
        important: tasks.filter(t => t.starred).length,
        place: 0,
        noAlert: tasks.filter(t => !t.datetime && !t.completed).length,
        completed: tasks.filter(t => t.completed).length,
    };
}

function filterTasks(category) {
    let filtered = [];
    switch (category) {
        case "today": 
            filtered = tasks.filter(t => isToday(t.datetime));
            break;
        case "scheduled": 
            filtered = tasks.filter(t => t.datetime && !t.completed);
            break;
        case "important": 
            filtered = tasks.filter(t => t.starred);
            break;
        case "place": 
            filtered = [];
            break;
        case "noAlert": 
            filtered = tasks.filter(t => !t.datetime && !t.completed);
            break;
        case "completed": 
            filtered = tasks.filter(t => t.completed);
            break;
        default: 
            filtered = [...tasks];
    }
    return filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function render() {
    const counts = getCounts();
    const displayed = activeCategory ? filterTasks(activeCategory) : filterTasks(null);
    
    document.getElementById('todayCount').textContent = counts.today;
    document.getElementById('scheduledCount').textContent = counts.scheduled;
    document.getElementById('importantCount').textContent = counts.important;
    document.getElementById('placeCount').textContent = counts.place;
    document.getElementById('noAlertCount').textContent = counts.noAlert;
    document.getElementById('completedCount').textContent = counts.completed;
    
    document.querySelectorAll('.category-card').forEach(card => {
        const key = card.dataset.category;
        if (key === activeCategory) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    const alertTasks = document.getElementById('alertTasks');
    const noAlertTasks = document.getElementById('noAlertTasks');
    
    if (activeCategory) {
        alertTasks.innerHTML = displayed.map(createTaskHTML).join('');
        noAlertTasks.innerHTML = '';
        document.querySelector('.section-title').textContent = getCategoryLabel(activeCategory);
    } else {
        const withAlert = tasks.filter(t => t.datetime).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const withoutAlert = tasks.filter(t => !t.datetime).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        
        alertTasks.innerHTML = withAlert.map(createTaskHTML).join('');
        noAlertTasks.innerHTML = withoutAlert.map(createTaskHTML).join('');
        document.querySelector('.section-title').textContent = 'alert';
    }
    
    addTaskListeners();
}

function getCategoryLabel(key) {
    const labels = {
        today: 'Today',
        scheduled: 'Scheduled',
        important: 'Important',
        place: 'Place',
        noAlert: 'No alert',
        completed: 'Completed'
    };
    return labels[key] || 'All';
}

function createTaskHTML(task) {
    return `
        <div class="task-card ${task.completed ? 'task-completed' : ''}" data-id="${task._id}">
            <div class="task-checkbox" data-id="${task._id}" style="background: ${task.completed ? '#5865f2' : 'transparent'}; border-color: ${task.completed ? '#5865f2' : 'rgba(255,255,255,0.4)'}">
                ${task.completed ? '<span style="font-size: 11px; color: white;">✓</span>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.datetime ? `<div class="task-time">${formatDateTime(task.datetime)}</div>` : ''}
            </div>
            <button class="star-btn-inline" data-id="${task._id}">
                ${task.starred ? '⭐' : '☆'}
            </button>
        </div>
    `;
}

function addTaskListeners() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.onclick = () => {
            const key = card.dataset.category;
            activeCategory = activeCategory === key ? null : key;
            render();
        };
    });
    
    document.querySelectorAll('.task-card').forEach(card => {
        card.onclick = (e) => {
            if (e.target.classList.contains('task-checkbox') || 
                e.target.classList.contains('star-btn-inline')) {
                return;
            }
            openEditModal(card.dataset.id);
        };
    });
    
    document.querySelectorAll('.task-checkbox').forEach(box => {
        box.onclick = (e) => {
            e.stopPropagation();
            toggleComplete(box.dataset.id);
        };
    });
    
    document.querySelectorAll('.star-btn-inline').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            toggleStar(btn.dataset.id);
        };
    });
}

async function toggleComplete(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !task.completed })
        });
        await loadTasks();
    } catch (err) {
        console.error('Error:', err);
    }
}

async function toggleStar(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ starred: !task.starred })
        });
        await loadTasks();
    } catch (err) {
        console.error('Error:', err);
    }
}

function openAddModal() {
    newStarred = false;
    document.getElementById('addTaskPopup').style.display = 'block';
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskDatetime').value = '';
    document.getElementById('newStarBtn').textContent = '☆';
}

function closeAddModal() {
    document.getElementById('addTaskPopup').style.display = 'none';
}

function toggleNewStar() {
    newStarred = !newStarred;
    document.getElementById('newStarBtn').textContent = newStarred ? '⭐' : '☆';
}

async function saveNewTask() {
    const newTitle = document.getElementById('newTaskTitle').value.trim();
    const newDatetime = document.getElementById('newTaskDatetime').value;
    
    if (!newTitle) {
        alert('Please enter a title!');
        return;
    }
    
    const task = {
        title: newTitle,
        datetime: newDatetime,
        completed: false,
        starred: newStarred,
        createdAt: Date.now(),
        category: newDatetime ? 'alert' : 'noAlert'
    };
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        closeAddModal();
        await loadTasks();
    } catch (err) {
        console.error('Error:', err);
    }
}

function openEditModal(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    
    currentEditTask = task;
    editStarred = task.starred || false;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDatetime').value = task.datetime || '';
    document.getElementById('editStarBtn').textContent = editStarred ? '⭐' : '☆';
    document.getElementById('taskDetailPopup').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('taskDetailPopup').style.display = 'none';
    currentEditTask = null;
}

function toggleEditStar() {
    editStarred = !editStarred;
    document.getElementById('editStarBtn').textContent = editStarred ? '⭐' : '☆';
}

async function saveEditTask() {
    const editTitle = document.getElementById('editTaskTitle').value.trim();
    const editDatetime = document.getElementById('editTaskDatetime').value;
    
    if (!editTitle) {
        alert('Please enter a title!');
        return;
    }
    
    try {
        await fetch(`${API_URL}/${currentEditTask._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: editTitle,
                datetime: editDatetime,
                starred: editStarred
            })
        });
        closeEditModal();
        await loadTasks();
    } catch (err) {
        console.error('Error:', err);
    }
}

async function deleteTask() {
    if (!currentEditTask) return;
    
    try {
        await fetch(`${API_URL}/${currentEditTask._id}`, {
            method: 'DELETE'
        });
        closeEditModal();
        await loadTasks();
    } catch (err) {
        console.error('Error:', err);
    }
}

window.onload = () => {
    loadTasks();
    
    document.querySelector('.add-btn').onclick = openAddModal;
    document.querySelector('#addTaskPopup .back-btn').onclick = closeAddModal;
    document.getElementById('newStarBtn').onclick = toggleNewStar;
    document.querySelector('#addTaskPopup .save-task-btn').onclick = saveNewTask;
    
    document.querySelector('#taskDetailPopup .back-btn').onclick = closeEditModal;
    document.getElementById('editStarBtn').onclick = toggleEditStar;
    document.querySelector('#taskDetailPopup .save-task-btn').onclick = saveEditTask;
    document.querySelector('.delete-btn-popup').onclick = deleteTask;
    
    document.getElementById('addTaskPopup').onclick = (e) => {
        if (e.target.id === 'addTaskPopup') closeAddModal();
    };
    document.getElementById('taskDetailPopup').onclick = (e) => {
        if (e.target.id === 'taskDetailPopup') closeEditModal();
    };
};