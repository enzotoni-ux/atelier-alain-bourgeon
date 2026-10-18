package cast.core

import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Random
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class MediaServerTest {
    private lateinit var file: File
    private lateinit var data: ByteArray
    private val server = MediaServer()
    private lateinit var base: String

    @BeforeTest fun setUp() {
        data = ByteArray(3 * 1024 * 1024 + 123).also { Random(42).nextBytes(it) }
        file = File.createTempFile("film", ".mkv").apply { writeBytes(data); deleteOnExit() }
        val port = server.start()
        base = "http://127.0.0.1:$port" + server.publish(FileMediaSource(file))
    }

    @AfterTest fun tearDown() { server.stop(); file.delete() }

    private fun request(url: String, method: String = "GET", range: String? = null): Pair<HttpURLConnection, ByteArray> {
        val c = URL(url).openConnection() as HttpURLConnection
        c.requestMethod = method
        range?.let { c.setRequestProperty("Range", it) }
        val code = c.responseCode
        val bytes = if (method == "HEAD") ByteArray(0) else ((if (code < 400) c.inputStream else c.errorStream)?.readBytes() ?: ByteArray(0))
        return c to bytes
    }

    @Test fun fullDownloadIsByteIdentical() {
        val (c, bytes) = request(base)
        assertEquals(200, c.responseCode)
        assertEquals("video/x-matroska", c.contentType)
        assertEquals("bytes", c.getHeaderField("Accept-Ranges"))
        assertEquals("Streaming", c.getHeaderField("transferMode.dlna.org"))
        assertContentEquals(data, bytes)
    }

    @Test fun headReturnsLengthWithoutBody() {
        val (c, bytes) = request(base, "HEAD")
        assertEquals(200, c.responseCode)
        assertEquals(data.size.toLong(), c.getHeaderField("Content-Length").toLong())
        assertEquals(0, bytes.size)
    }

    @Test fun middleRange() {
        val (c, bytes) = request(base, range = "bytes=1000000-1999999")
        assertEquals(206, c.responseCode)
        assertEquals("bytes 1000000-1999999/${data.size}", c.getHeaderField("Content-Range"))
        assertContentEquals(data.copyOfRange(1_000_000, 2_000_000), bytes)
    }

    @Test fun tailRangeForSeekingToMoovAtEndOfFile() {
        val (c, bytes) = request(base, range = "bytes=-4096")
        assertEquals(206, c.responseCode)
        assertContentEquals(data.copyOfRange(data.size - 4096, data.size), bytes)
    }

    @Test fun openEndedRange() {
        val (_, bytes) = request(base, range = "bytes=${data.size - 10}-")
        assertContentEquals(data.copyOfRange(data.size - 10, data.size), bytes)
    }

    @Test fun rangeBeyondFileIs416() {
        val (c, _) = request(base, range = "bytes=${data.size}-")
        assertEquals(416, c.responseCode)
    }

    @Test fun unknownPathIs404() {
        val port = server.port
        assertEquals(404, request("http://127.0.0.1:$port/media/999/x.mkv").first.responseCode)
        assertEquals(404, request("http://127.0.0.1:$port/").first.responseCode)
    }

    @Test fun postIs405() {
        val c = URL(base).openConnection() as HttpURLConnection
        c.requestMethod = "POST"
        c.doOutput = true
        c.outputStream.use { it.write(1) }
        assertEquals(405, c.responseCode)
    }

    @Test fun accentedAndSpacedNamesAreServed() {
        val f = File.createTempFile("xyz", ".mp4").apply { writeBytes(byteArrayOf(1, 2, 3)); deleteOnExit() }
        val named = object : MediaSource by FileMediaSource(f) { override val name = "Amélie Poulain (2001) 1080p.mp4" }
        val path = server.publish(named)
        val (c, bytes) = request("http://127.0.0.1:${server.port}$path")
        assertEquals(200, c.responseCode)
        assertContentEquals(byteArrayOf(1, 2, 3), bytes)
    }

    @Test fun clientAbortingMidStreamDoesNotKillTheServer() {
        val c = URL(base).openConnection() as HttpURLConnection
        c.inputStream.use { it.read(ByteArray(1000)) }   // lit un peu puis coupe, comme une TV qui saute dans le film
        c.disconnect()
        val (c2, bytes) = request(base, range = "bytes=0-9")
        assertEquals(206, c2.responseCode)
        assertContentEquals(data.copyOfRange(0, 10), bytes)
    }

    @Test fun parallelDownloadsAreIndependent() {
        val errors = java.util.concurrent.CopyOnWriteArrayList<String>()
        val threads = (0 until 4).map { i ->
            Thread {
                val start = i * 500_000
                val (_, bytes) = request(base, range = "bytes=$start-${start + 499_999}")
                if (!bytes.contentEquals(data.copyOfRange(start, start + 500_000))) errors.add("plage $i différente")
            }.also { it.start() }
        }
        threads.forEach { it.join() }
        assertTrue(errors.isEmpty(), errors.joinToString())
    }
}

class CastingFlowTest {
    private lateinit var tv: MockRenderer
    private lateinit var file: File
    private lateinit var data: ByteArray

    @BeforeTest fun setUp() {
        data = ByteArray(1_000_000).also { Random(7).nextBytes(it) }
        file = File.createTempFile("Mon film & co", ".mp4").apply { writeBytes(data); deleteOnExit() }
    }

    @AfterTest fun tearDown() { if (::tv.isInitialized) tv.close(); file.delete() }

    private fun renderer(): Renderer {
        val locations = Ssdp.discover(timeoutMs = 1500, dest = tv.ssdpAddress)
        assertEquals(1, locations.size, "la TV doit répondre une seule fois (doublons retirés)")
        return assertNotNull(Upnp.describe(locations[0]))
    }

    @Test fun discoveryFindsTheTvAndReadsItsDescription() {
        tv = MockRenderer()
        val r = renderer()
        assertEquals("Salon [Test] & Co", r.name)
        assertEquals("uuid:mock-1", r.udn)
        assertEquals("http://127.0.0.1:${tv.httpPort}/avt/control", r.avTransportUrl)
        assertEquals("http://127.0.0.1:${tv.httpPort}/rc/control", r.renderingControlUrl)
    }

    @Test fun fullCastFlowAndTvCanDownloadTheMovie() {
        tv = MockRenderer()
        val caster = Caster()
        try {
            val session = caster.cast(renderer(), FileMediaSource(file))

            assertEquals(listOf("Stop", "SetAVTransportURI", "Play"), tv.actions.toList())
            assertTrue(tv.soapActionHeaders.all { it.startsWith("\"urn:schemas-upnp-org:service:AVTransport:1#") })
            assertEquals(session.url, tv.currentUri)
            assertEquals("PLAYING", session.transport.state())

            // Les métadonnées reçues par la TV sont du XML valide et contiennent le titre et le type MIME.
            val meta = Xml.parse(assertNotNull(tv.currentMetadata))
            assertTrue(meta.documentElement.textContent.contains(file.name))
            assertTrue(tv.currentMetadata!!.contains("http-get:*:video/mp4:DLNA.ORG_OP=01"))

            // La « TV » télécharge l'adresse reçue, comme le ferait un vrai lecteur.
            val c = URL(tv.currentUri).openConnection() as HttpURLConnection
            c.setRequestProperty("Range", "bytes=250000-259999")
            assertEquals(206, c.responseCode)
            assertContentEquals(data.copyOfRange(250_000, 260_000), c.inputStream.readBytes())
        } finally {
            caster.stopServer()
        }
    }

    @Test fun playRetriesWhileTvIsTransitioning() {
        tv = MockRenderer(failFirstPlays = 2)
        val caster = Caster()
        try {
            val session = caster.cast(renderer(), FileMediaSource(file))
            assertEquals(3, tv.actions.count { it == "Play" })
            assertEquals("PLAYING", session.transport.state())
        } finally { caster.stopServer() }
    }

    @Test fun controlsPositionSeekPauseStopVolume() {
        tv = MockRenderer()
        val caster = Caster()
        try {
            val s = caster.cast(renderer(), FileMediaSource(file))
            val pos = s.transport.position()
            assertEquals(5400, pos.durationSec)
            assertEquals(754, pos.positionSec)

            s.transport.seek(3725)
            assertEquals("1:02:05", tv.lastSeek)

            s.transport.pause()
            assertEquals("PAUSED_PLAYBACK", s.transport.state())
            s.transport.stop()
            assertEquals("STOPPED", s.transport.state())

            assertTrue(s.volume.available)
            assertEquals(30, s.volume.volume())
            s.volume.setVolume(150)
            assertEquals(100, tv.volume, "le volume doit être borné à 100")
        } finally { caster.stopServer() }
    }

    @Test fun tvWithoutRenderingControlIsHandled() {
        tv = MockRenderer(withRenderingControl = false)
        val r = renderer()
        assertEquals(null, r.renderingControlUrl)
        assertEquals(false, RenderingControl(r).available)
        assertFailsWith<UpnpException> { RenderingControl(r).volume() }
    }

    @Test fun unreachableTvGivesAReadableError() {
        tv = MockRenderer()
        val r = renderer()
        tv.close()
        val e = assertFailsWith<Exception> { AvTransport(r).play() }
        assertTrue(e is java.io.IOException || e is UpnpException)
    }

    @Test fun discoveryWithNobodyAnsweringReturnsEmptyQuickly() {
        tv = MockRenderer()
        val silent = java.net.DatagramSocket(0, java.net.InetAddress.getByName("127.0.0.1"))
        try {
            val t0 = System.currentTimeMillis()
            val found = Ssdp.discover(timeoutMs = 600, dest = java.net.InetSocketAddress(java.net.InetAddress.getByName("127.0.0.1"), silent.localPort))
            assertTrue(found.isEmpty())
            assertTrue(System.currentTimeMillis() - t0 < 2000)
        } finally { silent.close() }
    }
}
