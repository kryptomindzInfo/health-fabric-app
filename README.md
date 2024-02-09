Steps to start phr Application

1. Pre-requisites:

   ```
   ./setup.sh
   ```

2. Copy app/env-example to app/.env and update environment variable in .env as per your environment.

   ```
   cp app/env-example app/.env
   nano app/.env
   ```

   press ctrl+O to save and ctrl+x to exit

3. Start Network and Application

   ```
   ./start.sh
   ```

4. To stop the Network and application

   ```
   ./stop.sh
   ```

# Ports:

```
explorer | 8280
grafana | 3000
node-exporter | 9100
prometheus | 9090
cadvisor | 8180

```
