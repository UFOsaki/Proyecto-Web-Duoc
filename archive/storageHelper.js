const USERS_STORAGE_KEY = 'usersData';

export function loadUsersDataFromLocalStorage() {
  const usersData = localStorage.getItem(USERS_STORAGE_KEY);
  return usersData ? JSON.parse(usersData) : [];
}

export function saveUsersDataToLocalStorage(usersData) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersData));
}