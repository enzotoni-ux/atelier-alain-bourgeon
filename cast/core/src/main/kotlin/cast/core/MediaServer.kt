package cast.core

import java.io.BufferedInputStream
import java.io.InputStream
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.net.URLEncoder
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

object Dlna {
    const val USER_AGENT = "Linux/3.0 UPnP/1.0 CastPhone/1.0"

    /** OP=01 : requêtes Range acceptées ; FLAGS : streaming par octets, connexion « stalling » autorisée. */
    const val CONTENT_FEATURES = "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000"
}

sealed class RangeResult {
    object Full : RangeResult()
    data class Partial(val start: Long, val end: Long) : RangeResult()
    object Unsatisfiable : RangeResult()
}

/** Serveur HTTP minimal (GET/HEAD + Range) : ce que la TV télécharge pour lire le film. */
class MediaServer(private val bindPort: Int = 0) {
    private var server: ServerSocket? = null
    private val sources = ConcurrentHashMap<String, MediaSource>()
    private val ids = AtomicInteger()
    private val pool = Executors.newCachedThreadPool { r -> Thread(r, "media-http").apply { isDaemon = true } }

    val port: Int get() = server?.localPort ?: -1

    @Synchronized
    fun start(): Int {
        if (server == null) {
            val s = ServerSocket(bindPort)
            server = s
            pool.execute { acceptLoop(s) }
        }
        return port
    }

    /** Publie un film et renvoie son chemin (à préfixer par http://ip:port). */
    fun publish(source: MediaSource): String {
        val id = ids.incrementAndGet().toString()
        sources[id] = source
        val safeName = URLEncoder.encode(source.name, "UTF-8").replace("+", "%20")
        return "/media/$id/$safeName"
    }

    fun unpublishAll() = sources.clear()

    @Synchronized
    fun stop() {
        server?.close()
        server = null
        sources.clear()
    }

    private fun acceptLoop(s: ServerSocket) {
        while (!s.isClosed) {
            val socket = try { s.accept() } catch (e: SocketException) { return }
            pool.execute { handle(socket) }
        }
    }

    private fun handle(socket: Socket) {
        socket.use {
            try {
                socket.soTimeout = 15_000
                val input = BufferedInputStream(socket.getInputStream())
                val out = socket.getOutputStream()
                val requestLine = readLine(input) ?: return
                val headers = HashMap<String, String>()
                while (true) {
                    val line = readLine(input) ?: return
                    if (line.isEmpty()) break
                    val i = line.indexOf(':')
                    if (i > 0) headers[line.substring(0, i).trim().lowercase()] = line.substring(i + 1).trim()
                }
                respond(requestLine, headers, out)
            } catch (e: SocketException) {
                // La TV a fermé la connexion (changement de position, arrêt) : normal.
            } catch (e: java.io.IOException) {
                // idem
            }
        }
    }

    private fun respond(requestLine: String, headers: Map<String, String>, out: OutputStream) {
        val parts = requestLine.split(' ')
        if (parts.size < 2) return writeStatus(out, 400, "Bad Request")
        val method = parts[0]
        if (method != "GET" && method != "HEAD") return writeStatus(out, 405, "Method Not Allowed")

        val path = parts[1].substringBefore('?')
        val segments = path.split('/')
        val source = (if (segments.size >= 3 && segments[1] == "media") sources[segments[2]] else null)
            ?: return writeStatus(out, 404, "Not Found")

        val length = source.length
        val head = StringBuilder()
        val range = parseRange(headers["range"], length)
        val (status, start, count) = when (range) {
            RangeResult.Full -> Triple("200 OK", 0L, length)
            is RangeResult.Partial -> {
                head.append("Content-Range: bytes ${range.start}-${range.end}/$length\r\n")
                Triple("206 Partial Content", range.start, range.end - range.start + 1)
            }
            RangeResult.Unsatisfiable -> {
                writeRaw(out, "HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */$length\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                return
            }
        }
        val header = "HTTP/1.1 $status\r\n" +
            "Content-Type: ${source.mime}\r\n" +
            "Content-Length: $count\r\n" +
            "Accept-Ranges: bytes\r\n" +
            head +
            "transferMode.dlna.org: Streaming\r\n" +
            "contentFeatures.dlna.org: ${Dlna.CONTENT_FEATURES}\r\n" +
            "Connection: close\r\n\r\n"
        writeRaw(out, header)
        if (method == "HEAD" || count == 0L) return
        source.open(start).use { copy(it, out, count) }
    }

    private fun copy(input: InputStream, out: OutputStream, count: Long) {
        val buf = ByteArray(64 * 1024)
        var left = count
        while (left > 0) {
            val n = input.read(buf, 0, minOf(buf.size.toLong(), left).toInt())
            if (n < 0) break
            out.write(buf, 0, n)
            left -= n
        }
        out.flush()
    }

    private fun writeStatus(out: OutputStream, code: Int, text: String) =
        writeRaw(out, "HTTP/1.1 $code $text\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")

    private fun writeRaw(out: OutputStream, s: String) {
        out.write(s.toByteArray(Charsets.ISO_8859_1))
        out.flush()
    }

    private fun readLine(input: InputStream): String? {
        val sb = StringBuilder()
        while (true) {
            val c = input.read()
            if (c < 0) return if (sb.isEmpty()) null else sb.toString()
            if (c == '\n'.code) return sb.toString().trimEnd('\r')
            sb.append(c.toChar())
            if (sb.length > 16 * 1024) throw java.io.IOException("Ligne trop longue")
        }
    }

    companion object {
        /** bytes=a-b | a- | -n ; plusieurs plages : on ignore l'en-tête et on sert tout. */
        fun parseRange(header: String?, length: Long): RangeResult {
            if (header == null) return RangeResult.Full
            val spec = header.trim()
            if (!spec.startsWith("bytes=") || spec.contains(',')) return RangeResult.Full
            val (a, b) = spec.removePrefix("bytes=").split('-', limit = 2).let {
                if (it.size < 2) return RangeResult.Full else it[0].trim() to it[1].trim()
            }
            if (length <= 0) return RangeResult.Unsatisfiable
            return try {
                if (a.isEmpty()) {
                    val n = b.toLong()
                    if (n <= 0) RangeResult.Unsatisfiable
                    else RangeResult.Partial(maxOf(0L, length - n), length - 1)
                } else {
                    val start = a.toLong()
                    val end = if (b.isEmpty()) length - 1 else minOf(b.toLong(), length - 1)
                    if (start >= length || end < start) RangeResult.Unsatisfiable
                    else RangeResult.Partial(start, end)
                }
            } catch (e: NumberFormatException) {
                RangeResult.Full
            }
        }
    }
}
