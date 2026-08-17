### Pasos para levantar el API

1. Instalación de paquetes para microservicios
```
npm install
```
2. Compilar el proyecto
```
npm run build
```
3. Instalar pm2 globalmente
```
npm install -g pm2
```
4. Crear el archivo de configuración PM2
```
nano ecosystem.config.js
```
5. El archivo ecosystem.config.js debe contener lo siguiente
```
module.exports = {
  apps: [
    {
      name: "api-hvc-kapital",
      script: "dist/main.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3430
      }
    }
  ]
};
```
6. Iniciar el servicio con PM2
```
pm2 start ecosystem.config.js
```
7. Inicio automático de PM2
```
pm2 startup
```
Te mostrará un comando como este:
```
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
Copiar y ejecutar, luego guardar el estado
```
pm2 save
```