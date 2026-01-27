# README

See `README-private.md` for instructions on how to connect to the server, etc.

## How it works
* The DNS records for `api.openreadersbibles.org` and `api-dev.openreadersbibles.org` point to the IP address of the Digital Ocean Droplet.
* Nginx connects the HTTPS requests to the locally running server processes. Both sites are configured in files in `/etc/nginx/sites-available`. The key point is that `api.openreadersbibles.org` is served by `localhost:3000` and `api-dev.openreadersbibles.org` is served by `localhost:3001`.
* The processes that run the servers are managed by PM2. The configuration for the two processes is in `/root/ecosystem.config.js`, which is not in any repository since it has secrets in it (but see `ecosystem.config.js.sample.js`). The configuration is pretty perspicuous: it configures two ports, which point to different server files, and have different environment variables.
* Both the `orb-server` repository and the `models` repository have branches `main` and `dev`, for the production and development versions. These are in `/root/orb-server-prod` and `/root/orb-server-dev` respectively.
* Updating the code and restarting can be done with `./update.sh`. This just pulls the latest code from the repositories and restarts the processes.
* Note that the PM2 configuration file `/root/ecosystem.config.js` should be identical to what is in the repository, but it is not actually the file from the repository. You need to keep that synched manually.

Further details are available in `README-private.md`, though this is not in any repository since it contains secrets.

The configuration file (`ecosystem.config.js`) is not automatically reloaded every time the process is restarted, so if those settings ever change, you should stop and then start all of the processes.
```
pm2 kill
pm2 start ecosystem.config.js
```

## How to run locally

```
cd ~/Documents/open-readers-bibles/application/orb-server/src
ts-node index.ts
```

## Database commands
```
sudo service mariadb start
```

```
sudo service mariadb status
```

## Logs commands

```
pm2 logs api-dev
```

```
pm2 flush
```


## XSL transformations
XSLT can be done with SaxonJS. 

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

xslt3 -xsl:xslt/tei2html.xsl -s:bhsa_OT_JON.xml -o:books.html -t

## Tests

Run these from `~/Documents/open-readers-bibles/application/orb-server/src`.

npx jest verse.test.ts

npx jest gloss.test.ts


npx jest phrasegloss.test.ts
