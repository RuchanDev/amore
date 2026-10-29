# AMORE — custom webshop met Mollie

## Snel lokaal bekijken
1. Installeer Node.js 20 of hoger.
2. Open deze map in VS Code en voer uit: `npm install`.
3. Voer uit: `npm run dev`.
4. Open http://localhost:3000. Wijzigingen in server.js herstarten automatisch de Node-server; voor wijzigingen aan HTML/CSS/JS ververs je de pagina. (Geen automatische browser-hot-reload inbegrepen.)

## Mollie koppelen
1. Maak een Mollie-account aan en activeer de gewenste betaalmethoden (bijv. iDEAL).
2. Kopieer `.env.example` naar `.env` en vul de **geheime** Mollie **test** API-sleutel in. Nooit in de `public/` map zetten.
3. Stel `BASE_URL` in op de openbare HTTPS URL van je hosting. Mollie-webhooks vereisen een publiek bereikbaar HTTPS-adres, localhost voldoet niet.
4. Test een betaling in testmodus en controleer de status `paid` in Mollie.
5. Gebruik pas daarna een live sleutel. Configureer hosting met HTTPS en een duurzaam orderbestand/database.

## Belangrijk voor echte verkoop
- Producten en prijzen zijn DEMO. Verander ze in `server.js`.
- Productbeelden zijn schematische CSS-concepten, geen echte kledingfoto's.
- Winkelwagen is lokaal in de browser. Voorraadbeheer, verzendkosten, adressen, e-mails, facturen, retouren en beheerdersdashboard zijn nog niet gebouwd.
- Orders leven in een in-memory Map en gaan verloren bij serverrestart. Gebruik in productie een database met persistente opslag, transacties, idempotente webhookafhandeling, reservering van voorraad, fulfillment na `paid`, logging en autorisatie.
- Om een volledig operationele webshop te hebben zijn ook AVG/privacyverklaring, algemene voorwaarden, retourinformatie en beveiligde hosting nodig.
- Het contactadres in de footer is een placeholder.
