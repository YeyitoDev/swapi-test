// src/index.ts

import express, { Request, Response } from 'express';
import serverless from 'serverless-http'; 

import axios from 'axios';
import AWS from 'aws-sdk';
import cors from 'cors';
// import { translateWithDictionary } from './translate'; // Adjust path if necessary

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


require('dotenv').config();

//
// import swaggerUi from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './swagger'; // Ensure correct extension
 // Adjust path if necessary


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

     // Valor por defecto


    // Primero verifica si el ítem ya existe
    const getParams = {
        TableName: table_name,
        Key: {
            nombre_unico, // Asumiendo que nombre_unico es la clave primaria
        },
    };

    try {
      console.log(getParams);

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


const app = express();


// Middleware 
app.use(cors());
app.use(express.json());

// Swagger setup
// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Handler to return Swagger JSON spec
export const getApiDocsHandler = async (event: any) => {
  try {
    // Return Swagger specification as JSON
    return {
      statusCode: 200,
      body: JSON.stringify(swaggerSpec), // Return the Swagger JSON specification
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error retrieving API documentation: ${errorMessage}` }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};


// Route example

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express + TypeScript!');
});


app.post('/api/data', (req: Request, res: Response) => {
  const data = req.body;
  res.json({ received: data });
});


/**
 * @swagger
 * /personaje_unico:
 *   post:
 *     summary: Insertar un nuevo personaje en la base de datos
 *     description: Inserta los detalles de un nuevo personaje en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_unico:
 *                 type: string
 *                 example: "Yeyo7"
 *               altura:
 *                 type: integer
 *                 example: 180
 *               color_de_cabello:
 *                 type: string
 *                 example: "negro"
 *               color_de_piel:
 *                 type: string
 *                 example: "trigueño"
 *               color_de_ojos:
 *                 type: string
 *                 example: "marrones"
 *               año_de_nacimiento:
 *                 type: integer
 *                 example: 2000
 *               género:
 *                 type: string
 *                 example: "masculino"
 *               mundo_natal:
 *                 type: string
 *                 example: "planeta tierra"
 *               color_sable_luz:
 *                 type: string
 *                 example: "naranja"
 *               nave_estelar:
 *                 type: string
 *                 example: "space-ye"
 *     responses:
 *       200:
 *         description: Personaje insertado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Personaje insertado exitosamente"
 *       400:
 *         description: Solicitud incorrecta o datos faltantes
 *       500:
 *         description: Error interno del servidor
 */


// // API: Personaje único - POST
// app.post('/personaje_unico', async (req: Request, res: Response): Promise<Response | any> => {
//     const {
//         nombre_unico,
//         altura,
//         color_de_cabello,
//         color_de_piel,
//         color_de_ojos,
//         año_de_nacimiento,
//         género,
//         mundo_natal,
//         color_sable_luz,
//         nave_estelar,
//     } = req.body;

//     try {
//         const result = await insertDataintoDatabase(
//             nombre_unico,
//             altura,
//             color_de_cabello,
//             color_de_piel,
//             color_de_ojos,
//             año_de_nacimiento,
//             género,
//             mundo_natal,
//             color_sable_luz,
//             nave_estelar
//         );
//         res.status(200).json({ message: result }); // Mensaje de éxito
//     } catch (err) {
//       if (err instanceof Error) {
//           // Si err es una instancia de Error, accede a su propiedad message
//           console.error("Error", err.message);
//           throw new Error('Error al obtener los datos: ' + err.message);
//       } else {
//           // Si err no es una instancia de Error, lanza un mensaje genérico
//           console.error("Error desconocido", err);
//           throw new Error('Error desconocido al obtener los datos.');
//       }
//   }
// });
export const personajeUnicoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log(event.body);
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El cuerpo de la solicitud no puede estar vacío." }),
      };
    }

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
    } = JSON.parse(event.body);

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

    return {
      statusCode: 200,
      body: JSON.stringify({ message: result }),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al obtener los datos: " + errorMessage }),
    };
  }
};


  // API: Root - GET
app.get('/raiz', async (req: Request, res: Response): Promise<Response | any> => {

    const apiResponse = await get_api_endpoints();
    const translate_apiResponse = await translateWithDictionary(apiResponse);

      res.json(translate_apiResponse);
  });


// Función - Api people - GET
/**
* @swagger
* /persona/{id}:
*   get:
*     summary: Obtener información de una persona por ID
*     parameters:
*       - in: path
*         name: id
*         schema:
*           type: integer
*         required: true
*         description: ID numérico de la persona a obtener
*     responses:
*       200:
*         description: Datos de la persona
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 nombre:
*                   type: string
*                 altura:
*                   type: string
*                 masa:
*                   type: string
*                 color_de_cabello:
*                   type: string
*                 color_de_piel:
*                   type: string
*                 color_de_ojos:
*                   type: string
*                 año_de_nacimiento:
*                   type: string
*                 género:
*                   type: string
*                 mundo_natal:
*                   type: string
*                 películas:
*                   type: array
*                   items:
*                     type: string
*                 especies:
*                   type: array
*                   items:
*                     type: string
*                 vehículos:
*                   type: array
*                   items:
*                     type: string
*                 naves_estelares:
*                   type: array
*                   items:
*                     type: string
*                 creado:
*                   type: string
*                 editado:
*                   type: string
*                 url:
*                   type: string
*       400:
*         description: ID inválido
*       404:
*         description: Persona no encontrada
*       500:
*         description: Error interno del servidor
 */



// // Ruta GET que recibe un parámetro id y se asegura de que sea un entero
// app.get('/persona/:id', async (req: Request, res: Response): Promise<Response | any> => {
//   // Convertir el parámetro "id" a número entero
//   const persona_id = parseInt(req.params.id, 10);

//   // Validar si el parámetro no es un número
//   if (isNaN(persona_id)) {
//       return res.status(400).send('El ID debe ser un número entero.');
//   }

//   try {
//       // Llamar a la API con el id entero
//       const apiResponse = await get_persona_data(persona_id);
//       const translate_apiResponse = await translateWithDictionary(apiResponse);

//       // Enviar la respuesta de la API traducida como JSON
//       return res.json(translate_apiResponse);
//   } catch (error) {
//       console.error("Error al obtener los datos del personaje:", error);
//       return res.status(500).send('Hubo un error al obtener los datos del personaje.');
//   }
// });

export const getPersonaHandler = async (event: any) => {
  const persona_id =  parseInt(event.pathParameters.id, 10);
  

  if (!persona_id || typeof persona_id !== 'number') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "El campo nombre_unico es obligatorio y debe ser un entero." })
    };
  }

  try {
    const apiResponse = await get_persona_data(persona_id);
    const translate_apiResponse = await translateWithDictionary(apiResponse);

    // res.json(translate_apiResponse); // Enviar la respuesta de la API como JSON

    return {
      statusCode: 200,
      body: JSON.stringify(translate_apiResponse)
    };
  } catch (error) {
    console.error("Error al obtener los datos: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Hubo un error al obtener los datos del personaje.'})
    };
  }
};




/**
 * @swagger
 * /pelicula/{id}:
 *   get:
 *     summary: Obtener información de una película por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID numérico de la película a obtener
 *     responses:
 *       200:
 *         description: Datos de la película
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 titulo:
 *                   type: string
 *                   example: "Star Wars: Episode IV - A New Hope"
 *                 director:
 *                   type: string
 *                   example: "George Lucas"
 *                 productor:
 *                   type: string
 *                   example: "Gary Kurtz, George Lucas"
 *                 año_de_lanzamiento:
 *                   type: string
 *                   example: "1977"
 *                 personajes:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Luke Skywalker"
 *                 especies:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Human"
 *                 planetas:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Tatooine"
 *                 naves_estelares:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Millennium Falcon"
 *                 películas:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Star Wars: Episode V - The Empire Strikes Back"
 *                 creado:
 *                   type: string
 *                   format: date-time
 *                   example: "2014-12-12T11:12:24.144000Z"
 *                 editado:
 *                   type: string
 *                   format: date-time
 *                   example: "2014-12-20T21:17:56.891000Z"
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: "https://swapi.py4e.com/api/films/1/"
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Película no encontrada
 *       500:
 *         description: Error interno del servidor
 */


  // app.get('/pelicula/:id', async (req: Request, res: Response): Promise<Response | any> => {
  //   // Convertir el parámetro "id" a número entero
  //   const film_id = parseInt(req.params.id, 10);
  
  //   // Validar si el parámetro no es un número
  //   if (isNaN(film_id)) {
  //     return res.status(400).send('El ID debe ser un número entero.');
  //   }
  
  //   try {
  //     // Llamar a la API con el id entero
  //     const apiResponse = await get_film_data(film_id);
  //     const translate_apiResponse = await translateWithDictionary(apiResponse);

  //     res.json(translate_apiResponse); // Enviar la respuesta de la API como JSON
  //   // res.json(apiResponse);
  //   } catch (error) {
  //     res.status(500).send('Hubo un error al obtener los datos de la película.');
  //   }
  // });

  export const getPeliculaHandler = async (event: any) => {
    const film_id =  parseInt(event.pathParameters.id, 10);
    
  
    if (!film_id || typeof film_id !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El campo nombre_unico es obligatorio y debe ser un entero." })
      };
    }
  
    try {
      const apiResponse = await get_film_data(film_id);
      const translate_apiResponse = await translateWithDictionary(apiResponse);

      // res.json(translate_apiResponse); // Enviar la respuesta de la API como JSON

      return {
        statusCode: 200,
        body: JSON.stringify(translate_apiResponse)
      };
    } catch (error) {
      console.error("Error al obtener los datos: ", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Hubo un error al obtener los datos de la película.'})
      };
    }
  };


  /**
 * @swagger
 * /get_personajes_unicos/:
 *   get:
 *     summary: Obtener lista de personajes únicos
 *     description: Devuelve una lista de personajes únicos con sus atributos detallados.
 *     responses:
 *       200:
 *         description: Lista de personajes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre_unico:
 *                     type: string
 *                     example: "Yeyo2"
 *                   color_de_ojos:
 *                     type: string
 *                     example: "marrones"
 *                   color_sable_luz:
 *                     type: string
 *                     example: "naranja"
 *                   género:
 *                     type: string
 *                     example: "masculino"
 *                   color_de_piel:
 *                     type: string
 *                     example: "trigueño"
 *                   mundo_natal:
 *                     type: string
 *                     example: "planeta tierra"
 *                   año_de_nacimiento:
 *                     type: integer
 *                     example: 2000
 *                   altura:
 *                     type: integer
 *                     example: 180
 *                   editado:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-10-15T16:54:45.734Z"
 *                   creado:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-10-15T16:54:45.734Z"
 *                   nave_estelar:
 *                     type: string
 *                     example: "space-ye"
 *                   color_de_cabello:
 *                     type: string
 *                     example: "negro"
 *       400:
 *         description: Solicitud incorrecta
 *       404:
 *         description: Personajes no encontrados
 *       500:
 *         description: Error interno del servidor
 */


  // API: Obtener todos los personajes unicos - GET
// app.get('/get_personajes_unicos/', async (req: Request, res: Response): Promise<Response | any> => {
//   const { nombre_unico } = req.params;

//   try {
//       const result = await getPersonajesUnicos();
//       res.status(200).json(result); // Devuelve los datos del personaje
//   } catch (err) {
//     if (err instanceof Error) {
//         // Si err es una instancia de Error, accede a su propiedad message
//         console.error("Error", err.message);
//         throw new Error('Error al obtener los datos: ' + err.message);
//     } else {
//         // Si err no es una instancia de Error, lanza un mensaje genérico
//         console.error("Error desconocido", err);
//         throw new Error('Error desconocido al obtener los datos.');
//     }
// }
// });

// export const getPersonajeUnico = async (event: any) => {

export const getPersonajesUnicosHandler = async (event: any) => {
//   event: APIGatewayEvent
// ): Promise<APIGatewayProxyResult> => {

  try {
    // Assuming `getPersonajesUnicos` is a function that returns the required data.
    const result = await getPersonajesUnicos();

    return {
      statusCode: 200,
      body: JSON.stringify(result),  // Send the result as a JSON response
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    console.error("Error", errorMessage);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error al obtener los datos: " + errorMessage }),
    };
  }
};


/**
 * @swagger
 * /get_personaje_unico/{nombre_unico}:
 *   get:
 *     summary: Obtener un personaje único por su nombre
 *     description: Devuelve los detalles de un personaje único basado en el nombre especificado.
 *     parameters:
 *       - in: path
 *         name: nombre_unico
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre único del personaje a obtener
 *     responses:
 *       200:
 *         description: Datos del personaje obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nombre_unico:
 *                   type: string
 *                   example: "Yeyo2"
 *                 color_de_ojos:
 *                   type: string
 *                   example: "marrones"
 *                 color_sable_luz:
 *                   type: string
 *                   example: "naranja"
 *                 género:
 *                   type: string
 *                   example: "masculino"
 *                 color_de_piel:
 *                   type: string
 *                   example: "trigueño"
 *                 mundo_natal:
 *                   type: string
 *                   example: "planeta tierra"
 *                 año_de_nacimiento:
 *                   type: integer
 *                   example: 2000
 *                 altura:
 *                   type: integer
 *                   example: 180
 *                 editado:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-15T16:54:45.734Z"
 *                 creado:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-10-15T16:54:45.734Z"
 *                 nave_estelar:
 *                   type: string
 *                   example: "space-ye"
 *                 color_de_cabello:
 *                   type: string
 *                   example: "negro"
 *       400:
 *         description: Solicitud incorrecta o parámetro inválido
 *       404:
 *         description: Personaje no encontrado
 *       500:
 *         description: Error interno del servidor
 */


  // API: Obtener personaje único - GET
  // app.get('/get_personaje_unico/:nombre_unico', async (req: Request, res: Response): Promise<Response | any> => {
  //   const { nombre_unico } = req.params;

  //   if (!nombre_unico || typeof nombre_unico !== 'string') {
  //     return res.status(400).json({ message: "El campo nombre_unico es obligatorio y debe ser una cadena." });
  // }
  
  
  //   try {
  //       const result = await getDataByNombreUnico(nombre_unico);
  //       res.status(200).json(result); // Devuelve los datos del personaje
  //   } catch (err) {
  //     if (err instanceof Error) {
  //         // Si err es una instancia de Error, accede a su propiedad message
  //         console.error("Error", err.message);
  //         throw new Error('Error al obtener los datos: ' + err.message);
  //     } else {
  //         // Si err no es una instancia de Error, lanza un mensaje genérico
  //         console.error("Error desconocido", err);
  //         throw new Error('Error desconocido al obtener los datos.');
  //     }
  // }
  // });

  export const getPersonajeUnicoHandler = async (event: any) => {
    const nombre_unico = event.pathParameters.nombre_unico;
  
    if (!nombre_unico || typeof nombre_unico !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El campo nombre_unico es obligatorio y debe ser una cadena." })
      };
    }
  
    try {
      const result = await getDataByNombreUnico(nombre_unico);
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      console.error("Error al obtener los datos: ", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error al obtener los datos" })
      };
    }
  };

  module.exports.handler = serverless(app);
  
  // 
  // Use environment variables for PORT and URL
// const PORT = process.env.PORT || 3100;
// const URL = `http://0.0.0.0:${PORT}`;

//   app.listen(PORT, () => {
//     console.log(`Servidor corriendo en ${URL}`);
//   });
  