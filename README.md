# orb-server README

See [PRIVATE.md](PRIVATE.md) for instructions on how to connect to the server, etc.

## How it works
* The DNS records for `api.openreadersbibles.org` and `api-dev.openreadersbibles.org` point to the IP address of the Digital Ocean Droplet.
* Nginx connects the HTTPS requests to the locally running server processes. Both sites are configured in files in `/etc/nginx/sites-available`. The key point is that `api.openreadersbibles.org` is served by `localhost:3000` and `api-dev.openreadersbibles.org` is served by `localhost:3001`.
* The processes that run the servers are managed by PM2. The configuration for the two processes is in `/root/ecosystem.config.js`, which is not in any repository since it has secrets in it (but see [ecosystem.config.js.sample.js](ecosystem.config.js.sample.js)). The configuration is pretty perspicuous: it configures two ports, which point to different server files, and have different environment variables.
* Both the `orb-server` repository and the `models` repository have branches `main` and `dev`, for the production and development versions. These are in `/root/orb-server-prod` and `/root/orb-server-dev` respectively.
* Updating the code and restarting can be done with `./update.sh`. This just pulls the latest code from the repositories and restarts the processes.
* Note that the PM2 configuration file `/root/ecosystem.config.js` should be identical to what is in the repository, but it is not actually the file from the repository. You need to keep that synched manually.

## Tasks on the server

### My scripts to update the code and restart the service

```
./update.sh
```

Or just restart the dev-api:
```
./restart-dev-api.sh
```

Or just update the dev side:
```
./update-dev.sh
```

### pm2 Commands

See the logs:
```
/root/.pm2/logs
```

Inspect the logs in real time:
```
pm2 logs api-dev
pm2 logs api-prod
```

The configuration file (`ecosystem.config.js`) is not automatically reloaded every time the process is restarted, so if those settings ever change, you should stop and then start all of the processes.
```
pm2 kill
pm2 start ecosystem.config.js
```


### Database commands
```
sudo service mariadb start
```

```
sudo service mariadb status
```

Test the local database connection
```
mysql -h localhost -u root -e "SELECT VERSION();"
```


## Local debugging
See [PRIVATE.md](PRIVATE.md) for commands to start the server locally.


Compile without output to check for TypeScript errors:
```
cd ~\Documents\open-readers-bibles\application\orb-server\src
tsc --noEmit
```

Lint:
```
cd ~\Documents\open-readers-bibles\application\orb-server\src
npx eslint . --ext .ts --ignore-pattern node_modules --ignore-pattern *.js
```

You may need to kill the process using port 3000:

```
~\Documents\open-readers-bibles\application\orb-server\kill3000.ps1
```

## Code that should only be relevant once

### SQL Security
These commands presumably need to be incorporated into a Dockerfile to set up the server.

```
sudo ufw allow from 98.226.98.0/24 to any port 3306
sudo ufw deny 3306
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

sudo ufw enable
sudo ufw status
```

### Create a copy of the database
Command line:
```
mysqldump -u root -p openreadersbibles > openreadersbibles.sql
mysql -u root -p
```

MySQL:
```
CREATE DATABASE `openreadersbibles-dev`;
```

Command line:
```
mysql -u root -p openreadersbibles-dev < openreadersbibles.sql
```


```
mysqldump -u root -p openreadersbibles votes > votes.sql
```

## Dump Databases (e.g., for backups)

```
mysqldump -u root -p openreadersbibles > openreadersbibles.sql
mysqldump -u root -p openreadersbibles-dev > openreadersbibles-dev.sql
ls -l *.sql
gzip openreadersbibles.sql
gzip openreadersbibles-dev.sql
```


## XSL transformations
The files `tei2html.xsl` and `tei2tex.xsl` need to be compiled into JSON format for use in the server. If the XSL files change, they must be recompiled and the code in the repository updated.

Installation.
```
npm install saxon-js
```

Compile the XSL files to JSON format:
```cmd
cd ~\Documents\open-readers-bibles\application\orb-server\src
xslt3 -t -xsl:xslt/tei2html.xsl -export:xslt/tei2html.sef.json -nogo "-ns:##html5"
xslt3 -t -xsl:xslt/tei2tex.xsl -export:xslt/tei2tex.sef.json -nogo "-ns:##html5"
```

```Powershell
cd ~\Documents\open-readers-bibles\application\orb-server\src
"export default $(Get-Content -Raw xslt/tei2html.sef.json)" | Set-Content xslt/tei2html.sef.ts
"export default $(Get-Content -Raw xslt/tei2tex.sef.json)" | Set-Content xslt/tei2tex.sef.ts
```

Example:
```
node run-xslt.js
```

```
xslt3 -xsl:xslt/tei2html.xsl -s:bhsa_OT_JON.xml -o:books.html -t
```