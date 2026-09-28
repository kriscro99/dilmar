# Dilmar – web stranica

One-page prezentacija za **Dilmar d.o.o.**, mesno-prerađivačku industriju iz Velike Gorice (od 1997.).

Uživo: https://kriscro99.github.io/dilmar/

## Struktura

- `index.html` – sav sadržaj (hero, o nama, proizvodi, priča o bijeloj kobasici, tradicija, partneri, kontakt, EU projekt)
- `css/style.css` – dizajn (boje u `:root`, prilagodbe za mobitele na dnu datoteke)
- `js/main.js` – animacije i interakcije (loader, karusel u heroju, filteri proizvoda, prozor s detaljima, dim na canvasu, obrazac → e-mail)
- `img/` – logo (SVG), fotografije proizvoda (`p/`), izrezani proizvodi za hero (`cut/`), og-image i ikone

Opisi proizvoda za prozor s detaljima nalaze se u `<script id="products-data">` na dnu `index.html`.

## Izvori sadržaja

- Tekstovi (o nama, misija, vizija, opisi proizvoda, prodaja, partneri, EU projekt) i fotografije proizvoda: stara stranica dilmar.hr (Wayback Machine + slike koje server još poslužuje)
- Uvod, slogan „U slast svima!”, specijaliteti (zagrebački i bečki odrezak, mesna štruca, pljeskavica, buncek): Facebook stranica Dilmar
- Adresa uprave i proizvodnje (Stepanska ul. 1a, 10412 Donja Lomnica): Google Maps i etiketa proizvoda

Cijene namjerno nisu navedene.

## Pretraživači

Stranica trenutno ima `<meta name="robots" content="noindex, follow">` jer je ovo prezentacijska verzija na github.io adresi.
Kad se stranica prebaci na vlastitu domenu, zamijenite tu liniju s `index, follow` i ažurirajte `canonical` i `og:url`.
