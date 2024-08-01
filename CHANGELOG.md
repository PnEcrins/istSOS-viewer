CHANGELOG
=========


1.2.0 (23-07-2024)
-------------------

- Ajout du paramètre `DISPLAY_DATE_IN_LOCAL_TIMEZONE` (booléen) pour pouvoir afficher les date dans la timezone locale. Par défault à `false`: affiche les date en UTC

Note de version : 

Rajouter le paramètre `DISPLAY_DATE_IN_LOCAL_TIMEZONE` dans le fichier `dist/config/config.json`


1.1.1 (23-05-2024)
-------------------

- Correction du remplacement des valeurs 0 par NaN dans les exports
- Correction d'un mauvais affichage des services

1.1.0 (21-05-2024)
-------------------

- Possibilité d'ajouter plusieurs variables sur le graphique
- Possibilité d'exclure certaines valeurs du graphique selon une plage min/max (valeurs aberrantes applatissant l'échelle du graphique)
- Ajout du paramètre `appName` qui contrôle le nom de l'application dans le header

Note de version : ajouter le paramètre `appName` dans le fichier config.json

1.0.0 (16-05-2024)
-------------------

- Interface carte/liste avec la liste des "procédures"
- Fiche détail d'une procédure avec graphiques des données, filtrable par date
- Téléchargement des données (variable par variable)
- Possibilité d’exclure des "services" et des "procédures"

Note de version : ajouter les paramètres `excluded_services` et `excluded_procedures` dans le fichier config.json. Mettre un tableau vide si vous ne souhaitez exclude aucun service / procédure.