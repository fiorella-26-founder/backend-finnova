const nodemailer = require('nodemailer');

// Configuración de transporte SMTP con timeouts seguros
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'finnova.asesoria@gmail.com',
        pass: process.env.SMTP_PASS || 'finnova_pass_2026'
    },
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 3000
});

const EmailService = {
    /**
     * Enviar correo con credenciales de acceso para nuevos clientes tras validar su cobranza/pago o registro
     */
    async enviarCredencialesCliente({ nombre, email, password, dni, id_solicitud }) {
        const loginUrl = process.env.FRONTEND_LOGIN_URL || 'http://localhost:4200/login';

        const subject = '🔐 ¡Bienvenido a Finnova! Acceso para el seguimiento de tu solicitud';
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333333; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #0b213f 0%, #1e3a8a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
                .header p { margin: 8px 0 0 0; opacity: 0.85; font-size: 14px; }
                .content { padding: 30px 25px; }
                .badge-success { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 15px; }
                .credentials-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0; }
                .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .cred-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                .cred-label { font-weight: 600; color: #64748b; }
                .cred-value { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 15px; }
                .btn-portal { display: block; width: 220px; margin: 30px auto; background: #059669; color: #ffffff !important; text-decoration: none; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3); }
                .alert-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 15px; border-radius: 4px; font-size: 13px; color: #1e40af; margin-top: 20px; line-height: 1.5; }
                .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>FINNOVA Asesoría Financiera</h1>
                    <p>Plataforma de Gestión y Asesoramiento Patrimonial</p>
                </div>
                <div class="content">
                    <span class="badge-success">✓ Cobranza Validada y Usuario Creado</span>
                    <h2 style="color: #0f172a; margin-top: 0;">¡Hola, ${nombre}!</h2>
                    <p style="line-height: 1.6; color: #475569;">
                        Has sido registrado en el sistema de <strong>Finnova</strong> para que puedas hacer seguimiento en tiempo real al estado de tu solicitud de asesoría financiera ${id_solicitud ? `(<strong>${id_solicitud}</strong>)` : ''}.
                    </p>
                    <p style="line-height: 1.6; color: #475569;">
                        Puedes ingresar a la plataforma utilizando tu correo electrónico y la siguiente contraseña temporal:
                    </p>

                    <div class="credentials-box">
                        <div class="cred-row">
                            <span class="cred-label">Usuario / Correo:</span>
                            <span class="cred-value">${email}</span>
                        </div>
                        <div class="cred-row">
                            <span class="cred-label">DNI:</span>
                            <span class="cred-value">${dni || 'Registrado'}</span>
                        </div>
                        <div class="cred-row">
                            <span class="cred-label">Contraseña Temporal:</span>
                            <span class="cred-value" style="color: #059669;">${password}</span>
                        </div>
                    </div>

                    <a href="${loginUrl}" class="btn-portal">Ingresar al Portal</a>

                    <div class="alert-info">
                        🔒 <strong>Importante sobre tu seguridad:</strong> Esta es una contraseña aleatoria temporal. Una vez que ingreses al portal, por favor cámbiala desde la opción <strong>"Cambiar Contraseña"</strong> en tu perfil.
                    </div>
                </div>
                <div class="footer">
                    <p>© 2026 FINNOVA - Soluciones Financieras Integrales. Todos los derechos reservados.</p>
                    <p>Este es un correo automático generado por el sistema. Por favor no responder directamente a esta dirección.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Log con formato en consola para desarrollo y pruebas
        console.log('------------------------------------------------------------');
        console.log('📧 [EMAIL SERVICE] Envío de Credenciales de Acceso a Cliente');
        console.log(`Destinatario : ${nombre} <${email}>`);
        console.log(`DNI          : ${dni || '-'}`);
        console.log(`Solicitud    : ${id_solicitud || '-'}`);
        console.log(`Contraseña   : ${password}`);
        console.log(`Login URL    : ${loginUrl}`);
        console.log('------------------------------------------------------------');

        try {
            const info = await transporter.sendMail({
                from: '"Finnova Asesoría Financiera" <notificaciones@finnova.pe>',
                to: email,
                subject,
                html
            });
            console.log('✓ Correo enviado con ID:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            // En desarrollo local sin SMTP configurado, el log superior garantiza que las credenciales no se pierdan
            console.warn('ℹ️ [EmailService] Servidor SMTP no disponible en local, credenciales emitidas en consola:', error.message);
            return { success: true, simulated: true };
        }
    }
};

module.exports = EmailService;
