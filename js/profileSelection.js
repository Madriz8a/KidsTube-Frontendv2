const API_URL = 'http://localhost:3000/api';
const GRAPHQL_URL = 'http://localhost:4000/graphql';

document.addEventListener("DOMContentLoaded", function () {
  const profilesContainer = document.getElementById("profilesContainer");
  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const adminNavBtn = document.getElementById("adminNavBtn");
  const searchProfileInput = document.getElementById("searchProfileInput");
  const searchProfileBtn = document.getElementById("searchProfileBtn");

  const pinModal = document.getElementById("pinModal");
  const profileNameInModal = document.getElementById("profileNameInModal");
  const pinCircles = document.querySelectorAll(".pin-circle");
  const pinButtons = document.querySelectorAll(".pin-button");
  const pinError = document.getElementById("pinError");

  // Variables para el manejo del PIN
  let selectedProfile = null;
  let enteredPin = "";
  let maxPinLength = 6;
  let pinPurpose = "";
  let pinAttempts = 0;
  const maxPinAttempts = 3;

  // Inicialización
  init();

  /**
   * Inicializa la página
   */
  function init() {
    // Borrar cualquier verificación de administrador existente
    sessionStorage.removeItem("adminPinVerified");
    sessionStorage.removeItem("adminPinVerifiedTime");
    
    // Borrar cualquier perfil activo previamente
    localStorage.removeItem("currentProfile");

    // Verificar si hay sesión de administrador
    const token = localStorage.getItem("token");
    if (!token) {
      // Mostrar mensaje de error en lugar de redireccionar inmediatamente
      profilesContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            Sesión expirada o no iniciada
            <div class="mt-3">
              <a href="../shared/login.html" class="btn btn-primary">
                <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión
              </a>
            </div>
          </div>
        </div>
      `;

      // Ocultar botones de navegación
      if (switchAccountBtn) switchAccountBtn.style.display = "none";
      if (adminNavBtn) adminNavBtn.style.display = "none";

      return;
    }

    // Cargar perfiles usando GraphQL
    loadProfiles();

    // Configurar event listeners
    setupEventListeners();

    // Verificar si se necesita verificación de PIN de administrador
    checkAdminVerification();
  }

  /**
   * Verifica si se requiere verificación de PIN de administrador
   * basado en parámetros de URL
   */
  function checkAdminVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyAdmin = urlParams.get("verifyAdmin");

    if (verifyAdmin === "true") {
      // Mostrar modal de PIN de administrador
      showAdminPinModal("admin_redirect");
    }
  }

  /**
   * Configura los event listeners
   */
  function setupEventListeners() {
    // Evento para el botón de cambiar cuenta
    switchAccountBtn.addEventListener("click", function () {
      // Mostrar confirmación antes de cerrar sesión
      if (
        confirm(
          "¿Estás seguro de que quieres cambiar de cuenta? Se cerrará tu sesión actual."
        )
      ) {
        sessionStorage.removeItem("adminPinVerified");
        sessionStorage.removeItem("adminPinVerifiedTime");
        handleLogout();
      }
    });

    // Evento para el botón de administrador en la navbar
    if (adminNavBtn) {
      adminNavBtn.addEventListener("click", function () {
        showAdminPinModal("admin");
      });
    }

    // Evento para la búsqueda de perfiles
    if (searchProfileBtn) {
      searchProfileBtn.addEventListener("click", handleProfileSearch);
    }

    if (searchProfileInput) {
      searchProfileInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleProfileSearch();
        }
      });
    }

    // Eventos para el teclado numérico del PIN
    pinButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Verificar si es un dígito o una acción
        const digit = this.getAttribute("data-digit");
        const action = this.getAttribute("data-action");

        if (digit) {
          handlePinDigit(digit);
        } else if (action === "clear") {
          handlePinClear();
        } else if (action === "submit") {
          handlePinSubmit();
        }
      });
    });

    // Añadir evento para cerrar el modal y reiniciar el PIN
    pinModal.addEventListener("hidden.bs.modal", function () {
      resetPin();
      pinAttempts = 0; // Reiniciar contador de intentos
    });

    // Añadir soporte para teclado físico en el modal PIN
    document.addEventListener("keydown", function (e) {
      // Solo procesar eventos de teclado cuando el modal está visible
      if (!pinModal.classList.contains("show")) return;

      if (/^[0-9]$/.test(e.key)) {
        // Si es un dígito (0-9)
        handlePinDigit(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        // Si es borrar
        handlePinClear();
      } else if (e.key === "Enter") {
        // Si es Enter
        handlePinSubmit();
      }
    });
  }

  /**
   * Carga los perfiles disponibles usando GraphQL
   */
  async function loadProfiles() {
    try {
      const token = localStorage.getItem("token");

      // Mostrar indicador de carga
      profilesContainer.innerHTML = `
        <div class="col-12 text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando perfiles...</span>
          </div>
          <p class="mt-3">Cargando perfiles...</p>
        </div>
      `;

      // Usar GraphQL para obtener perfiles
      const graphqlQuery = `
        query GetUserProfiles {
          profiles {
            _id
            full_name
            avatar
            AdminId
          }
        }
      `;
      
      // Realizar la consulta GraphQL
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: graphqlQuery
        })
      });

      const result = await response.json();
      
      // Verificar errores en la respuesta GraphQL
      if (result.errors) {
        throw new Error(result.errors[0].message || 'Error en la consulta GraphQL');
      }
      
      // Obtener los perfiles de la respuesta
      const profiles = result.data.profiles;

      // Renderizar perfiles
      renderProfiles(profiles);
    } catch (error) {
      // Mostrar mensaje de error
      profilesContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            Error al cargar perfiles
            <div class="mt-3">
              <button class="btn btn-outline-danger" onclick="window.location.reload()">
                <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Maneja la búsqueda de perfiles
   */
  async function handleProfileSearch() {
    const searchTerm = searchProfileInput.value.trim();

    if (!searchTerm) {
      // Si no hay término de búsqueda, cargar todos los perfiles
      return loadProfiles();
    }

    try {
      const token = localStorage.getItem("token");

      // Mostrar indicador de carga
      profilesContainer.innerHTML = `
        <div class="col-12 text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Buscando...</span>
          </div>
          <p class="mt-3">Buscando "${searchTerm}"...</p>
        </div>
      `;

      // Como no hay una query específica para buscar perfiles en el esquema GraphQL actual,
      // obtenemos todos los perfiles y filtramos en el cliente
      const graphqlQuery = `
        query GetUserProfiles {
          profiles {
            _id
            full_name
            avatar
            AdminId
          }
        }
      `;
      
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: graphqlQuery
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message || 'Error en la búsqueda GraphQL');
      }
      
      // Filtrar perfiles por nombre
      const profiles = result.data.profiles;
      const filteredProfiles = profiles.filter(profile => 
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Renderizar resultados
      if (filteredProfiles.length === 0) {
        profilesContainer.innerHTML = `
          <div class="col-12">
            <div class="alert alert-info text-center">
              <i class="bi bi-search me-2"></i>
              No se encontraron perfiles con el nombre "${searchTerm}"
              <div class="mt-3">
                <button class="btn btn-outline-primary" onclick="loadProfiles()">
                  <i class="bi bi-arrow-left me-2"></i>Ver todos los perfiles
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        renderProfiles(filteredProfiles);
      }
    } catch (error) {
      profilesContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            Error al buscar perfiles
            <div class="mt-3">
              <button class="btn btn-outline-danger" onclick="window.location.reload()">
                <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Renderiza los perfiles en la interfaz
   * @param {Array} profiles - Lista de perfiles
   */
  function renderProfiles(profiles) {
    profilesContainer.innerHTML = "";

    // Si no hay perfiles, mostrar un mensaje y un botón para crear
    if (profiles.length === 0) {
      profilesContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info text-center">
            <i class="bi bi-people me-2"></i>
            No hay perfiles infantiles
            <div class="mt-3">
              <button id="createFirstProfileBtn" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Crear primer perfil
              </button>
            </div>
          </div>
        </div>
      `;

      // Agregar evento al botón de crear primer perfil para verificar PIN
      const createFirstProfileBtn = document.getElementById(
        "createFirstProfileBtn"
      );
      if (createFirstProfileBtn) {
        createFirstProfileBtn.addEventListener("click", function () {
          showAdminPinModal("admin_create_profile");
        });
      }

      return;
    }

    // Añadir cada perfil
    profiles.forEach((profile) => {
      const profileCol = document.createElement("div");
      profileCol.className = "col-6 col-sm-4 col-md-3";

      // Determinar qué avatar mostrar
      const avatarUrl = Array.isArray(profile.avatar) && profile.avatar.length > 0 
        ? profile.avatar[0] 
        : 'https://loodibee.com/wp-content/uploads/Netflix-avatar-2.png';

      profileCol.innerHTML = `
        <div class="profile-card" data-profile-id="${profile._id}" data-profile-name="${profile.full_name}" data-profile-avatar="${avatarUrl}">
          <img src="${avatarUrl}" alt="${profile.full_name}" class="profile-avatar">
          <h5 class="profile-name">${profile.full_name}</h5>
        </div>
      `;

      // Añadir evento click para seleccionar el perfil
      const profileCard = profileCol.querySelector(".profile-card");
      profileCard.addEventListener("click", function () {
        const profileId = this.getAttribute("data-profile-id");
        const profileName = this.getAttribute("data-profile-name");
        const profileAvatar = this.getAttribute("data-profile-avatar");

        // Guardar referencia al perfil seleccionado
        selectedProfile = {
          _id: profileId,
          full_name: profileName,
          avatar: profileAvatar,
        };

        // Mostrar el nombre del perfil en el modal
        profileNameInModal.textContent = profileName;

        // Establecer el propósito del PIN
        pinPurpose = "profile";

        // Abrir modal para pedir PIN
        const modal = new bootstrap.Modal(pinModal);
        modal.show();
      });

      profilesContainer.appendChild(profileCol);
    });
  }

  /**
   * Muestra el modal para ingresar el PIN del administrador
   * @param {string} purpose - Propósito del PIN: 'admin', 'admin_redirect', 'admin_create_profile'
   */
  function showAdminPinModal(purpose) {
    // Guardar el propósito
    pinPurpose = purpose;

    // Modificar el título del modal según el propósito
    profileNameInModal.textContent = "Administrador";

    // Mostrar el modal
    const modal = new bootstrap.Modal(pinModal);
    modal.show();
  }

  /**
   * Maneja la entrada de un dígito del PIN
   * @param {string} digit - Dígito ingresado
   */
  function handlePinDigit(digit) {
    // Verificar que no se exceda la longitud máxima
    if (enteredPin.length < maxPinLength) {
      // Añadir dígito al PIN
      enteredPin += digit;

      // Actualizar círculos de PIN
      updatePinCircles();

      // Si se completa el PIN, verificar automáticamente
      if (enteredPin.length === maxPinLength) {
        // Esperar un momento para que se vea el último círculo lleno
        setTimeout(handlePinSubmit, 500);
      }
    }
  }

  /**
   * Actualiza la visualización de los círculos del PIN
   */
  function updatePinCircles() {
    // Actualizar cada círculo según la longitud del PIN actual
    pinCircles.forEach((circle, index) => {
      if (index < enteredPin.length) {
        circle.classList.add("filled");
      } else {
        circle.classList.remove("filled");
      }
    });

    // Ocultar mensaje de error si estaba visible
    pinError.style.display = "none";
  }

  /**
   * Maneja la acción de borrar el PIN
   */
  function handlePinClear() {
    // Si hay al menos un dígito, borrar el último
    if (enteredPin.length > 0) {
      enteredPin = enteredPin.substring(0, enteredPin.length - 1);
      updatePinCircles();
    }
  }

  /**
   * Maneja la acción de enviar/verificar el PIN
   */
  async function handlePinSubmit() {
    // Verificar que haya un PIN ingresado
    if (enteredPin.length === 0) {
      return;
    }

    // Verificar si se excedió el límite de intentos
    if (pinAttempts >= maxPinAttempts) {
      showPinError(
        "Demasiados intentos fallidos. Por favor, intenta más tarde."
      );

      // Cerrar el modal después de un breve retraso
      setTimeout(() => {
        const modalInstance = bootstrap.Modal.getInstance(pinModal);
        modalInstance.hide();
      }, 2000);

      return;
    }

    // Lógica según el propósito del PIN
    if (pinPurpose === "profile") {
      // Verificar PIN de perfil infantil
      await verifyProfilePin();
    } else if (pinPurpose.startsWith("admin")) {
      // Verificar PIN de administrador
      verifyAdminPin();
    }
  }

  /**
   * Verifica el PIN de un perfil infantil
   */
  async function verifyProfilePin() {
    // Verificar que haya un perfil seleccionado
    if (!selectedProfile) {
      return;
    }

    // Deshabilitar botones durante la verificación
    togglePinpadButtons(true);

    // Mostrar indicador de carga
    profileNameInModal.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="me-2">${selectedProfile.full_name}</span>
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Verificando...</span>
        </div>
      </div>
    `;

    // Verificar el PIN
    try {
      const token = localStorage.getItem("token");

      // NOTA: Como no hay una mutación específica para verificar PIN en el esquema GraphQL actual,
      // seguiremos usando la API REST existente para esta funcionalidad específica
      const response = await fetch(
        `${API_URL}/public/verify-pin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileId: selectedProfile._id,
            pin: enteredPin,
          }),
        }
      );

      // Habilitar botones después de la verificación
      togglePinpadButtons(false);

      // Restaurar nombre del perfil
      profileNameInModal.textContent = selectedProfile.full_name;

      if (response.ok) {
        // PIN correcto, guardar información del perfil
        const verifiedProfile = await response.json();

        // Almacenar datos del perfil seleccionado en localStorage
        const profileData = {
          _id: selectedProfile._id, 
          full_name: selectedProfile.full_name,
          avatar: selectedProfile.avatar,
          pin: enteredPin, // Guardamos el PIN para solicitudes futuras
        };

        localStorage.setItem("currentProfile", JSON.stringify(profileData));

        // Cerrar el modal
        const modalInstance = bootstrap.Modal.getInstance(pinModal);
        modalInstance.hide();

        // Redireccionar al dashboard infantil
        window.location.href = "kidsDashboard.html";
      } else {
        // Incrementar contador de intentos
        pinAttempts++;

        // PIN incorrecto, mostrar error
        showPinError();
      }
    } catch (error) {
      // Habilitar botones después de la verificación
      togglePinpadButtons(false);

      // Restaurar nombre del perfil
      profileNameInModal.textContent = selectedProfile.full_name;

      // Incrementar contador de intentos
      pinAttempts++;

      // Mostrar error
      showPinError("Error al verificar el PIN. Intenta de nuevo.");
    }
  }

  /**
   * Verifica el PIN del administrador
   * Este método verifica el PIN contra el valor almacenado en localStorage
   */
  function verifyAdminPin() {
    // Obtener el PIN del administrador almacenado durante el login
    const adminPin = localStorage.getItem("adminPin");

    if (!adminPin) {
      showPinError("No se encontraron datos del administrador");
      return;
    }

    // Comparar el PIN ingresado con el PIN del administrador
    if (enteredPin === adminPin) {
      // PIN correcto
      const modalInstance = bootstrap.Modal.getInstance(pinModal);
      modalInstance.hide();

      // Registrar la verificación del PIN de administrador
      if (window.markAdminPinVerified) {
        window.markAdminPinVerified();
      } else {
        // Fallback si la función no está disponible
        sessionStorage.setItem("adminPinVerified", "true");
        sessionStorage.setItem("adminPinVerifiedTime", Date.now().toString());
      }

      // Redireccionar según el propósito
      if (pinPurpose === "admin") {
        // Redireccionar al panel de administración
        window.location.href = "../admin/dashboard.html";
      } else if (pinPurpose === "admin_redirect") {
        // Redireccionar a la URL guardada
        const redirectUrl = sessionStorage.getItem("adminRedirectAfterPin");
        if (redirectUrl) {
          sessionStorage.removeItem("adminRedirectAfterPin");
          window.location.href = redirectUrl;
        } else {
          // Si no hay URL, ir al dashboard por defecto
          window.location.href = "../admin/dashboard.html";
        }
      } else if (pinPurpose === "admin_create_profile") {
        // Redireccionar a la creación de perfil
        window.location.href = "../admin/createProfile.html";
      }
    } else {
      // Incrementar contador de intentos
      pinAttempts++;

      // PIN incorrecto
      showPinError();
    }
  }

  /**
   * Alterna la habilitación de los botones del teclado numérico
   * @param {boolean} disabled - True para deshabilitar, false para habilitar
   */
  function togglePinpadButtons(disabled) {
    pinButtons.forEach((button) => {
      button.disabled = disabled;
      if (disabled) {
        button.classList.add("disabled");
      } else {
        button.classList.remove("disabled");
      }
    });
  }

  /**
   * Muestra un mensaje de error para el PIN
   * @param {string} message - Mensaje de error opcional
   */
  function showPinError(message = "PIN incorrecto. Inténtalo de nuevo.") {
    // Resetear el PIN ingresado
    enteredPin = "";
    updatePinCircles();

    // Construir mensaje dependiendo del número de intentos
    let errorMessage = message;
    if (pinAttempts > 0 && pinAttempts < maxPinAttempts) {
      let intentosRestantes = maxPinAttempts - pinAttempts;
      errorMessage += ` (${intentosRestantes} ${
        intentosRestantes === 1 ? "intento restante" : "intentos restantes"
      })`;
    }

    // Actualizar mensaje de error
    pinError.textContent = errorMessage;

    // Mostrar mensaje de error
    pinError.style.display = "inline-block";

    // Animación de shake para el error
    pinError.classList.remove("shake-animation");
    void pinError.offsetWidth; // Truco para reiniciar la animación
    pinError.classList.add("shake-animation");
  }

  /**
   * Resetea el estado del PIN
   */
  function resetPin() {
    enteredPin = "";
    updatePinCircles();
    pinError.style.display = "none";
    pinPurpose = "";
  }

  /**
   * Maneja el cierre de sesión
   */
  async function handleLogout() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "../shared/login.html";
        return;
      }

      // Mostrar indicador de carga
      switchAccountBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cerrando sesión...
      `;
      switchAccountBtn.disabled = true;

      const response = await fetch(`${API_URL}/session`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Limpiar localStorage independientemente de la respuesta
      localStorage.removeItem("token");
      localStorage.removeItem("adminId");
      localStorage.removeItem("userName");
      localStorage.removeItem("currentProfile");
      localStorage.removeItem("adminPin");

      // Limpiar sessionStorage
      sessionStorage.removeItem("adminPinVerified");
      sessionStorage.removeItem("adminPinVerifiedTime");
      sessionStorage.removeItem("adminRedirectAfterPin");

      // Redirigir a la página de login
      window.location.href = "../shared/login.html";
    } catch (error) {
      // Incluso si hay error, limpiar localStorage y redireccionar
      localStorage.removeItem("token");
      localStorage.removeItem("adminId");
      localStorage.removeItem("userName");
      localStorage.removeItem("currentProfile");
      localStorage.removeItem("adminPin");

      // Limpiar sessionStorage
      sessionStorage.removeItem("adminPinVerified");
      sessionStorage.removeItem("adminPinVerifiedTime");
      sessionStorage.removeItem("adminRedirectAfterPin");

      window.location.href = "../shared/login.html";
    }
  }
});