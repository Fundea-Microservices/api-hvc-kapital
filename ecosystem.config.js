module.exports = {
  apps: [
    {
      name: "api-hvc-kapital",
      script: "dist/src/main.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {        
        PORT: 3200,
        // Fuerza UTC sin depender de la configuración regional del servidor
        // (relevante al desplegar en AWS, que puede no estar en hora local).
        TZ: "UTC"
      },
      env_development: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
