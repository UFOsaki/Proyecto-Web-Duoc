import { data, regionCodes } from './data.js';

const populateSelect = (id, options, includeBlank = true) => {
    const select = document.getElementById(id);
    select.innerHTML = "";
    if (includeBlank) {
        const blankOption = document.createElement("option");
        blankOption.value = "";
        blankOption.textContent = "Seleccionar";
        select.appendChild(blankOption);
    }
    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option.name;
        opt.textContent = option.name;
        select.appendChild(opt);
    });
};

const handleCountryChange = () => {
    const countryName = document.getElementById("country").value;
    const country = data.countries.find(c => c.name === countryName);
    if (country) {
        populateSelect("region", country.regions);
        document.getElementById("region").disabled = false;
    } else {
        populateSelect("region", []);
        document.getElementById("region").disabled = true;
    }
    populateSelect("city", []);
    document.getElementById("city").disabled = true;
    populateSelect("commune", []);
    document.getElementById("commune").disabled = true;
};

const handleRegionChange = () => {
    const countryName = document.getElementById("country").value;
    const regionName = document.getElementById("region").value;
    const country = data.countries.find(c => c.name === countryName);
    const region = country ? country.regions.find(r => r.name === regionName) : null;
    if (region) {
        populateSelect("city", region.cities);
        document.getElementById("city").disabled = false;
    } else {
        populateSelect("city", []);
        document.getElementById("city").disabled = true;
    }
    populateSelect("commune", []);
    document.getElementById("commune").disabled = true;
};

const handleCityChange = () => {
    const countryName = document.getElementById("country").value;
    const regionName = document.getElementById("region").value;
    const cityName = document.getElementById("city").value;
    const country = data.countries.find(c => c.name === countryName);
    const region = country ? country.regions.find(r => r.name === regionName) : null;
    const city = region ? region.cities.find(c => c.name === cityName) : null;
    if (city) {
        populateSelect("commune", city.communes.map(c => ({ name: c })));
        document.getElementById("commune").disabled = false;
    } else {
        populateSelect("commune", []);
        document.getElementById("commune").disabled = true;
    }
};

const populateDataLists = () => {
    populateSelect("region-code", regionCodes, false);
    populateSelect("country", data.countries);
    document.getElementById("region").disabled = true;
    document.getElementById("city").disabled = true;
    document.getElementById("commune").disabled = true;
    document.getElementById("country").addEventListener("change", handleCountryChange);
    document.getElementById("region").addEventListener("change", handleRegionChange);
    document.getElementById("city").addEventListener("change", handleCityChange);
};

populateDataLists();
