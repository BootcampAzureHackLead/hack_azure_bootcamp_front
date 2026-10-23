# Decisiones técnicas · LUMERA

- Entrega MVP como un servidor Node.js con Express: App Service aloja tanto archivos estáticos como el endpoint /api/promocion. Es preferible aquí a separar SPA y API porque el reto exige App Service y la lectura del blob desde el servidor.
- Fuente de datos para productos: arreglo estático en public/app.js. No se utiliza SQL/Cosmos DB para el catálogo; hacerlo agregaría costo y complejidad no exigidos.
- Fuente de la promoción: Blob Storage privado, contenedor promociones, blob mensaje.txt. Se solicita en cada carga de página, sin caché del lado servidor; el cliente llama a API con cache=no-store. No se realiza polling constante, evitando consumo innecesario.
- Seguridad: System-assigned Managed Identity de App Service; rol Storage Blob Data Reader al menor ámbito posible; en la nube se usa ManagedIdentityCredential; en local DefaultAzureCredential. El cliente solo recibe el texto, nunca un token ni un SAS.
- Modo demo: se muestra un texto de respaldo si Storage todavía no está configurado, con insignia DEMO. Si Storage está configurado pero falla, endpoint responde HTTP 503 para que no se confunda con cumplimiento del reto.
- Catálogo/cart: simulación frontend, persistencia local opcional para bolsa, sin checkout ni pagos.
- CI/CD: desplegar con GitHub Actions, mediante Deployment Center de App Service. Crear PR desde feat/landing-ropa-azure-storage y fusionar a main cuando el diseño y /api/health pasen; configurar variables e identidad después para la prueba real.
