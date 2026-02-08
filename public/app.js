const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');

// Добавляем слово async перед function
window.showSection = async function(sectionId) {
    console.log("Switching to section:", sectionId);

    if ((sectionId === 'profile') && !token) {
        alert("Please sign in to access this section.");
        sectionId = 'auth'; // Принудительно меняем на страницу входа
    }
    document.querySelectorAll('main > section').forEach(sec => sec.style.display = 'none');
    
    const target = document.getElementById(sectionId + '-section');
    if (target) {
        target.style.display = 'block';
    }

        if (sectionId === 'showroom') {
        loadCars();
        
        // Проверяем админа
        const role = localStorage.getItem('role');
        const addBtn = document.getElementById('add-car-btn');
        
        // Показываем кнопку ТОЛЬКО админу
        if (addBtn) {
            if (role === 'admin') {
                addBtn.style.display = 'block';
            } else {
                addBtn.style.display = 'none';
                // На всякий случай скрываем и панель добавления, если она была открыта
                document.getElementById('add-car-panel').style.display = 'none';
            }
        }
    

    } 
    else if (sectionId === 'profile') {
        try {
            // Загружаем профиль
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { 'x-auth-token': token }
            });
            
            if (res.ok) {
                const user = await res.json();
                document.getElementById('profile-email').innerText = user.email;
                document.getElementById('profile-username').innerText = user.username;
                
                // ВОТ ЗДЕСЬ нужно вызывать загрузку аренд (отдельной строкой)
                loadMyRentals(); 
            } else {
                alert('Failed to load profile. Please login again.');
                logout();
            }
        } catch (err) {
            console.error(err);
        }
    }
};



window.logout = function() {
    console.log("Logging out...");
    
    // Очищаем всё
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    token = null;

    // Обновляем кнопки меню
    updateNav();

    // ЯВНО переключаем на экран входа
    window.showSection('auth'); 
    
    // Дополнительно: сбрасываем формы, чтобы было чисто
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('login-block').style.display = 'block';
    document.getElementById('register-block').style.display = 'none';
};


function updateNav() {
    const authBtn = document.getElementById('auth-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Найдем кнопки меню, которые нужно прятать
    // В index.html добавь ID кнопке профиля: <button id="nav-profile" ...>
    // Или найдем её по тексту (менее надежно, лучше добавь ID в HTML)
    const profileBtn = document.querySelector('button[onclick="showSection(\'profile\')"]');

    if (token) {
        // Если вошли
        if(authBtn) authBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
        if(profileBtn) profileBtn.style.display = 'inline-block'; // Показываем профиль
    } else {
        // Если вышли
        if(authBtn) authBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(profileBtn) profileBtn.style.display = 'none'; // Скрываем профиль
    }
}



// --- Auth Toggle Logic ---
// Сделаем функцию глобальной, чтобы она была видна из HTML onclick
window.toggleAuth = function(type) {
    console.log("Toggling auth to:", type);
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Сбрасываем поля
    loginForm.reset();
    registerForm.reset();

    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
};

// --- Event Listeners (Ждем загрузки DOM) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Login Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Attempting login...");
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    token = data.token;
                    // Сохраняем роль и ID в localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('role', data.user.role); // <--- ВАЖНО
                    localStorage.setItem('userId', data.user.id);
                    
                    alert("Login Successful!");
                    updateNav();
                } else {
                    alert(data.msg || "Login failed");
                }
            } catch (err) {
                console.error(err);
                alert('Server error during login');
            }
        });
    }

    // Register Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Attempting registration...");
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    token = data.token;
                    localStorage.setItem('token', token);
                    alert("Registration Successful!");
                    updateNav();
                } else {
                    alert(data.msg || "Registration failed");
                }
            } catch (err) {
                console.error(err);
                alert('Server error during registration');
            }
        });
    }

    // Инициализация при загрузке
    updateNav();
});

// --- Logout ---
window.logout = function() {
    localStorage.removeItem('token');
    token = null;
    updateNav();
};

// --- Showroom & Wiki Logic (Оставляем как есть, но добавляем проверки) ---
async function loadCars() {
    const list = document.getElementById('car-list');
    if (!list) return;
    
    try {
        const res = await fetch(`${API_URL}/cars`);
        const cars = await res.json();
        
                list.innerHTML = cars.map(car => {
            const isRented = car.status === 'Rented';
            const currentUserRole = localStorage.getItem('role');
            
            let actionBtn = '';

            if (isRented) {
                // Случай 1: Машина занята
                actionBtn = `<div style="text-align:center; padding: 12px; color: #666; font-size: 0.8rem; letter-spacing: 1px; border: 1px dashed #333;">CURRENTLY UNAVAILABLE</div>`;
            } else if (!token) {
                // Случай 2: Машина свободна, но юзер не вошел
                actionBtn = `<button onclick="showSection('auth')" style="width:100%; padding:12px; background:transparent; border:1px solid #444; color:#888; cursor:pointer; font-size:0.8rem; letter-spacing:1px; transition:all 0.3s;">SIGN IN TO RESERVE</button>`;
            } else {
                // Случай 3: Машина свободна, юзер вошел
                actionBtn = `<button onclick="rentCar('${car._id}')" class="btn-rent">RESERVE NOW</button>`;
            }

            // Кнопка удаления (только админ)
            const deleteBtn = (currentUserRole === 'admin') 
                ? `<button onclick="deleteCar('${car._id}')" class="btn-delete">Remove Vehicle</button>`
                : '';

            return `
            <div class="car-card">
                <div style="position: relative;">
                     <img src="${car.imageUrl || 'https://via.placeholder.com/300'}" alt="${car.model}">
                     ${isRented ? '<div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; color:#999; font-weight:300; letter-spacing:3px; font-size:0.9rem;">RESERVED</div>' : ''}
                </div>
                <div class="car-info">
                    <h3>${car.model} <span style="font-weight:300; color:#666;">| ${car.year}</span></h3>
                    <p>${car.type}</p>
                    <div class="price">$${car.pricePerDay} <span style="font-size:0.8rem; color:#666;">/ DAY</span></div>
                    
                    <div style="margin-top:auto;">
                        ${actionBtn}
                        ${deleteBtn}
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) { console.error("Error loading cars:", err); }
}

// Добавляем функцию аренды сюда же в app.js (можно в конец файла)
window.rentCar = async function(id) {
    if (!confirm('Confirm rental for this Porsche?')) return;
    
    try {
        const res = await fetch(`${API_URL}/cars/rent/${id}`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert('Congratulations! You have rented the Porsche.');
            loadCars(); // Обновляем список, чтобы кнопка пропала
        } else {
            alert(data.msg);
        }
    } catch (err) {
        alert('Error processing rental');
    }
};


// Добавляем обработчик для добавления машины
const carForm = document.getElementById('car-form');
if (carForm) {
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) return alert('Please login first');

        const carData = {
            model: document.getElementById('car-model').value,
            year: document.getElementById('car-year').value,
            type: document.getElementById('car-type').value,
            pricePerDay: document.getElementById('car-price').value,
            imageUrl: document.getElementById('car-image').value
        };

        try {
            const res = await fetch(`${API_URL}/cars`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(carData)
            });
            
            if (res.ok) {
                carForm.reset();
                loadCars();
            } else {
                alert('Failed to add car');
            }
        } catch (err) { alert('Error adding car'); }
    });
}

window.deleteCar = async function(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/cars/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (res.ok) loadCars();
        else alert('Error deleting car (maybe not owner?)');
    } catch (err) { alert('Error deleting'); }
};

window.searchWiki = async function() {
    const model = document.getElementById('wiki-search').value;
    const resultsContainer = document.getElementById('wiki-results');
    
    if (!model) return;

    resultsContainer.innerHTML = '<div style="color:#888; text-align:center; padding:40px; font-size:1.1rem;">ACCESSING PORSCHE DATABASE...</div>';

    try {
        const res = await fetch(`${API_URL}/cars/specs/${model}`);
        const data = await res.json();
        
        if (!data || data.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; color:#666;">No engineering data found for this model identifier.</p>';
            return;
        }

        const topResults = data.slice(0, 2);

        // Чертежи (Blueprints)
        const blueprints = [
            'https://w0.peakpx.com/wallpaper/387/527/HD-wallpaper-porsche-911-drawing-sketch-art.jpg',
            'https://i.pinimg.com/originals/1c/19/2f/1c192f1680d96d2994f318350505167b.jpg'
        ];

        resultsContainer.innerHTML = `<div class="specs-grid">
            ${topResults.map((car, index) => {
                const imgUrl = blueprints[index % blueprints.length];
                
                // Проверяем данные, чтобы не писать "undefined" или "subscriber only"
                const engine = car.cylinders ? `${car.cylinders} Cylinders` : 'Electric / Hybrid';
                const drive = car.drive ? car.drive.toUpperCase() : 'AWD';
                const trans = car.transmission || 'PDK Automatic';
                
                return `
                <div class="spec-card" style="display: grid; grid-template-columns: 1fr; gap: 0; padding: 0;">
                    
                    <!-- Картинка -->
                    <div style="background-image: url('${imgUrl}'); height: 200px; background-size: cover; background-position: center; filter: grayscale(100%) contrast(1.1) brightness(0.7);">
                        <div style="width:100%; height:100%; background: linear-gradient(to top, #111, transparent);"></div>
                    </div>
                    
                    <!-- Данные -->
                    <div style="padding: 25px;">
                        <div class="spec-header" style="margin-bottom: 20px; border-left: 2px solid #d5001c; padding-left: 15px;">
                            <h3 style="color: #fff; margin: 0; font-family: 'Exo 2'; font-size: 1.6rem;">${car.make} ${car.model}</h3>
                            <span style="color: #666; font-size: 0.9rem; letter-spacing: 1px;">PRODUCTION YEAR: ${car.year}</span>
                        </div>
                        
                        <table class="spec-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem; color: #ccc;">
                            <tr><td style="color:#888;">CLASS</td><td style="text-align: right; font-weight:600;">${car.class.toUpperCase()}</td></tr>
                            <tr><td style="color:#888;">ENGINE</td><td style="text-align: right; font-weight:600;">${engine}</td></tr>
                            <tr><td style="color:#888;">DRIVETRAIN</td><td style="text-align: right; font-weight:600;">${drive}</td></tr>
                            <tr><td style="color:#888;">TRANSMISSION</td><td style="text-align: right; font-weight:600;">${trans}</td></tr>
                            <!-- Убрали Economy (MPG) полностью, так как API сломан -->
                        </table>
                    </div>
                </div>
                `;
            }).join('')}
        </div>`;

    } catch (err) {
        console.error(err);
        resultsContainer.innerHTML = '<p style="color:#c30000; text-align:center;">CONNECTION ERROR: EXTERNAL API UNREACHABLE.</p>';
    }
};



window.updateProfile = async function() {
    const newName = document.getElementById('new-username').value;
    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ username: newName })
        });
        if (res.ok) {
            alert('Profile updated!');
            showSection('profile'); // Перезагрузить данные
        }
    } catch(err) { alert('Error updating'); }
};

async function loadMyRentals() {
    const container = document.getElementById('my-rentals-list');
    try {
        const res = await fetch(`${API_URL}/cars/my/rentals`, {
            headers: { 'x-auth-token': token }
        });
        const cars = await res.json();
        
        if (cars.length === 0) {
            container.innerHTML = '<p style="color:#666; grid-column: 1/-1;">No active rentals.</p>';
            return;
        }

        container.innerHTML = cars.map(car => `
            <div style="background: #222; padding: 15px; border: 1px solid #333; display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${car.imageUrl}" style="width: 80px; height: 50px; object-fit: cover; opacity: 0.8;">
                    <div>
                        <h4 style="margin: 0; color: white; font-weight: 500;">${car.model}</h4>
                        <span style="color: #666; font-size: 0.8rem;">$${car.pricePerDay} / day</span>
                    </div>
                </div>
                <button onclick="returnCar('${car._id}')" style="background: transparent; border: 1px solid #555; color: #fff; padding: 5px 15px; cursor: pointer; font-size: 0.8rem; text-transform: uppercase;">
                    Return
                </button>
            </div>
        `).join('');
        
    } catch (err) {
        container.innerHTML = '<p>Error loading rentals.</p>';
    }
}

// Новая функция для возврата
window.returnCar = async function(id) {
    if(!confirm("Return this vehicle?")) return;

    try {
        const res = await fetch(`${API_URL}/cars/return/${id}`, {
            method: 'PUT',
            headers: { 'x-auth-token': token }
        });

        if (res.ok) {
            loadMyRentals(); // Обновляем список в профиле
            // Если мы сейчас в showroom, там тоже надо обновить (но это при следующем заходе)
        } else {
            alert("Error returning car");
        }
    } catch (err) { console.error(err); }
};


// Обнови функцию showSection, добавив туда блок для 'profile':

