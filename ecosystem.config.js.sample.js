/// This is a configuration file for pm2, a process manager for Node.js applications.
// It tells pm2 how to start the application, and what environment variables to set.

module.exports = {
    apps: [
        {
            name: 'api-dev',
            script: 'orb-server-dev/orb-server/dist/index.js',
            env: {
                NODE_ENV: 'development',
                API_PORT: 3001,
                RDS_HOST: 'localhost',
                MARIADB_USER: 'orb',
                MARIADB_PASSWORD: 'SECRET',
                RDS_DATABASE: 'openreadersbibles',
                RDS_PORT: 3306,
                GITHUB_SECRET: 'SECRET'
            }
        },
        {
            name: 'api-prod',
            script: 'orb-server-prod/orb-server/dist/index.js',
            env: {
                NODE_ENV: 'production',
                API_PORT: 3000,
                RDS_HOST: 'localhost',
                MARIADB_USER: 'orb',
                MARIADB_PASSWORD: 'SECRET',
                RDS_DATABASE: 'openreadersbibles-dev',
                RDS_PORT: 3306,
                GITHUB_SECRET: 'SECRET'
            }
        }
    ]
};