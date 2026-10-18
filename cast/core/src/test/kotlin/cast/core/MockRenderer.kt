package cast.core

import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.util.concurrent.CopyOnWriteArrayList

/** Fausse TV DLNA : répond au SSDP, publie sa description et accepte les commandes AVTransport. */
class MockRenderer(private val failFirstPlays: Int = 0, private val withRenderingControl: Boolean = true) : AutoCloseable {
    val actions = CopyOnWriteArrayList<String>()
    val soapActionHeaders = CopyOnWriteArrayList<String>()
    @Volatile var currentUri: String? = null
    @Volatile var currentMetadata: String? = null
    @Volatile var lastSeek: String? = null
    @Volatile var volume = 30
    @Volatile var state = "STOPPED"
    private var playsSeen = 0

    private val http = HttpServer.create(InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 0)
    private val udp = DatagramSocket(0, InetAddress.getByName("127.0.0.1"))
    val httpPort get() = http.address.port
    val ssdpAddress get() = InetSocketAddress(InetAddress.getByName("127.0.0.1"), udp.localPort)
    @Volatile private var running = true

    init {
        http.createContext("/desc.xml") { ex ->
            val rc = if (withRenderingControl)
                """<service><serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType><controlURL>/rc/control</controlURL></service>"""
            else ""
            reply(ex, 200, """<?xml version="1.0"?><root xmlns="urn:schemas-upnp-org:device-1-0"><device>
                <deviceType>urn:schemas-upnp-org:device:MediaRenderer:1</deviceType>
                <friendlyName>Salon [Test] &amp; Co</friendlyName><UDN>uuid:mock-1</UDN>
                <serviceList>
                  <service><serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType><controlURL>/avt/control</controlURL></service>
                  $rc
                </serviceList></device></root>""")
        }
        http.createContext("/avt/control") { ex -> handleSoap(ex, "urn:schemas-upnp-org:service:AVTransport:1") }
        http.createContext("/rc/control") { ex -> handleSoap(ex, "urn:schemas-upnp-org:service:RenderingControl:1") }
        http.start()

        Thread {
            val buf = ByteArray(2048)
            while (running) {
                try {
                    val p = DatagramPacket(buf, buf.size)
                    udp.receive(p)
                    val text = String(p.data, 0, p.length)
                    if (text.startsWith("M-SEARCH") && text.contains("MediaRenderer")) {
                        val resp = "HTTP/1.1 200 OK\r\nCACHE-CONTROL: max-age=1800\r\nLOCATION: http://127.0.0.1:$httpPort/desc.xml\r\n" +
                            "ST: ${Ssdp.MEDIA_RENDERER}\r\nUSN: uuid:mock-1::${Ssdp.MEDIA_RENDERER}\r\n\r\n"
                        val b = resp.toByteArray()
                        udp.send(DatagramPacket(b, b.size, p.socketAddress))
                    }
                } catch (e: Exception) {
                    if (!running) return@Thread
                }
            }
        }.apply { isDaemon = true }.start()
    }

    private fun reply(ex: HttpExchange, code: Int, body: String) {
        val bytes = body.toByteArray()
        ex.responseHeaders.add("Content-Type", "text/xml; charset=\"utf-8\"")
        ex.sendResponseHeaders(code, bytes.size.toLong())
        ex.responseBody.use { it.write(bytes) }
    }

    private fun tag(body: String, name: String): String? =
        Regex("<$name>(.*?)</$name>", RegexOption.DOT_MATCHES_ALL).find(body)?.groupValues?.get(1)?.let { unescape(it) }

    private fun unescape(s: String) = s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&apos;", "'").replace("&amp;", "&")

    private fun handleSoap(ex: HttpExchange, serviceType: String) {
        val body = ex.requestBody.readBytes().toString(Charsets.UTF_8)
        val header = ex.requestHeaders.getFirst("SOAPACTION") ?: ""
        soapActionHeaders.add(header)
        val action = header.trim('"').substringAfter('#')
        actions.add(action)
        fun ok(inner: String = "") = reply(ex, 200,
            """<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:${action}Response xmlns:u="$serviceType">$inner</u:${action}Response></s:Body></s:Envelope>""")
        when (action) {
            "SetAVTransportURI" -> { currentUri = tag(body, "CurrentURI"); currentMetadata = tag(body, "CurrentURIMetaData"); state = "STOPPED"; ok() }
            "Play" -> {
                playsSeen++
                if (playsSeen <= failFirstPlays) {
                    reply(ex, 500, """<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><s:Fault><detail>
                        <UPnPError xmlns="urn:schemas-upnp-org:control-1-0"><errorCode>701</errorCode><errorDescription>Transition not available</errorDescription></UPnPError>
                        </detail></s:Fault></s:Body></s:Envelope>""")
                } else { state = "PLAYING"; ok() }
            }
            "Pause" -> { state = "PAUSED_PLAYBACK"; ok() }
            "Stop" -> { state = "STOPPED"; ok() }
            "Seek" -> { lastSeek = tag(body, "Target"); ok() }
            "GetPositionInfo" -> ok("<TrackDuration>1:30:00</TrackDuration><RelTime>0:12:34</RelTime>")
            "GetTransportInfo" -> ok("<CurrentTransportState>$state</CurrentTransportState><CurrentTransportStatus>OK</CurrentTransportStatus>")
            "GetVolume" -> ok("<CurrentVolume>$volume</CurrentVolume>")
            "SetVolume" -> { volume = tag(body, "DesiredVolume")!!.toInt(); ok() }
            else -> reply(ex, 500, "<error/>")
        }
    }

    override fun close() {
        running = false
        udp.close()
        http.stop(0)
    }
}
