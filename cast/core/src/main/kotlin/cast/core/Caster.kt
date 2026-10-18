package cast.core

import java.net.URL

/** Une lecture en cours sur une TV. */
class CastSession(val renderer: Renderer, val url: String) {
    val transport = AvTransport(renderer)
    val volume = RenderingControl(renderer)
}

class Caster(private val server: MediaServer = MediaServer()) {

    /** Cherche les TV du réseau (à appeler hors du thread principal). */
    fun findRenderers(timeoutMs: Int = 3000): List<Renderer> =
        Ssdp.discover(timeoutMs = timeoutMs).mapNotNull {
            try { Upnp.describe(it) } catch (e: Exception) { null }
        }.distinctBy { it.udn }

    /** Publie [source], l'envoie à [renderer] et lance la lecture. */
    fun cast(renderer: Renderer, source: MediaSource): CastSession {
        server.start()
        val ip = Net.localAddressFor(URL(renderer.location).host)
        val url = "http://$ip:${server.port}${server.publish(source)}"
        val session = CastSession(renderer, url)

        // Si la TV lit déjà quelque chose, certaines refusent un nouveau média sans arrêt préalable.
        try { session.transport.stop() } catch (e: UpnpException) { }
        session.transport.setUri(url, Didl.item(source.name, url, source.mime, source.length))
        playWithRetry(session.transport)
        return session
    }

    // Juste après SetAVTransportURI, la TV est souvent en transition et répond « 701 / 500 » au premier Play.
    private fun playWithRetry(t: AvTransport) {
        var last: UpnpException? = null
        repeat(6) {
            try { t.play(); return } catch (e: UpnpException) { last = e; Thread.sleep(500) }
        }
        throw last!!
    }

    fun stopServer() = server.stop()
}
