"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Diccionario de traducción
const translationDictionary = {
    "name": "nombre",
    "height": "altura",
    "mass": "masa",
    "hair_color": "color_de_cabello",
    "skin_color": "color_de_piel",
    "eye_color": "color_de_ojos",
    "birth_year": "año_de_nacimiento",
    "gender": "género",
    "homeworld": "mundo_natal",
    "films": "películas",
    "species": "especies",
    "vehicles": "vehículos",
    "starships": "naves_estelares",
    "created": "creado",
    "edited": "editado",
    "url": "url",
    "age": "edad",
    "profession": "profesion"
};
// Función para traducir usando un diccionario
const translateWithDictionary = (data) => {
    const translatedData = {};
    console.log(data);
    for (const [key, value] of Object.entries(data)) {
        console.log("INICIO - TRAD", translationDictionary[key]);
        const translatedKey = translationDictionary[key] || key; // Traduce la clave o deja la original
        translatedData[translatedKey] = value; // Mantenemos el valor original o lo traducimos si es necesario
        console.log("FIN - TRAD", translatedKey);
    }
    return translatedData;
};
exports.default = translateWithDictionary;
// Ejemplo de uso
// const data = {
//   name: 'John',
//   age: '30',
//   profession: 'Engineer'
// };
// const translatedData = translateWithDictionary(data);
// console.log(translatedData);
