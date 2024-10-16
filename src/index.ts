// src/index.ts

import express, { Request, Response } from 'express';
import axios from 'axios';
import AWS from 'aws-sdk';
// import { translateWithDictionary } from './translate'; // Adjust path if necessary

require('dotenv').config();

//
// import swaggerUi from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './swagger'; // Adjust path if necessary





// var AWS = require('aws-sdk');

const aws_access_key_id = process.env.aws_access_key_id;
const aws_secret_access_key = process.env.aws_secret_access_key;
const aws_region = process.env.aws_region;
const table_name = process.env.table_name || 'swapi_test';

var dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: aws_region, 
    accessKeyId: aws_access_key_id,
    secretAccessKey: aws_secret_access_key,
});




const translationDictionary: Record<string, string> = {

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
    "profession": "profesión",
    "people" : "personas",
    "planets" : "planetas",
    "title" : "título",
    "episode_id" : "episodio",
    "opening_crawl" : "mensaje_inicial",
    "director" : "director",
    "producer" : "productor",
    "release_date" : "fecha_estreno",
    "characters" : "personajes"
  }


  async function getDataByNombreUnico(nombre_unico: string | undefined) {
    // const table_name = process.env.TABLE_NAME || 'defaultTableName'; // Valor por defecto

    const params = {
        TableName: table_name,
        Key: {
            nombre_unico: nombre_unico as string, // Aseguramos que `nombre_unico` no sea undefined
        },
    };

    try {
        const data = await dynamoDB.get(params).promise(); // Obtiene el ítem
        if (!data.Item) {
            throw new Error('No se encontró el personaje con el nombre único: ' + nombre_unico);
        }
        return data.Item; // Devuelve el ítem encontrado
    } catch (err) {
        console.error("Error", err);
        throw new Error('Error al obtener los datos: ' + (err as Error).message); // Manejo de errores
    }
}


async function getPersonajesUnicos() {

  const params = {
      TableName: table_name,
  };

  try {
      const data = await dynamoDB.scan(params).promise(); // Realiza el scan de la tabla
      if (!data.Items || data.Items.length === 0) {
          throw new Error('No se encontraron elementos en la tabla.');
      }
      return data.Items; // Devuelve todos los elementos encontrados
  } catch (err) {
      if (err instanceof Error) {
          // Si err es una instancia de Error, accede a su propiedad message
          console.error("Error", err.message);
          throw new Error('Error al obtener los datos: ' + err.message);
      } else {
          // Si err no es una instancia de Error, lanza un mensaje genérico
          console.error("Error desconocido", err);
          throw new Error('Error desconocido al obtener los datos.');
      }
  }
}


  
  async function insertDataintoDatabase(
    nombre_unico: string,
    altura: number,
    color_de_cabello: string,
    color_de_piel: string,
    color_de_ojos: string,
    año_de_nacimiento: number,
    género: string,
    mundo_natal: string,
    color_sable_luz: string,
    nave_estelar: string
) {
    const currentTime = new Date().toISOString();

    const table_name = process.env.TABLE_NAME || 'defaultTableName'; // Valor por defecto


    // Primero verifica si el ítem ya existe
    const getParams = {
        TableName: table_name,
        Key: {
            nombre_unico, // Asumiendo que nombre_unico es la clave primaria
        },
    };

    try {
        const data = await dynamoDB.get(getParams).promise(); // Busca el ítem
        if (data.Item) {
            // Si el ítem ya existe
            throw new Error('El personaje ya existe con el nombre único: ' + nombre_unico);
        }

        // Si no existe, procede a insertar
        const params = {
            TableName: table_name,
            Item: {
                nombre_unico,
                altura,
                color_de_cabello,
                color_de_piel,
                color_de_ojos,
                año_de_nacimiento,
                género,
                mundo_natal,
                color_sable_luz,
                creado: currentTime,
                editado: currentTime,
                nave_estelar,
            },
        };

        await dynamoDB.put(params).promise(); // Inserta el nuevo ítem
        console.log("Success!");
        return 'Se insertó su personaje correctamente'; // Mensaje de éxito
    } catch (err) {
      if (err instanceof Error) {
          // Si err es una instancia de Error, accede a su propiedad message
          console.error("Error", err.message);
          throw new Error('Error al obtener los datos: ' + err.message);
      } else {
          // Si err no es una instancia de Error, lanza un mensaje genérico
          console.error("Error desconocido", err);
          throw new Error('Error desconocido al obtener los datos.');
      }
  }
}



  // Función para traducir usando un diccionario
  const translateWithDictionary = (data: Record<string, any>): Record<string, string> => {
    const translatedData: Record<string, string> = {};
  
    console.log(data)
  
    for (const [key, value] of Object.entries(data)) {
    //   console.log("INICIO - TRAD",translationDictionary[key])
      const translatedKey = translationDictionary[key] || key; // Traduce la clave o deja la original
      translatedData[translatedKey] = value; // Mantenemos el valor original o lo traducimos si es necesario
    //   console.log("FIN - TRAD",translatedKey)
    }
  
    return translatedData;
  };

////////////////////////apis
////////////////////////////////////////////////
const app = express();
const port = 3000;

// Middleware 
app.use(express.json());

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Route example

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express + TypeScript!');
});


app.post('/api/data', (req: Request, res: Response) => {
  const data = req.body;
  res.json({ received: data });
});

// Funcion - API ROOT - GET
const get_api_endpoints = async (): Promise<any> => {
    try {
      const response = await axios.get(`https://swapi.py4e.com/api/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Lanza el error para que se pueda manejar en el bloque catch
    }
  };



const get_persona_data = async (persona_id: number): Promise<any> => {
    try {
      const response = await axios.get(`https://swapi.py4e.com/api/people/${persona_id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Lanza el error para que se pueda manejar en el bloque catch
    }
  };
  

// Función - Api films - GET
const get_film_data = async (film_id: number): Promise<any> => {
    try {
      const response = await axios.get(`https://swapi.py4e.com/api/films/${film_id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Lanza el error para que se pueda manejar en el bloque catch
    }
  };




// API: Personaje único - POST
app.post('/insert', async (req: Request, res: Response) => {
    const {
        nombre_unico,
        altura,
        color_de_cabello,
        color_de_piel,
        color_de_ojos,
        año_de_nacimiento,
        género,
        mundo_natal,
        color_sable_luz,
        nave_estelar,
    } = req.body;

    try {
        const result = await insertDataintoDatabase(
            nombre_unico,
            altura,
            color_de_cabello,
            color_de_piel,
            color_de_ojos,
            año_de_nacimiento,
            género,
            mundo_natal,
            color_sable_luz,
            nave_estelar
        );
        res.status(200).json({ message: result }); // Mensaje de éxito
    } catch (err) {
      if (err instanceof Error) {
          // Si err es una instancia de Error, accede a su propiedad message
          console.error("Error", err.message);
          throw new Error('Error al obtener los datos: ' + err.message);
      } else {
          // Si err no es una instancia de Error, lanza un mensaje genérico
          console.error("Error desconocido", err);
          throw new Error('Error desconocido al obtener los datos.');
      }
  }
});


  // API: Root - GET
app.get('/raiz', async (req: Request, res: Response) => {

    const apiResponse = await get_api_endpoints();
    const translate_apiResponse = await translateWithDictionary(apiResponse);

      res.json(translate_apiResponse);
  });


// Función - Api people - GET
/**
 * @swagger
 * /persona/{id}:
 *   get:
 *     summary: Retrieve a person by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the person to get
 *     responses:
 *       200:
 *         description: A person data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 height:
 *                   type: string
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Person not found
 */
// Ruta GET que recibe un parámetro id y se asegura de que sea un entero
// app.get('/persona/:id', async (req: Request, res: Response): Promise<Response> => {
//     // Convertir el parámetro "id" a número entero
//     const persona_id = parseInt(req.params.id, 10);
  
//     // Validar si el parámetro no es un número
//     if (isNaN(persona_id)) {
//       return res.status(400).send('El ID debe ser un número entero.');
//     }
  
//     try {
//       // Llamar a la API con el id entero
//       const apiResponse = await get_persona_data(persona_id);
//       const translate_apiResponse = await translateWithDictionary(apiResponse);

//       res.json(translate_apiResponse); // Enviar la respuesta de la API como JSON
//     // res.json(apiResponse);
//     } catch (error) {
//       res.status(500).send('Hubo un error al obtener los datos del personaje.');
//     }
//   });

// Ruta GET que recibe un parámetro id y se asegura de que sea un entero
app.get('/persona/:id', async (req: Request, res: Response): Promise<Response | any> => {
  // Convertir el parámetro "id" a número entero
  const persona_id = parseInt(req.params.id, 10);

  // Validar si el parámetro no es un número
  if (isNaN(persona_id)) {
      return res.status(400).send('El ID debe ser un número entero.');
  }

  try {
      // Llamar a la API con el id entero
      const apiResponse = await get_persona_data(persona_id);
      const translate_apiResponse = await translateWithDictionary(apiResponse);

      // Enviar la respuesta de la API traducida como JSON
      return res.json(translate_apiResponse);
  } catch (error) {
      console.error("Error al obtener los datos del personaje:", error);
      return res.status(500).send('Hubo un error al obtener los datos del personaje.');
  }
});


  app.get('/pelicula/:id', async (req: Request, res: Response): Promise<Response | any> => {
    // Convertir el parámetro "id" a número entero
    const film_id = parseInt(req.params.id, 10);
  
    // Validar si el parámetro no es un número
    if (isNaN(film_id)) {
      return res.status(400).send('El ID debe ser un número entero.');
    }
  
    try {
      // Llamar a la API con el id entero
      const apiResponse = await get_film_data(film_id);
      const translate_apiResponse = await translateWithDictionary(apiResponse);

      res.json(translate_apiResponse); // Enviar la respuesta de la API como JSON
    // res.json(apiResponse);
    } catch (error) {
      res.status(500).send('Hubo un error al obtener los datos de la película.');
    }
  });


  // API: Obtener todos los personajes unicos - GET
app.get('/get_personajes_unicos/', async (req: Request, res: Response) => {
  const { nombre_unico } = req.params;

  try {
      const result = await getPersonajesUnicos();
      res.status(200).json(result); // Devuelve los datos del personaje
  } catch (err) {
    if (err instanceof Error) {
        // Si err es una instancia de Error, accede a su propiedad message
        console.error("Error", err.message);
        throw new Error('Error al obtener los datos: ' + err.message);
    } else {
        // Si err no es una instancia de Error, lanza un mensaje genérico
        console.error("Error desconocido", err);
        throw new Error('Error desconocido al obtener los datos.');
    }
}
});


  // API: Obtener personaje único - GET
  app.get('/get_personaje_unico/:nombre_unico', async (req: Request, res: Response) => {
    const { nombre_unico } = req.params;
  
    try {
        const result = await getDataByNombreUnico(nombre_unico);
        res.status(200).json(result); // Devuelve los datos del personaje
    } catch (err) {
      if (err instanceof Error) {
          // Si err es una instancia de Error, accede a su propiedad message
          console.error("Error", err.message);
          throw new Error('Error al obtener los datos: ' + err.message);
      } else {
          // Si err no es una instancia de Error, lanza un mensaje genérico
          console.error("Error desconocido", err);
          throw new Error('Error desconocido al obtener los datos.');
      }
  }
  });
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
  
