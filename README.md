# istSOS-viewer

## Installation

- Create a conf Apache (or Nginx) to serve the `dist` repository.
- Create a file `dist/config/config.json` from `dist/config/config.json.example` and fill it with your personal informations.
  - `apiBaseUrl` is your istSOS address
  - `HTTP_API_AUTHENT`is your user and password, if you protected your istSOS with http basic authentification. Do not use your admin password because it can be decoded (use a viewer profile)

## Project presentation

This frontend project is a simple client visualisator for an IstSOS instance. It is only base on the IstSOS API and allow you to visualize all your "procedure"(sensor).

Each procedure has an individual page with its location, its description and its data on a plot. The plot are made with the Plotly librairy which allow to display a large dataset serie.
You can plot all the observed properties of the procedure and also filter them by date. 
In IstSOS, missing values are replaced by the value "999.9". You can modify globally this parameter to exclude those value of the plot with the variable `NO_DATA_VALUE` of the `config.json`. This parameter can also be modify for each procedure with the parameter button on the procedure page (located to the right of the EXPORT button)