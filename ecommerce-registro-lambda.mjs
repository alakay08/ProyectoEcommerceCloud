// Nombre de archivo: index.mjs
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

// Estas variables se tomarán de las Variables de Entorno de la Lambda
const REGION = process.env.REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event) => {
    console.log("Función de Registro - Evento Recibido:", JSON.stringify(event));

    if (!event.body) {
        return { statusCode: 400,
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

    // Validación simple de contraseña (Cognito tiene sus propias políticas más robustas)
    if (password.length < 8) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, message: "La contraseña debe tener al menos 8 caracteres." })
        };
    }

    const signUpParams = {
        ClientId: CLIENT_ID,
        Username: email, // Usamos el email como nombre de usuario en Cognito
        Password: password,
        UserAttributes: [
            {
                Name: "email", // Atributo estándar de Cognito
                Value: email,
            },
        ],
    };

    try {
        const command = new SignUpCommand(signUpParams);
        const signUpResponse = await cognitoClient.send(command);
        console.log("Respuesta de Cognito SignUp:", signUpResponse);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // IMPORTANTE para CORS
            body: JSON.stringify({
                success: true,
                message: "Usuario registrado exitosamente. Por favor, revisa tu correo para el código de confirmación.",
                userSub: signUpResponse.UserSub, // El ID único del usuario en Cognito
                userConfirmed: signUpResponse.UserConfirmed // Debería ser false
            }),
        };
    } catch (error) {
        console.error("Error durante el SignUp en Cognito:", error);
        return {
            statusCode: error.$metadata?.httpStatusCode || 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
                success: false,
                message: error.message || "Error interno del servidor al registrar el usuario.",
                code: error.name 
            }),
        };
    }
};

