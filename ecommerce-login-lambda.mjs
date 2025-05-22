// Nombre de archivo: index.mjs
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  NotAuthorizedException,
  UserNotFoundException,
  UserNotConfirmedException 
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = process.env.REGION;
const CLIENT_ID = process.env.CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event) => {
  console.log("Función de Login - Evento Recibido:", JSON.stringify(event));

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "El cuerpo de la solicitud está vacío." })
      };
      }
      let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error("Error parseando JSON del cuerpo:", e);
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, message: "Cuerpo de la solicitud no es JSON válido." })
        };
    }

    const { email, password } = requestBody;

    if (!email || !password) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, message: "El correo electrónico y la contraseña son obligatorios." })
        };
    }

    const initiateAuthParams = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    };

    try {
        const command = new InitiateAuthCommand(initiateAuthParams);
        const response = await cognitoClient.send(command);
        console.log("Respuesta de Cognito InitiateAuth:", response);

        if (response.AuthenticationResult && response.AuthenticationResult.IdToken) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({
                    success: true,
                    message: "Inicio de sesión exitoso.",
                    token: response.AuthenticationResult.IdToken, 
                }),
            };
        } else {
            console.warn("Inicio de sesión requiere un challenge o no devolvió tokens:", response.ChallengeName);
            return { 
                statusCode: 400, 
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ success: false, message: response.ChallengeName ? `Se requiere acción adicional: ${response.ChallengeName}` : "Respuesta de autenticación inesperada." })
            };
        }
    } catch (error) {
        console.error("Error durante el InitiateAuth en Cognito:", error);
        let statusCode = error.$metadata?.httpStatusCode || 500;
        let message = error.message || "Error interno del servidor al iniciar sesión.";
        let needsConfirmation = false;

        if (error instanceof UserNotConfirmedException) {
            statusCode = 400; 
            message = "El usuario no está confirmado. Por favor, verifica tu correo.";
            needsConfirmation = true; // Añadimos esta bandera para el frontend
        } else if (error instanceof NotAuthorizedException) {
            statusCode = 401; 
            message = "Correo electrónico o contraseña incorrectos.";
        } else if (error instanceof UserNotFoundException) {
            statusCode = 404; 
            message = "Usuario no encontrado.";
        }
        
        return {
            statusCode: statusCode,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ 
                success: false, 
                message: message, 
                code: error.name,
                needsConfirmation: needsConfirmation // Enviar esta bandera al frontend
            }),
        };
    }
};
