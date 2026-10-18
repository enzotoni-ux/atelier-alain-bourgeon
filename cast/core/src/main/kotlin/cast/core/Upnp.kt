package cast.core

import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node
import java.io.ByteArrayInputStream
import java.net.URL
import javax.xml.parsers.DocumentBuilderFactory

class UpnpException(message: String, val code: Int? = null) : Exception(message)

/** Une TV (ou tout lecteur DLNA) trouvée sur le réseau. */
data class Renderer(
    val name: String,
    val udn: String,
    val location: String,
    val avTransportUrl: String,
    val avTransportType: String,
    val renderingControlUrl: String?,
    val renderingControlType: String?
) {
    val host: String get() = URL(location).host
}

object Xml {
    fun parse(xml: String): Document {
        val f = DocumentBuilderFactory.newInstance()
        // Les TV n'ont aucune raison d'envoyer un DOCTYPE : on le refuse quand le parseur le permet.
        try { f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) } catch (e: Exception) { }
        val builder = f.newDocumentBuilder()
        return builder.parse(ByteArrayInputStream(xml.toByteArray(Charsets.UTF_8)))
    }

    fun escape(s: String): String = buildString(s.length + 16) {
        for (c in s) when (c) {
            '&' -> append("&amp;")
            '<' -> append("&lt;")
            '>' -> append("&gt;")
            '"' -> append("&quot;")
            '\'' -> append("&apos;")
            else -> append(c)
        }
    }

    fun localName(n: Node): String = n.nodeName.substringAfter(':')

    fun children(e: Element, name: String): List<Element> {
        val out = ArrayList<Element>()
        var c = e.firstChild
        while (c != null) {
            if (c is Element && localName(c) == name) out.add(c)
            c = c.nextSibling
        }
        return out
    }

    fun childText(e: Element, name: String): String? = children(e, name).firstOrNull()?.textContent?.trim()
}

object Upnp {
    const val AV_TRANSPORT = "urn:schemas-upnp-org:service:AVTransport:"
    const val RENDERING_CONTROL = "urn:schemas-upnp-org:service:RenderingControl:"

    /** Lit la description de l'appareil ; null si ce n'est pas un lecteur multimédia. */
    fun describe(location: String): Renderer? {
        val doc = Xml.parse(Net.get(location))
        val root = doc.documentElement
        val base = Xml.childText(root, "URLBase")?.takeIf { it.isNotEmpty() } ?: location
        val devices = ArrayList<Element>()
        fun collect(device: Element) {
            devices.add(device)
            for (list in Xml.children(device, "deviceList")) for (d in Xml.children(list, "device")) collect(d)
        }
        Xml.children(root, "device").forEach(::collect)

        for (device in devices) {
            val type = Xml.childText(device, "deviceType") ?: continue
            if (!type.contains("MediaRenderer")) continue
            var av: Pair<String, String>? = null
            var rc: Pair<String, String>? = null
            for (list in Xml.children(device, "serviceList")) for (s in Xml.children(list, "service")) {
                val sType = Xml.childText(s, "serviceType") ?: continue
                val control = Xml.childText(s, "controlURL") ?: continue
                val url = URL(URL(base), control).toString()
                if (sType.startsWith(AV_TRANSPORT)) av = url to sType
                if (sType.startsWith(RENDERING_CONTROL)) rc = url to sType
            }
            if (av == null) continue
            return Renderer(
                name = Xml.childText(device, "friendlyName") ?: "TV",
                udn = Xml.childText(device, "UDN") ?: location,
                location = location,
                avTransportUrl = av.first, avTransportType = av.second,
                renderingControlUrl = rc?.first, renderingControlType = rc?.second
            )
        }
        return null
    }

    /** Appel SOAP ; renvoie les éléments de la réponse (nom sans préfixe -> texte). */
    fun soap(controlUrl: String, serviceType: String, action: String, args: List<Pair<String, String>>): Map<String, String> {
        val body = buildString {
            append("<?xml version=\"1.0\" encoding=\"utf-8\"?>")
            append("<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">")
            append("<s:Body><u:$action xmlns:u=\"$serviceType\">")
            for ((k, v) in args) append("<$k>${Xml.escape(v)}</$k>")
            append("</u:$action></s:Body></s:Envelope>")
        }.toByteArray(Charsets.UTF_8)

        val c = Net.openConnection(URL(controlUrl))
        try {
            c.requestMethod = "POST"
            c.doOutput = true
            c.connectTimeout = 5000
            c.readTimeout = 10000
            c.setRequestProperty("Content-Type", "text/xml; charset=\"utf-8\"")
            c.setRequestProperty("SOAPACTION", "\"$serviceType#$action\"")
            c.setRequestProperty("User-Agent", Dlna.USER_AGENT)
            c.setFixedLengthStreamingMode(body.size)
            c.outputStream.use { it.write(body) }

            val code = c.responseCode
            val text = (if (code in 200..299) c.inputStream else c.errorStream)
                ?.use { it.readBytes().toString(Charsets.UTF_8) } ?: ""
            if (code !in 200..299) {
                val (upnpCode, desc) = parseError(text)
                throw UpnpException("$action refusé (HTTP $code${upnpCode?.let { ", UPnP $it" } ?: ""}${desc?.let { " : $it" } ?: ""})", upnpCode)
            }
            return parseResponse(text)
        } finally {
            c.disconnect()
        }
    }

    fun parseResponse(xml: String): Map<String, String> {
        if (xml.isBlank()) return emptyMap()
        val body = Xml.children(Xml.parse(xml).documentElement, "Body").firstOrNull() ?: return emptyMap()
        val response = body.firstChild.let { var n = it; while (n != null && n !is Element) n = n.nextSibling; n as? Element }
            ?: return emptyMap()
        val out = HashMap<String, String>()
        var c = response.firstChild
        while (c != null) {
            if (c is Element) out[Xml.localName(c)] = c.textContent
            c = c.nextSibling
        }
        return out
    }

    fun parseError(xml: String): Pair<Int?, String?> = try {
        val doc = Xml.parse(xml)
        val codes = doc.getElementsByTagName("errorCode")
        val descs = doc.getElementsByTagName("errorDescription")
        (if (codes.length > 0) codes.item(0).textContent.trim().toIntOrNull() else null) to
            (if (descs.length > 0) descs.item(0).textContent.trim() else null)
    } catch (e: Exception) {
        null to null
    }
}

object Didl {
    /** Métadonnées DIDL-Lite : sans elles, beaucoup de TV refusent de lire. */
    fun item(title: String, url: String, mime: String, size: Long): String =
        "<DIDL-Lite xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\" " +
            "xmlns:dc=\"http://purl.org/dc/elements/1.1/\" " +
            "xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\">" +
            "<item id=\"0\" parentID=\"-1\" restricted=\"1\">" +
            "<dc:title>${Xml.escape(title)}</dc:title>" +
            "<upnp:class>object.item.videoItem</upnp:class>" +
            "<res protocolInfo=\"http-get:*:$mime:${Dlna.CONTENT_FEATURES}\" size=\"$size\">${Xml.escape(url)}</res>" +
            "</item></DIDL-Lite>"
}

object Time {
    /** 3725 -> "1:02:05" */
    fun format(seconds: Int): String {
        val s = maxOf(0, seconds)
        return "%d:%02d:%02d".format(s / 3600, s / 60 % 60, s % 60)
    }

    /** "1:02:05" ou "0:00:12.500" -> secondes ; null si absent ou « NOT_IMPLEMENTED ». */
    fun parse(text: String?): Int? {
        if (text.isNullOrBlank()) return null
        val parts = text.trim().substringBefore('.').split(':')
        if (parts.size != 3) return null
        val n = parts.map { it.toIntOrNull() ?: return null }
        return n[0] * 3600 + n[1] * 60 + n[2]
    }
}

class AvTransport(private val renderer: Renderer) {
    private fun call(action: String, vararg args: Pair<String, String>) =
        Upnp.soap(renderer.avTransportUrl, renderer.avTransportType, action, listOf("InstanceID" to "0") + args)

    fun setUri(uri: String, metadata: String) {
        call("SetAVTransportURI", "CurrentURI" to uri, "CurrentURIMetaData" to metadata)
    }

    fun play() { call("Play", "Speed" to "1") }
    fun pause() { call("Pause") }
    fun stop() { call("Stop") }
    fun seek(seconds: Int) { call("Seek", "Unit" to "REL_TIME", "Target" to Time.format(seconds)) }

    data class Position(val durationSec: Int?, val positionSec: Int?)

    fun position(): Position {
        val r = call("GetPositionInfo")
        return Position(Time.parse(r["TrackDuration"]), Time.parse(r["RelTime"]))
    }

    /** PLAYING, PAUSED_PLAYBACK, STOPPED, TRANSITIONING, NO_MEDIA_PRESENT… */
    fun state(): String = call("GetTransportInfo")["CurrentTransportState"] ?: "UNKNOWN"
}

class RenderingControl(private val renderer: Renderer) {
    val available: Boolean get() = renderer.renderingControlUrl != null

    private fun call(action: String, vararg args: Pair<String, String>): Map<String, String> {
        val url = renderer.renderingControlUrl ?: throw UpnpException("Pas de contrôle du volume sur cette TV")
        return Upnp.soap(url, renderer.renderingControlType!!, action, listOf("InstanceID" to "0", "Channel" to "Master") + args)
    }

    fun volume(): Int? = call("GetVolume")["CurrentVolume"]?.trim()?.toIntOrNull()
    fun setVolume(percent: Int) { call("SetVolume", "DesiredVolume" to percent.coerceIn(0, 100).toString()) }
}
