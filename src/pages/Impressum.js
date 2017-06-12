
import React from 'react';

import BuildInfo from '../util/BuildInfo';

const PortalPage = () => (
  <div>
    <h1>Impressum</h1>
    <p>
      {BuildInfo.IMPRESSUM}
    </p>
    <h1>Hinweis zur Speicherung, Verarbeitung und Übermittlung personenbezogener Daten</h1>
    <p>
      Im Rahmen dieser Webseite werden Daten gespeichert, verarbeitet.
    </p>
    <h1>Welche Daten werden übermittelt?</h1>
    <p>
      Diese Webseite verwendet verschiedene Internetdienste zur Authentifizierung. Dabei werden je
      nach Dienst
      verschiedene Informationen vom Internetdienst auf diese Webseite uebertragen. Generell wird
      dabei
      versucht diese Informationen minimal zu halten.
      Im Rahmen des Anmeldevorgangs wird ein Cookie auf deinem Computer gespeichert, der bis zum
      Beenden des Browser eine ID enthält, die dich eindeutig identifiziert. Dieses Cookie wird
      Sitzung-Cookie genannt und enthält keine weiteren Informationen, als die Zuordnung deines
      Anmeldevorgangs.
    </p>
    <h1>Wer hat Einsicht in deine Dokumente und Daten?</h1>
    <p>
      Alle von dir eingegebenen Informationen koennen nur vom Administrator/Inhaber
      (Oliver Zimpasser) dieser Seite eingesehen werden.
    </p>
    <h1>An wen werden deine Daten weitergegeben?</h1>
    <p>Deine Daten werden innerhalb dieser Webseite gespeichert. An andere Dritte erfolgt keine
    Weitergabe.</p>
    <h1>Wie lange erfolgt die Speicherung?</h1>
    <p>Deine Daten werden auf diesem Server solange gespeichert, bis du sie loescht. Dabei hast du
    die Kontrolle ueber alle Daten. Das Konto kannst du durch eine Email an die oben genanen Adresse
    loeschen lassen.</p>
    <h1>Einverständniserklärung zur Datenspeicherung und Datenverwendung:</h1>
    <p>
      Während der Kontoeröffnung, erklärt der Benutzer:
      Hiermit erkläre ich mich einverstanden, dass meine personenbezogenen Daten, die ich im
      Zusammenhang mit der Kontoeröffnung für diese Webseite offenbart habe, elektronisch
      gespeichert und im weiteren Verlauf verwendet werden. Andere Firmen und Personen dürfen meine
      Daten nicht erhalten. Außerdem stimme ich dem speichern des Session Cookies während des
      Anmeldevorgangs zu.
      Mir ist bekannt, dass ich meine Einwilligung jederzeit durch entsprechende Erklärung per
      E-Mail obige Adresse oder auf dem Postweg für die Zukunft widerrufen kann. Um meine Rechte
      auf Auskunft, Berichtigung und Löschung geltend zu machen, kann ich mich an dieselben Adressen
      wenden.
    </p>
  </div>
);

export default PortalPage;
