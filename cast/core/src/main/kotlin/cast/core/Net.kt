package cast.core

import java.net.DatagramSocket
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.URL

/**
 * Accès réseau, avec deux points d'ancrage pour Android : sur un téléphone qui a aussi la 4G,
 * il faut forcer les connexions et les datagrammes sur le réseau Wi-Fi, sinon la TV est injoignable.
 */
object Net {
    @Volatile var openConnection: (URL) -> HttpURLConnection = { it.openConnection() as HttpURLConnection }
    @Volatile var newDatagramSocket: () -> DatagramSocket = { DatagramSocket() }

    /** Adresse IPv4 locale à annoncer à la TV (renseignée par l'appli = adresse Wi-Fi). */
    @Volatile var preferredLocalAddress: String? = null

    fun localAddressFor(host: String): String {
        preferredLocalAddress?.let { return it }
        // Aucun paquet n'est envoyé : connect() sur UDP choisit juste l'interface de sortie.
        val socket = newDatagramSocket()
        try {
            socket.connect(InetAddress.getByName(host), 9)
            return socket.localAddress.hostAddress ?: error("Adresse locale introuvable")
        } finally {
            socket.close()
        }
    }

    fun get(url: String, timeoutMs: Int = 5000): String {
        val c = openConnection(URL(url))
        try {
            c.connectTimeout = timeoutMs
            c.readTimeout = timeoutMs
            c.setRequestProperty("User-Agent", Dlna.USER_AGENT)
            if (c.responseCode !in 200..299) throw UpnpException("HTTP ${c.responseCode} sur $url")
            return c.inputStream.use { it.readBytes().toString(Charsets.UTF_8) }
        } finally {
            c.disconnect()
        }
    }
}
