// Función para posicionar el switch en la esquina superior derecha
function positionThemeSwitch() {
    const themeWrapper = document.getElementById('themeSwitchWrapper');
    if (!themeWrapper) return;
    
    // Aplicar estilos para posicionar en la esquina superior derecha - solo el icono
    Object.assign(themeWrapper.style, {
        position: 'fixed',
        top: '75px',
        right: '15px',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        padding: '0',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease'
    });
    
    // Ajustar estilos para el botón de toggle
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        Object.assign(themeToggle.style, {
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none'
        });
    }
    
    // Mejorar el aspecto visual en hover
    themeWrapper.addEventListener('mouseenter', () => {
        themeWrapper.style.backgroundColor = 'rgba(229, 9, 20, 0.8)';
        themeWrapper.style.boxShadow = '0 4px 15px rgba(229, 9, 20, 0.4)';
        themeWrapper.style.transform = 'scale(1.1)';
    });
    
    themeWrapper.addEventListener('mouseleave', () => {
        themeWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        themeWrapper.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        themeWrapper.style.transform = 'scale(1)';
    });
    
    // Añadir animación sutil cuando se cambia de tema
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            themeToggle.style.transform = 'scale(1.2)';
            setTimeout(() => {
                themeToggle.style.transform = 'scale(1)';
            }, 200);
        });
    }
}/**
 * darkMode.js - Maneja el cambio entre modo claro y oscuro estilo Netflix
 */

// Función para inicializar el tema al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay una preferencia guardada
    const darkMode = localStorage.getItem('darkMode');
    
    // Si hay una preferencia, aplicarla, si no por defecto activamos el modo oscuro
    if (darkMode === null || darkMode === 'enabled') {
        enableDarkMode();
    }
    
    // Crear e insertar el toggle switch si aún no existe
    if (!document.querySelector('.theme-switch-wrapper')) {
        createThemeSwitch();
    }
    
    // Aplicar estilos de posicionamiento
    positionThemeSwitch();
});

// Función para crear e insertar el selector de tema (solo icono)
function createThemeSwitch() {
    // Crear los elementos del switch
    const themeWrapper = document.createElement('div');
    themeWrapper.className = 'theme-switch-wrapper';
    themeWrapper.id = 'themeSwitchWrapper';
    
    // Crear botón para el toggle con íconos de sol/luna
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle-btn';
    themeToggle.id = 'themeToggleBtn';
    themeToggle.setAttribute('aria-label', 'Cambiar modo oscuro/claro');
    themeToggle.setAttribute('title', document.body.classList.contains('dark-mode') ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    
    // Definir los íconos de sol y luna usando Bootstrap Icons
    // Mostramos el icono opuesto al modo actual (sol en modo oscuro, luna en modo claro)
    const sunIcon = '<i class="bi bi-sun-fill"></i>';
    const moonIcon = '<i class="bi bi-moon-fill"></i>';
    
    // Establecer el ícono inicial según el modo - invertido para mostrar lo que pasará al hacer clic
    themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? sunIcon : moonIcon;
    
    // Ensamblar el switch
    themeWrapper.appendChild(themeToggle);
    
    // Añadir evento de cambio
    themeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
            themeToggle.innerHTML = moonIcon;
            themeToggle.setAttribute('title', 'Cambiar a modo oscuro');
        } else {
            enableDarkMode();
            themeToggle.innerHTML = sunIcon;
            themeToggle.setAttribute('title', 'Cambiar a modo claro');
        }
    });
    
    // Añadir al body para poder posicionarlo con CSS fixed
    document.body.appendChild(themeWrapper);
}

// Función para activar el modo oscuro
function enableDarkMode() {
    // Añadir la clase al elemento root para las variables CSS
    document.documentElement.classList.add('dark-mode');
    // Añadir la clase al body para los estilos generales
    document.body.classList.add('dark-mode');
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', 'enabled');
    
    // Actualizar el estado del toggle si existe
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        // Asegurarse de mostrar el icono del sol en modo oscuro
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        themeToggle.setAttribute('title', 'Cambiar a modo claro');
    }
}

// Función para desactivar el modo oscuro
function disableDarkMode() {
    // Remover la clase del elemento root
    document.documentElement.classList.remove('dark-mode');
    // Remover la clase del body
    document.body.classList.remove('dark-mode');
    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', 'disabled');
    
    // Actualizar el estado del toggle si existe
    const themeToggle = document.getElementById('themeToggleBtn');
    if (themeToggle) {
        // Asegurarse de mostrar el icono de la luna en modo claro
        themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
        themeToggle.setAttribute('title', 'Cambiar a modo oscuro');
    }
}

// Función para restablecer estilos en modo claro
function resetLightModeStyles() {
    // Restablecer el campo de búsqueda a su estilo original
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.color = '';
        searchInput.style.backgroundColor = '';
    }
}

// Función para aplicar estilos específicos en modo oscuro
function applyDarkModeStyles() {
    // Aplicar estilos al campo de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.style.color = 'white';
        searchInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
}

// Exponer funciones globalmente para poder ser usadas desde la consola o por otros scripts
window.toggleDarkMode = function() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
};

