# README

See `README-private.md` for instructions on how to connect to the server, etc.

## How it works
Truth be told I am fuzzy on the details, but here are the essentials:

* The DNS records for `api.openreadersbibles.org` and `api-dev.openreadersbibles.org` point to the IP address of the Digital Ocean Droplet.
* Nginx connects the HTTPS requests to the locally running server processes. Both sites are configured in files in `/etc/nginx/sites-available`. The key point is that `api.openreadersbibles.org` is served by `localhost:3000` and `api-dev.openreadersbibles.org` is served by `localhost:3001`.
* The processes that run the servers are managed by PM2. The configuration for the two processes is in `/root/ecosystem.config.js`, which is not in any repository since it has secrets in it. The configuration is pretty perspicuous: it configures two ports, which point to different server files, and have different environment variables.
* The `orb-server` repository has branches `main` and `dev`, for the production and development versions. Both branches are present on the server, in `/root/orb-server` and `/root/orb-server-dev` respectively.
* Updating the code and restarting can be done with `./update.sh`. This just pulls the latest code from the repositories and restarts the processes.

Further details are available in `README-private.md`, though this is not in any repository since it contains secrets.

## How to run locally

```
cd ~/Documents/open-readers-bibles/application/orb-server/src
ts-node index.ts
```