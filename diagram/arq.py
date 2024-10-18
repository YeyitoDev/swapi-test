from diagrams import Diagram
from diagrams.aws.compute import Lambda
from diagrams.aws.network import APIGateway
from diagrams.aws.database import DynamodbTable
from diagrams.aws.general import Client
from diagrams.onprem.network import Internet

# Crear el diagrama
with Diagram("Arquitectura de solucion", show=False):

    # Definir los componentes
    client = Client("Usuario")

    api_gateway = APIGateway("API Gateway")

    swapi = Internet("SWAPI")

    lambda_post_personaje = Lambda("postPersonajeUnico")
    lambda_get_personajes = Lambda("getPersonajesUnicos")
    lambda_get_personaje = Lambda("getPersonajeUnico")
    lambda_get_pelicula_id = Lambda("/getPelicula/{id}")
    lambda_get_persona_id = Lambda("/getPersona/{id}")

    dynamodb = DynamodbTable("swapi-test (DynamoDB)")

    # Conectar los componentes
    client >> api_gateway >> [lambda_post_personaje, lambda_get_personajes, 
                              lambda_get_personaje, lambda_get_pelicula_id, 
                              lambda_get_persona_id]
    lambda_post_personaje >> dynamodb
    lambda_get_personajes >> dynamodb
    lambda_get_personaje >> dynamodb

    lambda_get_pelicula_id >> swapi
    lambda_get_persona_id >> swapi
