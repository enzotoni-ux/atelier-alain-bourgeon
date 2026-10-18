package cast.core

import java.net.DatagramPacket
import java.net.InetSocketAddress
import java.net.SocketTimeoutException

object Ssdp {
    const val MULTICAST_HOST = "239.255.255.250"
    const val PORT = 1900
    const val MEDIA_RENDERER = "urn:schemas-upnp-org:device:MediaRenderer:1"

    fun searchMessage(target: String = MEDIA_RENDERER, mx: Int = 2): String =
        "M-SEARCH * HTTP/1.1\r\nHOST: $MULTICAST_HOST:$PORT\r\nMAN: \"ssdp:discover\"\r\nMX: $mx\r\nST: $target\r\n\r\n"

    /** En-têtes d'une réponse SSDP, clés en minuscules. */
    fun parse(packet: String): Map<String, String> {
        val map = HashMap<String, String>()
        for (line in packet.split("\r\n", "\n").drop(1)) {
            val i = line.indexOf(':')
            if (i > 0) map[line.substring(0, i).trim().lowercase()] = line.substring(i + 1).trim()
        }
        return map
    }

    /** Adresses `LOCATION` des appareils qui répondent dans le délai (doublons retirés). */
    fun discover(
        target: String = MEDIA_RENDERER,
        timeoutMs: Int = 3000,
        dest: InetSocketAddress = InetSocketAddress(MULTICAST_HOST, PORT)
    ): List<String> {
        val found = LinkedHashSet<String>()
        val socket = Net.newDatagramSocket()
        try {
            val msg = searchMessage(target).toByteArray(Charsets.US_ASCII)
            // L'UDP se perd : on envoie deux fois.
            repeat(2) { socket.send(DatagramPacket(msg, msg.size, dest)) }
            val deadline = System.currentTimeMillis() + timeoutMs
            val buf = ByteArray(4096)
            while (true) {
                val left = deadline - System.currentTimeMillis()
                if (left <= 0) break
                socket.soTimeout = left.toInt()
                try {
                    val p = DatagramPacket(buf, buf.size)
                    socket.receive(p)
                    val headers = parse(String(p.data, 0, p.length, Charsets.UTF_8))
                    val st = headers["st"] ?: headers["nt"]
                    val location = headers["location"]
                    if (location != null && (st == null || st == target || st.contains("MediaRenderer"))) found.add(location)
                } catch (e: SocketTimeoutException) {
                    break
                }
            }
        } finally {
            socket.close()
        }
        return found.toList()
    }
}
