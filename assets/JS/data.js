export const data = {
    countries: [
        {
            name: "Chile",
            code: "CL",
            regions: [
                {
                    name: "Región Metropolitana",
                    code: "RM",
                    cities: [
                        {
                            name: "Santiago",
                            code: "SCL",
                            communes: ["Providencia", "Las Condes", "Vitacura"]
                        }
                        // Añadir más ciudades según sea necesario
                    ]
                }
                // Añadir más regiones según sea necesario
            ]
        }
        // Añadir más países según sea necesario
    ]
};

export const regionCodes = [
    { code: "+56", name: "+56" },
    // Añadir más códigos de región según sea necesario
];
