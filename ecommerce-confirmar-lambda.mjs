// Nombre de archivo: index.mjs
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const REGION = process.env.REGION;
const CLIENT_ID = process.env.CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export const handler = async (event) => {
    console.log("Función de Confirmación - Evento Recibido:", JSON.stringify(event));

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

    const { email, code } = requestBody;

    if (!email || !code) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, message: "El correo electrónico y el código de confirmación son obligatorios." })
        };
    }

    const confirmSignUpParams = {
        ClientId: CLIENT_ID,
        Username: email, // El email que el usuario usó para registrarse
        ConfirmationCode: code,
    };

    try {
        const command = new ConfirmSignUpCommand(confirmSignUpParams);
        await cognitoClient.send(command);
        console.log(`Confirmación exitosa para el usuario: ${email}`);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "" },
            body: JSON.stringify({
            success: true,
            message: "Cuenta confirmada exitosamente. Ahora puedes iniciar sesión."
            }),
            };
            } catch (error) {
            console.error("Error durante la Confirmación en Cognito:", error);
            return {
            statusCode: error.$metadata?.httpStatusCode || 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "" },
            body: JSON.stringify({
            success: false,
            message: error.message || "Error interno del servidor al confirmar la cuenta.",
            code: error.name 
            }),
            };
            }
            };
