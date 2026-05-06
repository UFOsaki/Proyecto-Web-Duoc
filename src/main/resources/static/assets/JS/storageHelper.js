// Guardar datos en localStorage
export const saveUsersDataToLocalStorage = (usersData) => {
    localStorage.setItem('usersData', JSON.stringify(usersData));
};

// Cargar datos desde localStorage
export const loadUsersDataFromLocalStorage = () => {
    const storedUsersData = localStorage.getItem('usersData');
    return storedUsersData ? JSON.parse(storedUsersData) : [];
};

// Borrar todos los datos de localStorage
export const clearLocalStorage = () => {
    localStorage.clear();
};

// Borrar un ítem específico de localStorage
export const removeUsersDataFromLocalStorage = () => {
    localStorage.removeItem('usersData');
};
