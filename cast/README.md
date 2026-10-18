# Cast Phone

Appli Android pour lire les films du téléphone sur une TV compatible DLNA/UPnP (Samsung, LG, Sony, Philips…), comme le fait VLC.

Le téléphone sert le fichier en HTTP sur le Wi-Fi (avec Range, pour avancer/reculer) et commande la TV en UPnP :
la **TV lit elle-même le fichier** avec son décodeur, sans transcodage.

## Installer
1. Ouvrir sur le téléphone la page *Releases* du dépôt, release **Cast Phone (dernier build)**, télécharger `cast-phone.apk`.
2. Autoriser l'installation depuis ce navigateur si Android le demande, puis installer.
3. Dans l'appli : *Chercher les TV* → choisir la TV → *Choisir un film* → *Lancer sur la TV*.

Téléphone et TV doivent être sur le même Wi-Fi. Sur la TV, activer « lecteur multimédia »/DLNA si ce réglage existe.

## Limites
- Samsung : certains modèles récents ne reçoivent plus le DLNA « poussé » depuis un téléphone ; dans ce cas la TV n'apparaît pas.
- Le format doit être lisible par la TV (MKV/H.264 en général oui ; HEVC 10 bits, DTS, AVI anciens : selon le modèle).
- Pas de sous-titres externes (.srt) ni de films protégés (Netflix, Prime…).
- APK de test signé avec une clé de débogage versionnée : pas pour le Play Store.

## Structure
- `core/` : Kotlin/JVM pur (serveur média, SSDP, UPnP). Testé sans Android : `./gradlew :core:test`.
- `app/` : écran, service au premier plan, accès aux fichiers. Compilé par GitHub Actions (`.github/workflows/cast-apk.yml`).
