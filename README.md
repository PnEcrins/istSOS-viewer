# istSOS-viewer

## Installation

- Create a conf Apache (or Nginx) to serve the `dist` repository.
- Create a file `dist/config/config.json` from `dist/config/config.json.example` and fill it with your personal informations.
  - `apiBaseUrl` is your istSOS address
  - `HTTP_API_AUTHENT`is your user and password, if you protected your istSOS with http basic authentification. Do not use your admin password because it can be decoded (use a viewer profile)
