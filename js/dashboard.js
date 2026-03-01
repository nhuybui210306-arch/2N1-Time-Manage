// Global variables
let currentUser = null;
let pomodoroInterval = null;
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let pomodoroRunning = false;
let audio = document.getElementById('lofiAudio');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'register.html';
        return;
    }
    
    // Load user data
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'register.html';
        return;
    }
    
    // Initialize user data structure if not exists
    if (!currentUser.tasks) currentUser.tasks = [];
    if (!currentUser.pets) currentUser.pets = [];
    if (!currentUser.schedule) currentUser.schedule = {};
    
    // Display user info
    displayUserInfo();
    
    // Display current date
    displayCurrentDate();
    
    // Load tasks
    loadTasks();
    
    // Load schedule
    loadSchedule();
    
    // Load pets
    loadMyPets();
    
    // Setup event listeners
    setupEventListeners();
});

function displayUserInfo() {
    document.getElementById('userName').textContent = currentUser.fullname;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('welcomeName').textContent = currentUser.fullname.split(' ')[0];
    document.getElementById('userPoints').textContent = currentUser.points || 0;
}

function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('vi-VN', options);
    document.getElementById('currentDate').textContent = today;
}

function setupEventListeners() {
    // Add task
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    
    // Pomodoro timer
    document.getElementById('startPomodoro').addEventListener('click', startPomodoro);
    document.getElementById('pausePomodoro').addEventListener('click', pausePomodoro);
    document.getElementById('resetPomodoro').addEventListener('click', resetPomodoro);
    
    // Timer mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            pomodoroTime = parseInt(this.dataset.time) * 60;
            updateTimerDisplay();
        });
    });
    
    // Music player
    document.getElementById('playMusic').addEventListener('click', playMusic);
    document.getElementById('pauseMusic').addEventListener('click', pauseMusic);
    document.getElementById('volumeControl').addEventListener('change', setVolume);
    document.getElementById('musicSelect').addEventListener('change', changeMusic);
    
    // Pet store
    document.getElementById('petStoreBtn').addEventListener('click', openPetStore);
    document.querySelector('.close').addEventListener('click', closePetStore);
    
    // Buy pet buttons
    document.querySelectorAll('.buy-pet-btn').forEach(btn => {
        btn.addEventListener('click', buyPet);
    });
    
    // Save schedule
    document.getElementById('saveScheduleBtn').addEventListener('click', saveSchedule);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('petStoreModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

// Task functions
function addTask() {
    const title = document.getElementById('taskTitle').value;
    const time = document.getElementById('taskTime').value;
    const priority = document.getElementById('taskPriority').value;
    
    if (!title || !time) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }
    
    const task = {
        id: Date.now(),
        title: title,
        time: time,
        priority: priority,
        completed: false
    };
    
    currentUser.tasks.push(task);
    saveUserData();
    loadTasks();
    
    // Clear inputs
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskTime').value = '';
}

function loadTasks() {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';
    
    // Sort tasks by time
    const sortedTasks = [...currentUser.tasks].sort((a, b) => a.time.localeCompare(b.time));
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-item ${task.priority}`;
    div.dataset.id = task.id;
    
    div.innerHTML = `
        <div class="task-info">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-details">
                <h4>${task.title}</h4>
                <p><i class="fas fa-clock"></i> ${task.time}</p>
            </div>
        </div>
        <div class="task-actions">
            <button class="complete-btn" onclick="toggleTaskComplete(${task.id})">
                <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
            </button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function toggleTaskComplete(taskId) {
    const task = currentUser.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        
        // Add points if task is completed
        if (task.completed) {
            currentUser.points = (currentUser.points || 0) + 10;
            showNotification('+10 điểm!', 'success');
        }
        
        saveUserData();
        loadTasks();
        document.getElementById('userPoints').textContent = currentUser.points;
    }
}

function deleteTask(taskId) {
    if (confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) {
        currentUser.tasks = currentUser.tasks.filter(t => t.id !== taskId);
        saveUserData();
        loadTasks();
    }
}

// Pomodoro functions
function startPomodoro() {
    if (!pomodoroRunning) {
        pomodoroRunning = true;
        pomodoroInterval = setInterval(updatePomodoro, 1000);
    }
}

function pausePomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
}

function resetPomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroTime = 25 * 60;
    updateTimerDisplay();
}

function updatePomodoro() {
    if (pomodoroTime > 0) {
        pomodoroTime--;
        updateTimerDisplay();
    } else {
        // Timer finished
        pausePomodoro();
        showNotification('Pomodoro hoàn thành! +20 điểm', 'success');
        currentUser.points = (currentUser.points || 0) + 20;
        saveUserData();
        document.getElementById('userPoints').textContent = currentUser.points;
        resetPomodoro();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

// Music functions
function playMusic() {
    audio.play();
}

function pauseMusic() {
    audio.pause();
}

function setVolume() {
    audio.volume = document.getElementById('volumeControl').value;
}

function changeMusic() {
    const select = document.getElementById('musicSelect');
    const source = document.getElementById('lofiAudio').getElementsByTagName('source')[0];
    source.src = `assets/sounds/${select.value}.mp3`;
    audio.load();
    if (!audio.paused) {
        audio.play();
    }
}

// Pet store functions
function openPetStore() {
    document.getElementById('modalPoints').textContent = currentUser.points || 0;
    loadMyPets();
    document.getElementById('petStoreModal').style.display = 'block';
}

function closePetStore() {
    document.getElementById('petStoreModal').style.display = 'none';
}

function buyPet(event) {
    const petCard = event.target.closest('.pet-card');
    const petName = petCard.dataset.pet;
    const price = parseInt(petCard.dataset.price);
    
    if (currentUser.points >= price) {
        currentUser.points -= price;
        if (!currentUser.pets) currentUser.pets = [];
        currentUser.pets.push(petName);
        
        saveUserData();
        document.getElementById('userPoints').textContent = currentUser.points;
        document.getElementById('modalPoints').textContent = currentUser.points;
        loadMyPets();
        
        showNotification(`Mua ${petName} thành công!`, 'success');
    } else {
        showNotification('Không đủ điểm!', 'error');
    }
}

function loadMyPets() {
    const myPetsList = document.getElementById('myPetsList');
    if (!currentUser.pets) {
        myPetsList.innerHTML = '<p>Bạn chưa có thú cưng nào</p>';
        return;
    }
    
    // Count pets
    const petCounts = {};
    currentUser.pets.forEach(pet => {
        petCounts[pet] = (petCounts[pet] || 0) + 1;
    });
    
    myPetsList.innerHTML = '';
    Object.entries(petCounts).forEach(([pet, count]) => {
        const petIcons = {
            cat: 'fa-cat',
            dog: 'fa-dog',
            hippo: 'fa-hippo',
            dragon: 'fa-dragon',
            fish: 'fa-fish',
            frog: 'fa-frog'
        };
        
        const div = document.createElement('div');
        div.className = 'my-pet-item';
        div.innerHTML = `
            <i class="fas ${petIcons[pet] || 'fa-paw'}"></i>
            <span>${pet.charAt(0).toUpperCase() + pet.slice(1)} x${count}</span>
        `;
        myPetsList.appendChild(div);
    });
}

// Schedule functions
function loadSchedule() {
    const textareas = document.querySelectorAll('.schedule-day textarea');
    textareas.forEach(textarea => {
        const day = textarea.dataset.day;
        if (currentUser.schedule && currentUser.schedule[day]) {
            textarea.value = currentUser.schedule[day];
        }
    });
}

function saveSchedule() {
    const textareas = document.querySelectorAll('.schedule-day textarea');
    textareas.forEach(textarea => {
        const day = textarea.dataset.day;
        currentUser.schedule[day] = textarea.value;
    });
    
    saveUserData();
    showNotification('Lịch học đã được lưu!', 'success');
}

// Utility functions
function saveUserData() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#26de81' : '#ff4757'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Make functions global
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
