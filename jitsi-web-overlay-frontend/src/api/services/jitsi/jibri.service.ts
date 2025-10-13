export function handleJibriApitechApi(
    jitsiAPIOptions: any,
    enableJibriApitechApi: string,
    jibriApitechApiDomain: string
) {
    if (!(enableJibriApitechApi === 'true' && jibriApitechApiDomain)) return;

    const { eventId, roomName, uploadCallbackJwt, uploadCallbackUrl, uploadCallbackDomainUrl } = jitsiAPIOptions;

    if (!eventId || !roomName || !uploadCallbackJwt) {
        console.warn('Paramètres Jibri manquants');
        return;
    }

    const url = `${jibriApitechApiDomain}/visioreplay/${roomName}/register_eventid`;
    const body = { eventid: eventId, jwt: uploadCallbackJwt, uploadCallbackUrl, uploadCallbackDomainUrl };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then((text) => console.log('Jibri API Response:', text))
        .catch((err) => console.error('Erreur API Jibri :', err));
}